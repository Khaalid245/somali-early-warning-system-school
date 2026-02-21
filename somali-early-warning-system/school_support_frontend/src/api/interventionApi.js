import api from './apiClient';

// =====================================================
// INTERVENTION MEETINGS API
// =====================================================

export const interventionMeetingApi = {
  // List all meetings with optional filters
  listMeetings: (params = {}) => {
    return api.get('/interventions/meetings/', { params });
  },

  // Create new meeting
  createMeeting: (data) => {
    return api.post('/interventions/meetings/', data);
  },

  // Get meeting detail
  getMeeting: (id) => {
    return api.get(`/interventions/meetings/${id}/`);
  },

  // Update meeting
  updateMeeting: (id, data) => {
    return api.put(`/interventions/meetings/${id}/`, data);
  },

  // Delete meeting
  deleteMeeting: (id) => {
    return api.delete(`/interventions/meetings/${id}/`);
  },

  // Add progress update
  addProgressUpdate: (data) => {
    return api.post('/interventions/meetings/progress/', data);
  },

  // Get student intervention history
  getStudentHistory: (studentId) => {
    return api.get(`/interventions/meetings/student/${studentId}/`);
  },

  // Get recurring absences
  getRecurringAbsences: () => {
    return api.get('/interventions/meetings/recurring/');
  },

  // Get dashboard statistics
  getDashboardStats: () => {
    return api.get('/interventions/meetings/stats/');
  },
};
