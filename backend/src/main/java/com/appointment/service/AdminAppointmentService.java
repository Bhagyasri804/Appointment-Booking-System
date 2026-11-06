package com.appointment.service;

import com.appointment.dto.AppointmentResponse;
import com.appointment.dto.CancelAppointmentRequest;
import com.appointment.dto.PageResponse;

public interface AdminAppointmentService {

    PageResponse<AppointmentResponse> getAppointments(
            String search,
            String status,
            String startDate,
            String endDate,
            int page,
            int size,
            String sortBy,
            String sortDir
    );

    AppointmentResponse getAppointmentById(Long id);

    AppointmentResponse cancelAppointment(Long id, CancelAppointmentRequest request, String adminEmail);
}
