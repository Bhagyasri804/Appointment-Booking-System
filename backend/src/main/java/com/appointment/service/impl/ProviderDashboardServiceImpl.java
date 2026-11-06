package com.appointment.service.impl;

import com.appointment.dto.ProviderOverviewDto;
import com.appointment.entity.Appointment;
import com.appointment.entity.AppointmentStatus;
import com.appointment.entity.User;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.AppointmentRepository;
import com.appointment.repository.UserRepository;
import com.appointment.service.ProviderDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProviderDashboardServiceImpl implements ProviderDashboardService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public ProviderOverviewDto getProviderOverview(String providerEmail) {
        User provider = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", providerEmail));

        Long providerId = provider.getId();
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);

        long totalAppointments = appointmentRepository.countByServiceProviderId(providerId);
        long todayAppointments = appointmentRepository.countTodayAppointments(providerId, startOfDay, endOfDay);
        long pendingAppointments = appointmentRepository.countByServiceProviderIdAndStatus(providerId, AppointmentStatus.PENDING.name());
        long confirmedAppointments = appointmentRepository.countByServiceProviderIdAndStatus(providerId, AppointmentStatus.CONFIRMED.name());
        long completedAppointments = appointmentRepository.countByServiceProviderIdAndStatus(providerId, AppointmentStatus.COMPLETED.name());
        long cancelledAppointments = appointmentRepository.countByServiceProviderIdAndStatus(providerId, AppointmentStatus.CANCELLED.name());

        BigDecimal totalEarnings = appointmentRepository.calculateTotalEarnings(providerId);
        if (totalEarnings == null) {
            totalEarnings = BigDecimal.ZERO;
        }

        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = today.withDayOfMonth(today.lengthOfMonth()).atTime(LocalTime.MAX);
        BigDecimal monthlyEarnings = appointmentRepository.calculateMonthlyEarnings(providerId, startOfMonth, endOfMonth);
        if (monthlyEarnings == null) {
            monthlyEarnings = BigDecimal.ZERO;
        }

        // Generate past 6 months stats
        List<ProviderOverviewDto.MonthlyStat> monthlyStats = new ArrayList<>();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy");
        List<Appointment> allProviderAppointments = appointmentRepository.findByServiceProviderId(providerId);

        YearMonth currentYearMonth = YearMonth.from(today);
        for (int i = 5; i >= 0; i--) {
            YearMonth targetMonth = currentYearMonth.minusMonths(i);
            String monthLabel = targetMonth.format(monthFormatter);

            long count = allProviderAppointments.stream()
                    .filter(a -> a.getAppointmentTime() != null && YearMonth.from(a.getAppointmentTime()).equals(targetMonth))
                    .count();

            BigDecimal monthIncome = allProviderAppointments.stream()
                    .filter(a -> a.getAppointmentTime() != null
                            && YearMonth.from(a.getAppointmentTime()).equals(targetMonth)
                            && AppointmentStatus.COMPLETED.name().equalsIgnoreCase(a.getStatus())
                            && a.getService() != null
                            && a.getService().getPrice() != null)
                    .map(a -> a.getService().getPrice())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            monthlyStats.add(ProviderOverviewDto.MonthlyStat.builder()
                    .month(monthLabel)
                    .appointmentCount(count)
                    .earnings(monthIncome)
                    .build());
        }

        return ProviderOverviewDto.builder()
                .totalAppointments(totalAppointments)
                .todayAppointments(todayAppointments)
                .pendingAppointments(pendingAppointments)
                .confirmedAppointments(confirmedAppointments)
                .completedAppointments(completedAppointments)
                .cancelledAppointments(cancelledAppointments)
                .totalEarnings(totalEarnings)
                .monthlyEarnings(monthlyEarnings)
                .monthlyStats(monthlyStats)
                .build();
    }
}
