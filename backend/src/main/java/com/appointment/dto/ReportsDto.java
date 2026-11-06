package com.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportsDto {

    private UserStatsDto userStats;
    private AppointmentStatusStatsDto appointmentStatusStats;
    private List<MonthlyStatsDto> monthlyStats;
    private List<ServicePopularityDto> servicePopularity;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserStatsDto {
        private long totalUsers;
        private long totalCustomers;
        private long totalProviders;
        private long totalAdmins;
        private long activeUsers;
        private long inactiveUsers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppointmentStatusStatsDto {
        private long totalAppointments;
        private long pendingCount;
        private long confirmedCount;
        private long completedCount;
        private long cancelledCount;
        private double completionRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyStatsDto {
        private String month;
        private long totalAppointments;
        private long completedAppointments;
        private long cancelledAppointments;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServicePopularityDto {
        private String serviceName;
        private long bookingCount;
        private BigDecimal revenue;
    }
}
