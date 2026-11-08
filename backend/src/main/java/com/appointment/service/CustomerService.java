package com.appointment.service;

import com.appointment.dto.AppointmentResponse;
import com.appointment.dto.AvailabilityDto;
import com.appointment.dto.BookAppointmentRequest;
import com.appointment.dto.CancelAppointmentRequest;
import com.appointment.dto.CustomerDashboardDto;
import com.appointment.dto.CustomerProfileDto;
import com.appointment.dto.CustomerProviderDto;
import com.appointment.dto.PageResponse;
import com.appointment.dto.RescheduleAppointmentRequest;
import com.appointment.dto.ServiceDto;
import com.appointment.dto.TimeSlotDto;
import com.appointment.dto.UpdateCustomerProfileRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface CustomerService {

    CustomerDashboardDto getCustomerDashboard(String customerEmail);

    List<ServiceDto> getServices(String search, Long categoryId, String sortBy, String sortDir);

    ServiceDto getServiceById(Long serviceId);

    List<CustomerProviderDto> getProviders(String search);

    CustomerProviderDto getProviderById(Long providerId);

    List<AvailabilityDto> getProviderAvailability(Long providerId);

    List<TimeSlotDto> getAvailableSlots(Long providerId, Long serviceId, LocalDate date);

    AppointmentResponse bookAppointment(String customerEmail, BookAppointmentRequest request);

    PageResponse<AppointmentResponse> getAppointments(
            String customerEmail,
            String search,
            String status,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    );

    AppointmentResponse getAppointmentById(String customerEmail, Long appointmentId);

    AppointmentResponse cancelAppointment(String customerEmail, Long appointmentId, CancelAppointmentRequest request);

    AppointmentResponse rescheduleAppointment(String customerEmail, Long appointmentId, RescheduleAppointmentRequest request);

    PageResponse<AppointmentResponse> getAppointmentHistory(
            String customerEmail,
            String search,
            String status,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    );

    CustomerProfileDto getCustomerProfile(String customerEmail);

    CustomerProfileDto updateCustomerProfile(String customerEmail, UpdateCustomerProfileRequest request);
}
