import api from "./apiClient";

export const getStudentsByClassroom = async (classroomId) => {
  const res = await api.get(`/students/?classroom=${classroomId}`);
  return res.data;
};
