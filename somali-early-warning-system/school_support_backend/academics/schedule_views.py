"""
Admin Interface for School Timetable Management
Professional scheduling system for capstone project
"""
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone
from datetime import datetime, timedelta

from .schedule_models import SchoolTimetable, TimetableTemplate, get_attendance_completion_rate
from .models import Subject, TeachingAssignment
from students.models import Classroom
from users.models import User


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_school_timetable(request):
    """
    Get complete school timetable
    Admin: See everything
    Form Master: See their classroom only
    Teacher: See their assignments only
    """
    user = request.user
    
    if user.role == 'admin':
        timetables = SchoolTimetable.objects.filter(is_active=True).select_related(
            'classroom', 'subject', 'teacher'
        ).order_by('classroom__name', 'day_of_week', 'period')
        
    elif user.role == 'form_master':
        classroom = getattr(user, 'managed_classroom', None)
        if not classroom:
            return Response({'error': 'No classroom assigned'}, status=400)
        
        timetables = SchoolTimetable.objects.filter(
            classroom=classroom,
            is_active=True
        ).select_related('subject', 'teacher').order_by('day_of_week', 'period')
        
    elif user.role == 'teacher':
        timetables = SchoolTimetable.objects.filter(
            teacher=user,
            is_active=True
        ).select_related('classroom', 'subject').order_by('day_of_week', 'period')
        
    else:
        return Response({'error': 'Unauthorized'}, status=403)
    
    # Format response
    schedule_data = {}
    for tt in timetables:
        day = tt.day_of_week
        if day not in schedule_data:
            schedule_data[day] = []
        
        schedule_data[day].append({
            'period': tt.period,
            'period_display': tt.get_period_display(),
            'classroom': tt.classroom.name,
            'subject': tt.subject.name,
            'teacher': tt.teacher.name,
            'teacher_email': tt.teacher.email,
        })
    
    return Response({
        'schedule': schedule_data,
        'user_role': user.role,
        'total_slots': len(timetables)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_timetable_entry(request):
    """
    Admin creates individual timetable entries
    """
    if request.user.role != 'admin':
        raise PermissionDenied("Only administrators can create timetable entries")
    
    data = request.data
    
    try:
        with transaction.atomic():
            # Validate required fields
            required_fields = ['classroom_id', 'teacher_id', 'subject_id', 'day_of_week', 'period']
            for field in required_fields:
                if field not in data:
                    return Response({'error': f'Missing required field: {field}'}, status=400)
            
            # Get objects
            classroom = Classroom.objects.get(class_id=data['classroom_id'])
            teacher = User.objects.get(id=data['teacher_id'], role='teacher')
            subject = Subject.objects.get(subject_id=data['subject_id'])
            
            # Check for conflicts
            from .schedule_models import check_schedule_conflicts
            conflicts = check_schedule_conflicts(
                teacher, classroom, data['day_of_week'], data['period']
            )
            
            if conflicts:
                return Response({'error': 'Scheduling conflicts', 'conflicts': conflicts}, status=400)
            
            # Create timetable entry
            timetable = SchoolTimetable.objects.create(
                classroom=classroom,
                teacher=teacher,
                subject=subject,
                day_of_week=data['day_of_week'],
                period=data['period'],
                academic_year=data.get('academic_year', '2024-2025'),
                term=data.get('term', 'Term 1'),
                created_by=request.user
            )
            
            # Also create/update TeachingAssignment for compatibility
            TeachingAssignment.objects.get_or_create(
                teacher=teacher,
                subject=subject,
                classroom=classroom,
                defaults={'is_active': True}
            )
            
            return Response({
                'message': 'Timetable entry created successfully',
                'timetable_id': timetable.timetable_id,
                'details': f"{classroom.name} | {timetable.get_day_of_week_display()} P{timetable.period} | {subject.name} ({teacher.name})"
            })
            
    except Classroom.DoesNotExist:
        return Response({'error': 'Classroom not found'}, status=404)
    except User.DoesNotExist:
        return Response({'error': 'Teacher not found'}, status=404)
    except Subject.DoesNotExist:
        return Response({'error': 'Subject not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_create_timetable(request):
    """
    Admin creates complete weekly schedule for a classroom
    """
    if request.user.role != 'admin':
        raise PermissionDenied("Only administrators can create bulk timetables")
    
    data = request.data
    classroom_id = data.get('classroom_id')
    schedule = data.get('schedule', {})  # {day: {period: {teacher_id, subject_id}}}
    
    if not classroom_id or not schedule:
        return Response({'error': 'Missing classroom_id or schedule data'}, status=400)
    
    try:
        classroom = Classroom.objects.get(class_id=classroom_id)
        created_entries = []
        errors = []
        
        with transaction.atomic():
            for day, periods in schedule.items():
                for period, assignment in periods.items():
                    try:
                        teacher = User.objects.get(id=assignment['teacher_id'], role='teacher')
                        subject = Subject.objects.get(subject_id=assignment['subject_id'])
                        
                        # Check conflicts
                        from .schedule_models import check_schedule_conflicts
                        conflicts = check_schedule_conflicts(teacher, classroom, day, period)
                        
                        if conflicts:
                            errors.append(f"{day} P{period}: {', '.join(conflicts)}")
                            continue
                        
                        # Create entry
                        timetable = SchoolTimetable.objects.create(
                            classroom=classroom,
                            teacher=teacher,
                            subject=subject,
                            day_of_week=day,
                            period=period,
                            academic_year=data.get('academic_year', '2024-2025'),
                            term=data.get('term', 'Term 1'),
                            created_by=request.user
                        )
                        
                        created_entries.append(f"{day} P{period}: {subject.name} ({teacher.name})")
                        
                        # Update TeachingAssignment
                        TeachingAssignment.objects.get_or_create(
                            teacher=teacher,
                            subject=subject,
                            classroom=classroom,
                            defaults={'is_active': True}
                        )
                        
                    except (User.DoesNotExist, Subject.DoesNotExist) as e:
                        errors.append(f"{day} P{period}: {str(e)}")
        
        return Response({
            'message': f'Bulk timetable creation completed',
            'created': len(created_entries),
            'created_entries': created_entries,
            'errors': errors
        })
        
    except Classroom.DoesNotExist:
        return Response({'error': 'Classroom not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_teacher_schedule(request, teacher_id=None):
    """
    Get schedule for a specific teacher
    """
    if request.user.role not in ['admin', 'teacher']:
        raise PermissionDenied("Unauthorized")
    
    # Teachers can only see their own schedule
    if request.user.role == 'teacher':
        teacher_id = request.user.id
    
    if not teacher_id:
        teacher_id = request.user.id
    
    try:
        teacher = User.objects.get(id=teacher_id, role='teacher')
        
        schedule = SchoolTimetable.objects.filter(
            teacher=teacher,
            is_active=True
        ).select_related('classroom', 'subject').order_by('day_of_week', 'period')
        
        # Group by day
        weekly_schedule = {}
        for entry in schedule:
            day = entry.day_of_week
            if day not in weekly_schedule:
                weekly_schedule[day] = []
            
            weekly_schedule[day].append({
                'period': entry.period,
                'period_display': entry.get_period_display(),
                'classroom': entry.classroom.name,
                'subject': entry.subject.name,
                'timetable_id': entry.timetable_id
            })
        
        return Response({
            'teacher': teacher.name,
            'teacher_email': teacher.email,
            'schedule': weekly_schedule,
            'total_periods': len(schedule)
        })
        
    except User.DoesNotExist:
        return Response({'error': 'Teacher not found'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_attendance_completion_dashboard(request):
    """
    Admin dashboard showing attendance completion rates by classroom
    """
    if request.user.role != 'admin':
        raise PermissionDenied("Only administrators can access this dashboard")
    
    date_str = request.GET.get('date', timezone.now().date().isoformat())
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)
    
    classrooms = Classroom.objects.filter(is_active=True)
    completion_data = []
    
    for classroom in classrooms:
        completion_rate = get_attendance_completion_rate(classroom, target_date)
        
        # Get scheduled vs recorded counts
        day_name = target_date.strftime('%A').lower()
        scheduled_count = SchoolTimetable.objects.filter(
            classroom=classroom,
            day_of_week=day_name,
            is_active=True
        ).count()
        
        from attendance.models import AttendanceSession
        recorded_count = AttendanceSession.objects.filter(
            classroom=classroom,
            attendance_date=target_date
        ).count()
        
        completion_data.append({
            'classroom': classroom.name,
            'form_master': classroom.form_master.name if classroom.form_master else 'Unassigned',
            'scheduled_periods': scheduled_count,
            'recorded_periods': recorded_count,
            'completion_rate': completion_rate,
            'status': 'Complete' if completion_rate == 100 else 'Incomplete'
        })
    
    # Sort by completion rate (incomplete first)
    completion_data.sort(key=lambda x: x['completion_rate'])
    
    return Response({
        'date': target_date.isoformat(),
        'day_of_week': target_date.strftime('%A'),
        'classrooms': completion_data,
        'overall_stats': {
            'total_classrooms': len(completion_data),
            'complete_classrooms': len([c for c in completion_data if c['completion_rate'] == 100]),
            'average_completion': sum(c['completion_rate'] for c in completion_data) / len(completion_data) if completion_data else 0
        }
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_timetable_entry(request, timetable_id):
    """
    Admin deletes a timetable entry
    """
    if request.user.role != 'admin':
        raise PermissionDenied("Only administrators can delete timetable entries")
    
    try:
        timetable = SchoolTimetable.objects.get(timetable_id=timetable_id)
        details = str(timetable)
        timetable.delete()
        
        return Response({
            'message': 'Timetable entry deleted successfully',
            'deleted_entry': details
        })
        
    except SchoolTimetable.DoesNotExist:
        return Response({'error': 'Timetable entry not found'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_timetable(request):
    """
    Smart timetable generation with educational best practices
    Admin only
    """
    if request.user.role != 'admin':
        raise PermissionDenied("Only administrators can generate timetables")
    
    classroom_id = request.data.get('classroom_id')
    academic_year = request.data.get('academic_year', '2024-2025')
    term = request.data.get('term', 'Term 1')
    
    if not classroom_id:
        return Response({'error': 'classroom_id is required'}, status=400)
    
    try:
        from .timetable_generator import generate_timetable_for_classroom
        
        result = generate_timetable_for_classroom(
            classroom_id=classroom_id,
            admin_user=request.user,
            academic_year=academic_year,
            term=term
        )
        
        if result['success']:
            return Response({
                'success': True,
                'message': result['message'],
                'classroom_id': classroom_id,
                'academic_year': academic_year,
                'term': term
            })
        else:
            return Response({
                'success': False,
                'errors': result['errors']
            }, status=400)
    
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Generation failed: {str(e)}'
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def preview_generated_timetable(request):
    """
    Preview timetable without saving to database
    Admin only
    """
    if request.user.role != 'admin':
        raise PermissionDenied("Only administrators can preview timetables")
    
    classroom_id = request.data.get('classroom_id')
    
    if not classroom_id:
        return Response({'error': 'classroom_id is required'}, status=400)
    
    try:
        from .timetable_generator import TimetableGenerator
        
        classroom = Classroom.objects.get(class_id=classroom_id)
        generator = TimetableGenerator(classroom, created_by=request.user)
        
        success, schedule, errors = generator.generate()
        
        if success:
            # Format schedule for frontend
            formatted_schedule = {}
            for day, periods in schedule.items():
                formatted_schedule[day] = []
                for period in ['1', '2', '3', '4', '5', '6']:
                    slot = periods.get(period)
                    if slot:
                        formatted_schedule[day].append({
                            'period': period,
                            'subject': slot['subject'].name,
                            'teacher': slot['teacher'].name,
                            'difficulty': slot['subject'].difficulty,
                            'subject_type': slot['subject'].subject_type
                        })
                    else:
                        formatted_schedule[day].append({
                            'period': period,
                            'subject': None,
                            'teacher': None
                        })
            
            return Response({
                'success': True,
                'schedule': formatted_schedule,
                'classroom': classroom.name
            })
        else:
            return Response({
                'success': False,
                'errors': errors
            }, status=400)
    
    except Classroom.DoesNotExist:
        return Response({'error': 'Classroom not found'}, status=404)
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Preview failed: {str(e)}'
        }, status=500)