export const validateDashboardData = (data) => {
  if (!data || typeof data !== 'object') return false;
  const requiredFields = ['high_risk_students', 'urgent_alerts', 'pending_cases'];
  return requiredFields.every(field => Array.isArray(data[field]));
};

export const sanitizeDashboardData = (data) => {
  return {
    // Arrays
    high_risk_students:    Array.isArray(data?.high_risk_students)    ? data.high_risk_students    : [],
    urgent_alerts:         Array.isArray(data?.urgent_alerts)         ? data.urgent_alerts         : [],
    pending_cases:         Array.isArray(data?.pending_cases)         ? data.pending_cases         : [],
    immediate_attention:   Array.isArray(data?.immediate_attention)   ? data.immediate_attention   : [],
    classroom_stats:       Array.isArray(data?.classroom_stats)       ? data.classroom_stats       : [],
    case_status_breakdown: Array.isArray(data?.case_status_breakdown) ? data.case_status_breakdown : [],
    absence_trend:         Array.isArray(data?.absence_trend)         ? data.absence_trend         : [],
    monthly_alert_trend:   Array.isArray(data?.monthly_alert_trend)   ? data.monthly_alert_trend   : [],
    monthly_case_trend:    Array.isArray(data?.monthly_case_trend)    ? data.monthly_case_trend    : [],
    ai_insights:           Array.isArray(data?.ai_insights)           ? data.ai_insights           : [],
    // Objects
    statistics:       data?.statistics       || null,
    classroom_summary: data?.classroom_summary || null,
    // Scalars
    total_students:   data?.total_students   || 0,
    high_risk_count:  data?.high_risk_count  || 0,
    active_alerts:    data?.active_alerts    || 0,
    open_cases:       data?.open_cases       || 0,
    classroom_health: data?.classroom_health || 0,
    overdue_cases:    data?.overdue_cases    || 0,
  };
};
