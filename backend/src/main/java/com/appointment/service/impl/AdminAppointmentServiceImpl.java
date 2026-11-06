package com.appointment.service.impl;

import com.appointment.dto.AppointmentResponse;
import com.appointment.dto.CancelAppointmentRequest;
import com.appointment.dto.PageResponse;
import com.appointment.entity.Appointment;
import com.appointment.entity.AppointmentStatus;
import com.appointment.exception.BadRequestException;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.AppointmentRepository;
import com.appointment.service.AdminAppointmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAppointmentServiceImpl implements AdminAppointmentService {

    private final AppointmentRepository appointmentRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AppointmentResponse> getAppointments(
            String search,
            String status,
            String startDateStr,
            String endDateStr,
            int page,
            int size,
            String sortBy,
            String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        String searchParam = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String statusParam = (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) ? status.trim() : null;

        LocalDateTime start = null;
        LocalDateTime end = null;

        if (startDateStr != null && !startDateStr.trim().isEmpty()) {
            try {
                start = LocalDate.parse(startDateStr.trim()).atStartOfDay();
            } catch (Exception ex) {
                log.warn("Invalid startDate format: {}", startDateStr);
            }
        }

        if (endDateStr != null && !endDateStr.trim().isEmpty()) {
            try {
                end = LocalDate.parse(endDateStr.trim()).atTime(LocalTime.MAX);
            } catch (Exception ex) {
                log.warn("Invalid endDate format: {}", endDateStr);
            }
        }

        Page<Appointment> pageResult = appointmentRepository.findFiltered(searchParam, statusParam, start, end, pageable);
        return PageResponse.of(pageResult, AppointmentResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));
        return AppointmentResponse.fromEntity(appointment);
    }

    @Override
    @Transactional
    public AppointmentResponse cancelAppointment(Long id, CancelAppointmentRequest request, String adminEmail) {
        log.info("Administrator {} cancelling appointment ID {}", adminEmail, id);

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with ID: " + id));

        if (AppointmentStatus.CANCELLED.name().equalsIgnoreCase(appointment.getStatus())) {
            throw new BadRequestException("Appointment is already cancelled");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED.name());
        appointment.setCancellationReason("Cancelled by Admin (" + adminEmail + "): " + request.getReason().trim());

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Appointment ID {} cancelled successfully", id);
        return AppointmentResponse.fromEntity(updated);
    }
}
