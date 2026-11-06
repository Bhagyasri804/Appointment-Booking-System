package com.appointment.service.impl;

import com.appointment.dto.AppointmentResponse;
import com.appointment.dto.PageResponse;
import com.appointment.entity.Appointment;
import com.appointment.entity.AppointmentStatus;
import com.appointment.entity.User;
import com.appointment.exception.BadRequestException;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.AppointmentRepository;
import com.appointment.repository.UserRepository;
import com.appointment.service.NotificationService;
import com.appointment.service.ProviderAppointmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProviderAppointmentServiceImpl implements ProviderAppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AppointmentResponse> getAppointments(
            String providerEmail,
            String search,
            String status,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable) {

        User provider = getProviderByEmail(providerEmail);
        String trimmedSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String trimmedStatus = (status != null && !status.trim().isEmpty()) ? status.trim() : null;

        Page<Appointment> page = appointmentRepository.findProviderFiltered(
                provider.getId(),
                trimmedSearch,
                trimmedStatus,
                startDate,
                endDate,
                pageable
        );

        return PageResponse.fromPage(page, AppointmentResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(String providerEmail, Long appointmentId) {
        User provider = getProviderByEmail(providerEmail);
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));

        validateOwnership(appointment, provider);

        return AppointmentResponse.fromEntity(appointment);
    }

    @Override
    @Transactional
    public AppointmentResponse confirmAppointment(String providerEmail, Long appointmentId) {
        User provider = getProviderByEmail(providerEmail);
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));

        validateOwnership(appointment, provider);

        if (AppointmentStatus.CANCELLED.name().equalsIgnoreCase(appointment.getStatus())) {
            throw new BadRequestException("Cannot confirm an appointment that is already cancelled");
        }
        if (AppointmentStatus.COMPLETED.name().equalsIgnoreCase(appointment.getStatus())) {
            throw new BadRequestException("Cannot confirm an appointment that is already completed");
        }

        appointment.setStatus(AppointmentStatus.CONFIRMED.name());
        Appointment saved = appointmentRepository.save(appointment);
        log.info("Appointment ID {} confirmed by provider {}", appointmentId, providerEmail);

        // Notify customer
        if (appointment.getCustomer() != null) {
            String customerMsg = String.format("Your appointment '%s' scheduled for %s has been confirmed by %s.",
                    appointment.getTitle(), appointment.getAppointmentTime(), provider.getFullName());
            notificationService.createNotification(
                    appointment.getCustomer(),
                    "Appointment Confirmed",
                    customerMsg,
                    "APPOINTMENT_CONFIRMED",
                    appointment.getId()
            );
        }

        // Notify provider for their own activity log
        notificationService.createNotification(
                provider,
                "Appointment Confirmed",
                "You confirmed appointment #" + appointment.getId() + " (" + appointment.getTitle() + ").",
                "APPOINTMENT_CONFIRMED",
                appointment.getId()
        );

        return AppointmentResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public AppointmentResponse rejectAppointment(String providerEmail, Long appointmentId, String reason) {
        User provider = getProviderByEmail(providerEmail);
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));

        validateOwnership(appointment, provider);

        if (reason == null || reason.trim().isEmpty()) {
            throw new BadRequestException("Rejection reason is required");
        }

        if (AppointmentStatus.COMPLETED.name().equalsIgnoreCase(appointment.getStatus())) {
            throw new BadRequestException("Cannot reject an appointment that is already completed");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED.name());
        appointment.setCancellationReason(reason.trim());
        Appointment saved = appointmentRepository.save(appointment);
        log.info("Appointment ID {} rejected by provider {} with reason: {}", appointmentId, providerEmail, reason);

        // Notify customer
        if (appointment.getCustomer() != null) {
            String customerMsg = String.format("Your appointment '%s' was declined by %s. Reason: %s",
                    appointment.getTitle(), provider.getFullName(), reason.trim());
            notificationService.createNotification(
                    appointment.getCustomer(),
                    "Appointment Declined",
                    customerMsg,
                    "APPOINTMENT_CANCELLED",
                    appointment.getId()
            );
        }

        return AppointmentResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public AppointmentResponse completeAppointment(String providerEmail, Long appointmentId) {
        User provider = getProviderByEmail(providerEmail);
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));

        validateOwnership(appointment, provider);

        if (AppointmentStatus.CANCELLED.name().equalsIgnoreCase(appointment.getStatus())) {
            throw new BadRequestException("Cannot complete a cancelled appointment");
        }

        appointment.setStatus(AppointmentStatus.COMPLETED.name());
        Appointment saved = appointmentRepository.save(appointment);
        log.info("Appointment ID {} marked as completed by provider {}", appointmentId, providerEmail);

        // Notify customer
        if (appointment.getCustomer() != null) {
            String customerMsg = String.format("Your appointment '%s' has been marked as completed. Thank you!",
                    appointment.getTitle());
            notificationService.createNotification(
                    appointment.getCustomer(),
                    "Appointment Completed",
                    customerMsg,
                    "APPOINTMENT_COMPLETED",
                    appointment.getId()
            );
        }

        return AppointmentResponse.fromEntity(saved);
    }

    private void validateOwnership(Appointment appointment, User provider) {
        if (appointment.getServiceProvider() == null || !appointment.getServiceProvider().getId().equals(provider.getId())) {
            throw new BadRequestException("Access denied: You do not own this appointment");
        }
    }

    private User getProviderByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }
}
