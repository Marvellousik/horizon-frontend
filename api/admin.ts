import axiosInstance from "./axiosInstance";

export const simulateMonthlyMaintenance = async () => {
  const response = await axiosInstance.post("/api/admin/simulate-maintenance/");
  return response.data;
};
