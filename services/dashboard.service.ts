import { api } from './api';
import { DashboardResponse } from '@/types/dashboard';

class DashboardService {
  getDashboard() {
    return api.get<DashboardResponse>('/dashboard');
  }
}

export const dashboardService = new DashboardService();
