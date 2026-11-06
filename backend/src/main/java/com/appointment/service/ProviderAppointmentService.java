package com.appointment.service;

import com.appointment.dto.AppointmentResponse;
import com.appointment.dto.PageResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface ProviderAppointmentService {

    PageResponse<AppointmentResponse> getAppointments(
            String providerEmail,
            String search,
            String status,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    );

    AppointmentResponse getAppointmentById(String providerEmail, Long appointmentId);

    AppointmentResponse confirmAppointment(String providerEmail, Long appointmentId);

    AppointmentResponse rejectAppointment(String providerEmail, Long appointmentId, String reason);

    AppointmentResponse completeAppointment(String providerEmail, Long appointmentId);
}
