import { z } from 'zod';

// FIX 3: Zod validation schema for Teacher Dashboard response
export const teacherDashboardSchema = z.object({
  role: z.literal('teacher'),
  today_absent_count: z.number().int().min(0),
  absent_change_percent: z.number(),
  absent_trend_direction: z.enum(['up', 'down', 'stable']),
  active_alerts: z.number().int().min(0),
  alert_change_percent: z.number(),
  alert_trend_direction: z.enum(['up', 'down', 'stable']),
  
  // Critical fields
  recent_sessions: z.array(z.object({
    date: z.string(),
    classroom: z.string(),
    subject: z.string(),
    present: z.number().int().min(0),
    absent: z.number().int().min(0)
  })).optional().default([]),
  
  week_stats: z.object({
    present: z.number().min(0).max(100),
    late: z.number().min(0).max(100),
    absent: z.number().min(0).max(100)
  }).optional().default({ present: 0, late: 0, absent: 0 }),
  
  trend: z.object({
    direction: z.enum(['up', 'down']),
    percent: z.number().min(0)
  }).optional().default({ direction: 'up', percent: 0 }),
  
  avg_attendance: z.number().min(0).max(100).optional().default(0),
  
  // Other fields
  monthly_absence_trend: z.array(z.object({
    month: z.string(),
    count: z.number().int().min(0)
  })).optional().default([]),
  
  monthly_alert_trend: z.array(z.object({
    month: z.string(),
    count: z.number().int().min(0)
  })).optional().default([]),
  
  high_risk_students: z.array(z.object({
    student__full_name: z.string(),
    student__student_id: z.union([z.string(), z.number()]).transform(val => String(val)),
    student__admission_number: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
    risk_level: z.enum(['low', 'medium', 'high', 'critical']),
    risk_score: z.number()
  })).optional().default([]),
  
  urgent_alerts: z.array(z.object({
    alert_id: z.number(),
    student__full_name: z.string(),
    student__student_id: z.union([z.string(), z.number()]).transform(val => String(val)),
    subject__name: z.string(),
    alert_type: z.string(),
    risk_level: z.enum(['low', 'medium', 'high', 'critical']),
    status: z.string(),
    alert_date: z.string()
  })).optional().default([]),
  
  my_classes: z.array(z.object({
    assignment_id: z.number(),
    classroom__name: z.string(),
    classroom__class_id: z.number(),
    subject__name: z.string(),
    subject__subject_id: z.number(),
    student_count: z.number().int().min(0).optional().default(0),
    recent_attendance_rate: z.number().nullable().optional()
  })).optional().default([]),
  
  action_items: z.array(z.any()).optional().default([]),
  weekly_attendance_summary: z.union([z.record(z.any()), z.array(z.any())]).optional().default([]),
  time_range_info: z.object({
    current_range: z.string(),
    start_date: z.string(),
    end_date: z.string()
  }).optional()
});

// Validation helper function
export function validateDashboardData(data) {
  try {
    return {
      success: true,
      data: teacherDashboardSchema.parse(data)
    };
  } catch (error) {
    console.error('Dashboard validation error:', error);
    return {
      success: false,
      error: error.errors || error.message,
      data: null
    };
  }
}
