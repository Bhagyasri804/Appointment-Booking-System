package com.appointment.service;

import com.appointment.dto.AdminDashboardStatsDto;
import com.appointment.dto.ReportsDto;

public interface AdminDashboardService {

    AdminDashboardStatsDto getDashboardStats();

    ReportsDto getReports();
}
