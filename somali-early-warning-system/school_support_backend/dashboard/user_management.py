from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import make_password
from django.db import transaction

from users.models import User
from students.models import Classroom, Student, StudentEnrollment
from academics.models import Subject, TeachingAssignment


# =====================================================
# USER MANAGEMENT
# =====================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users(request):
    """List all users with filtering"""
    
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    role_filter = request.GET.get('role')
    
    users = User.objects.all()
    
    if role_filter:
        users = users.filter(role=role_filter)
    
    user_data = [{
        'user_id': u.id,
        'name': u.name,
        'email': u.email,
        'role': u.role,
        'is_active': u.is_active,
        'created_at': u.date_joined.isoformat() if hasattr(u, 'date_joined') else '',
        'classroom': u.managed_classrooms.first().name if u.role == 'form_master' and u.managed_classrooms.exists() else None
    } for u in users]
    
    return Response({'users': user_data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user(request):
    """Create new user"""
    
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        name = request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')
        role = request.data.get('role')
        
        if not all([name, email, password, role]):
            return Response({'error': 'All fields required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if role not in ['admin', 'form_master', 'teacher']:
            return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.create(
            name=name,
            email=email,
            password=make_password(password),
            role=role,
            is_active=True
        )
        
        # Log action
        from dashboard.models import AuditLog
        AuditLog.objects.create(
            user=request.user,
            action='user_created',
            description=f'Created user {name} with role {role}',
            metadata={'user_id': user.id, 'role': role}
        )
        
        return Response({
            'message': 'User created successfully',
            'user_id': user.id
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_user(request, user_id):
    """Update user details"""
    
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    name = request.data.get('name')
    email = request.data.get('email')
    role = request.data.get('role')
    
    if name:
        user.name = name
    if email and email != user.email:
        if User.objects.filter(email=email).exclude(id=user_id).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
        user.email = email
    if role and role in ['admin', 'form_master', 'teacher']:
        user.role = role
    
    user.save()
    
    # Log action
    from dashboard.models import AuditLog
    AuditLog.objects.create(
        user=request.user,
        action='user_updated',
        description=f'Updated user {user.name}',
        metadata={'user_id': user_id}
    )
    
    return Response({'message': 'User updated successfully'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disable_user(request, user_id):
    """Disable user (soft delete)"""
    
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if user.id == request.user.id:
        return Response({'error': 'Cannot disable yourself'}, status=status.HTTP_400_BAD_REQUEST)
    
    user.is_active = False
    user.save()
    
    # Log action
    from dashboard.models import AuditLog
    AuditLog.objects.create(
        user=request.user,
        action='user_disabled',
        description=f'Disabled user {user.name}',
        metadata={'user_id': user_id}
    )
    
    return Response({'message': 'User disabled successfully'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enable_user(request, user_id):
    """Enable user"""
    
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    user.is_active = True
    user.save()
    
    # Log action
    from dashboard.models import AuditLog
    AuditLog.objects.create(
        user=request.user,
        action='user_enabled',
        description=f'Enabled user {user.name}',
        metadata={'user_id': user_id}
    )
    
    return Response({'message': 'User enabled successfully'})


# =====================================================
# CLASSROOM MANAGEMENT
# =====================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_classrooms(request):
    """List all classrooms"""
    
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    classrooms = Classroom.objects.select_related('form_master').all()
    
    classroom_data = [{
        'class_id': c.class_id,
        'name': c.name,
        'academic_year': c.academic_year,
        'form_master': c.form_master.name if c.form_master else 'Unassigned',
        'form_master_id': c.form_master.id if c.form_master else None,
        'student_count': StudentEnrollment.objects.filter(classroom=c, is_active=True).count(),
        'is_active': c.is_active
    } for c in classrooms]
    
    return Response({'classrooms': classroom_data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_classroom(request):
    """Create new classroom"""
    
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    name = request.data.get('name')
    academic_year = request.data.get('academic_year')
    form_master_id = request.data.get('form_master_id')
    
    if not all([name, academic_year]):
        return Response({'error': 'Name and academic year required'}, status=status.HTTP_400_BAD_REQUEST)
    
    form_master = None
    if form_master_id:
        try:
            form_master = User.objects.get(id=form_master_id, role='form_master')
            # Check if form master already assigned
            if Classroom.objects.filter(form_master=form_master, is_active=True).exists():
                return Response({'error': 'Form master already assigned to another classroom'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'Form master not found'}, status=status.HTTP_404_NOT_FOUND)
    
    classroom = Classroom.objects.create(
        name=name,
        academic_year=academic_year,
        form_master=form_master,
        is_active=True
    )
    
    # Log action
    from dashboard.models import AuditLog
    AuditLog.objects.create(
        user=request.user,
        action='classroom_created',
        description=f'Created classroom {name}',
        metadata={'class_id': classroom.class_id}
    )
    
    return Response({
        'message': 'Classroom created successfully',
        'class_id': classroom.class_id
    }, status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_classroom(request, class_id):
    """Update classroom"""
    
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        classroom = Classroom.objects.get(class_id=class_id)
    except Classroom.DoesNotExist:
        return Response({'error': 'Classroom not found'}, status=status.HTTP_404_NOT_FOUND)
    
    name = request.data.get('name')
    form_master_id = request.data.get('form_master_id')
    
    if name:
        classroom.name = name
    
    if form_master_id:
        try:
            form_master = User.objects.get(id=form_master_id, role='form_master')
            # Check if form master already assigned to another classroom
            existing = Classroom.objects.filter(form_master=form_master, is_active=True).exclude(class_id=class_id)
            if existing.exists():
                return Response({'error': 'Form master already assigned to another classroom'}, status=status.HTTP_400_BAD_REQUEST)
            classroom.form_master = form_master
        except User.DoesNotExist:
            return Response({'error': 'Form master not found'}, status=status.HTTP_404_NOT_FOUND)
    
    classroom.save()
    
    # Log action
    from dashboard.models import AuditLog
    AuditLog.objects.create(
        user=request.user,
        action='classroom_updated',
        description=f'Updated classroom {classroom.name}',
        metadata={'class_id': class_id}
    )
    
    return Response({'message': 'Classroom updated successfully'})


# =====================================================
# ENROLLMENT MANAGEMENT
# =====================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enroll_student(request):
    """Enroll student in classroom"""
    
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    student_id = request.data.get('student_id')
    class_id = request.data.get('class_id')
    academic_year = request.data.get('academic_year')
    
    if not all([student_id, class_id, academic_year]):
        return Response({'error': 'All fields required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        student = Student.objects.get(student_id=student_id)
        classroom = Classroom.objects.get(class_id=class_id)
    except (Student.DoesNotExist, Classroom.DoesNotExist):
        return Response({'error': 'Student or classroom not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if already enrolled
    if StudentEnrollment.objects.filter(student=student, academic_year=academic_year, is_active=True).exists():
        return Response({'error': 'Student already enrolled for this academic year'}, status=status.HTTP_400_BAD_REQUEST)
    
    enrollment = StudentEnrollment.objects.create(
        student=student,
        classroom=classroom,
        academic_year=academic_year,
        is_active=True
    )
    
    # Log action
    from dashboard.models import AuditLog
    AuditLog.objects.create(
        user=request.user,
        action='student_enrolled',
        description=f'Enrolled {student.full_name} in {classroom.name}',
        metadata={'student_id': student_id, 'class_id': class_id}
    )
    
    return Response({
        'message': 'Student enrolled successfully',
        'enrollment_id': enrollment.enrollment_id
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_enrollments(request):
    """List all enrollments"""
    
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    enrollments = StudentEnrollment.objects.select_related('student', 'classroom').filter(is_active=True)
    
    enrollment_data = [{
        'enrollment_id': e.enrollment_id,
        'student_name': e.student.full_name,
        'student_id': e.student.student_id,
        'classroom_name': e.classroom.name,
        'class_id': e.classroom.class_id,
        'academic_year': e.academic_year,
        'enrollment_date': e.enrollment_date.isoformat()
    } for e in enrollments]
    
    return Response({'enrollments': enrollment_data})


# =====================================================
# TEACHER ASSIGNMENT
# =====================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_teacher(request):
    """Assign teacher to class"""
    
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    teacher_id = request.data.get('teacher_id')
    class_id = request.data.get('class_id')
    subject_id = request.data.get('subject_id')
    
    if not all([teacher_id, class_id, subject_id]):
        return Response({'error': 'All fields required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        teacher = User.objects.get(id=teacher_id, role='teacher')
        classroom = Classroom.objects.get(class_id=class_id)
        subject = Subject.objects.get(subject_id=subject_id)
    except (User.DoesNotExist, Classroom.DoesNotExist, Subject.DoesNotExist):
        return Response({'error': 'Teacher, classroom, or subject not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if already assigned
    if TeachingAssignment.objects.filter(teacher=teacher, classroom=classroom, subject=subject, is_active=True).exists():
        return Response({'error': 'Teacher already assigned to this class for this subject'}, status=status.HTTP_400_BAD_REQUEST)
    
    assignment = TeachingAssignment.objects.create(
        teacher=teacher,
        classroom=classroom,
        subject=subject,
        is_active=True
    )
    
    # Log action
    from dashboard.models import AuditLog
    AuditLog.objects.create(
        user=request.user,
        action='teacher_assigned',
        description=f'Assigned {teacher.name} to {classroom.name} for {subject.name}',
        metadata={'teacher_id': teacher_id, 'class_id': class_id, 'subject_id': subject_id}
    )
    
    return Response({
        'message': 'Teacher assigned successfully',
        'assignment_id': assignment.assignment_id
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_assignments(request):
    """List all teaching assignments"""
    
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    assignments = TeachingAssignment.objects.select_related('teacher', 'classroom', 'subject').filter(is_active=True)
    
    assignment_data = [{
        'assignment_id': a.assignment_id,
        'teacher_name': a.teacher.name,
        'teacher_id': a.teacher.id,
        'classroom_name': a.classroom.name,
        'class_id': a.classroom.class_id,
        'subject_name': a.subject.name,
        'subject_id': a.subject.subject_id
    } for a in assignments]
    
    return Response({'assignments': assignment_data})
