import api from "./apiClient";

export const getTeacherAssignments = async () => {
  const res = await api.get("/assignments/");
  return res.data;
};
