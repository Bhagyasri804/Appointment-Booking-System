package com.appointment.service.impl;

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
import com.appointment.entity.Appointment;
import com.appointment.entity.AppointmentStatus;
import com.appointment.entity.ProviderAvailability;
import com.appointment.entity.Role;
import com.appointment.entity.ServiceEntity;
import com.appointment.entity.User;
import com.appointment.exception.BadRequestException;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.AppointmentRepository;
import com.appointment.repository.ProviderAvailabilityRepository;
import com.appointment.repository.ServiceEntityRepository;
import com.appointment.repository.UserRepository;
import com.appointment.service.CustomerService;
import com.appointment.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final ServiceEntityRepository serviceEntityRepository;
    private final ProviderAvailabilityRepository availabilityRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public CustomerDashboardDto getCustomerDashboard(String customerEmail) {
        User customer = getCustomer(customerEmail);
        Long customerId = customer.getId();

        long total = appointmentRepository.countByCustomerId(customerId);
        long upcoming = appointmentRepository.countUpcomingAppointments(customerId, LocalDateTime.now());
        long pending = appointmentRepository.countByCustomerIdAndStatus(customerId, AppointmentStatus.PENDING.name());
        long confirmed = appointmentRepository.countByCustomerIdAndStatus(customerId, AppointmentStatus.CONFIRMED.name());
        long completed = appointmentRepository.countByCustomerIdAndStatus(customerId, AppointmentStatus.COMPLETED.name());
        long cancelled = appointmentRepository.countByCustomerIdAndStatus(customerId, AppointmentStatus.CANCELLED.name());

        List<AppointmentResponse> recent = appointmentRepository.findTop5ByCustomerIdOrderByAppointmentTimeDesc(customerId)
                .stream()
                .map(AppointmentResponse::fromEntity)
                .collect(Collectors.toList());

        return CustomerDashboardDto.builder()
                .totalAppointments(total)
                .upcomingAppointments(upcoming)
                .pendingAppointments(pending)
                .confirmedAppointments(confirmed)
                .completedAppointments(completed)
                .cancelledAppointments(cancelled)
                .recentAppointments(recent)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceDto> getServices(String search, Long categoryId, String sortBy, String sortDir) {
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String property = "price".equalsIgnoreCase(sortBy) ? "price" : "name";
        Sort sort = Sort.by(direction, property);

        String trimmedSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return serviceEntityRepository.findCustomerServices(trimmedSearch, categoryId, sort)
                .stream()
                .map(ServiceDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceDto getServiceById(Long serviceId) {
        ServiceEntity service = serviceEntityRepository.findById(serviceId)
                .filter(ServiceEntity::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", serviceId));
        return ServiceDto.fromEntity(service);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerProviderDto> getProviders(String search) {
        List<User> providers;
        if (search != null && !search.trim().isEmpty()) {
            providers = userRepository.searchProviders(search.trim());
        } else {
            providers = userRepository.findByRoleAndEnabledTrue(Role.SERVICE_PROVIDER);
        }

        return providers.stream()
                .map(p -> {
                    List<AvailabilityDto> avList = availabilityRepository.findByProviderIdAndActiveTrue(p.getId())
                            .stream()
                            .map(AvailabilityDto::fromEntity)
                            .collect(Collectors.toList());
                    return CustomerProviderDto.fromEntity(p, avList);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerProviderDto getProviderById(Long providerId) {
        User provider = userRepository.findById(providerId)
                .filter(u -> u.getRole() == Role.SERVICE_PROVIDER && u.isEnabled())
                .orElseThrow(() -> new ResourceNotFoundException("Provider", "id", providerId));

        List<AvailabilityDto> avList = availabilityRepository.findByProviderIdAndActiveTrue(provider.getId())
                .stream()
                .map(AvailabilityDto::fromEntity)
                .collect(Collectors.toList());

        return CustomerProviderDto.fromEntity(provider, avList);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailabilityDto> getProviderAvailability(Long providerId) {
        userRepository.findById(providerId)
                .filter(u -> u.getRole() == Role.SERVICE_PROVIDER && u.isEnabled())
                .orElseThrow(() -> new ResourceNotFoundException("Provider", "id", providerId));

        return availabilityRepository.findByProviderIdOrderByDayOfWeekAscStartTimeAsc(providerId)
                .stream()
                .filter(ProviderAvailability::isActive)
                .map(AvailabilityDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimeSlotDto> getAvailableSlots(Long providerId, Long serviceId, LocalDate date) {
        if (date == null || date.isBefore(LocalDate.now())) {
            return new ArrayList<>();
        }

        userRepository.findById(providerId)
                .filter(u -> u.getRole() == Role.SERVICE_PROVIDER && u.isEnabled())
                .orElseThrow(() -> new ResourceNotFoundException("Provider", "id", providerId));

        ServiceEntity service = serviceEntityRepository.findById(serviceId)
                .filter(ServiceEntity::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", serviceId));

        int duration = (service.getDurationMinutes() != null && service.getDurationMinutes() > 0)
                ? service.getDurationMinutes() : 30;

        DayOfWeek dow = date.getDayOfWeek();
        List<ProviderAvailability> availabilities = availabilityRepository
                .findByProviderIdAndDayOfWeekAndActiveTrue(providerId, dow);

        if (availabilities.isEmpty()) {
            return new ArrayList<>();
        }

        List<Appointment> dayAppts = appointmentRepository.findByServiceProviderIdAndAppointmentTimeBetween(
                providerId, date.atStartOfDay(), date.atTime(LocalTime.MAX)
        ).stream()
                .filter(a -> !AppointmentStatus.CANCELLED.name().equalsIgnoreCase(a.getStatus()))
                .collect(Collectors.toList());

        List<TimeSlotDto> slots = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalTime nowTime = LocalTime.now();

        for (ProviderAvailability av : availabilities) {
            LocalTime current = av.getStartTime();
            LocalTime windowEnd = av.getEndTime();
            LocalTime breakStart = av.getBreakStartTime();
            LocalTime breakEnd = av.getBreakEndTime();

            while (!current.plusMinutes(duration).isAfter(windowEnd)) {
                LocalTime slotStart = current;
                LocalTime slotEnd = current.plusMinutes(duration);

                String status = "AVAILABLE";

                // Check break collision
                if (breakStart != null && breakEnd != null && slotStart.isBefore(breakEnd) && slotEnd.isAfter(breakStart)) {
                    status = "BREAK";
                }
                // Check past slot if today
                else if (date.equals(today) && slotStart.isBefore(nowTime)) {
                    status = "PAST";
                }
                // Check existing appointments collision
                else {
                    boolean overlaps = dayAppts.stream().anyMatch(a -> {
                        LocalTime aStart = a.getAppointmentTime().toLocalTime();
                        int aDur = (a.getService() != null && a.getService().getDurationMinutes() != null)
                                ? a.getService().getDurationMinutes() : 30;
                        LocalTime aEnd = aStart.plusMinutes(aDur);
                        return slotStart.isBefore(aEnd) && slotEnd.isAfter(aStart);
                    });

                    if (overlaps) {
                        status = "BOOKED";
                    }
                }

                slots.add(TimeSlotDto.builder()
                        .startTime(slotStart)
                        .endTime(slotEnd)
                        .status(status)
                        .serviceName(service.getName())
                        .build());

                current = current.plusMinutes(30);
            }
        }

        return slots;
    }

    @Override
    @Transactional
    public AppointmentResponse bookAppointment(String customerEmail, BookAppointmentRequest request) {
        User customer = getCustomer(customerEmail);

        ServiceEntity service = serviceEntityRepository.findById(request.getServiceId())
                .filter(ServiceEntity::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", request.getServiceId()));

        User provider = userRepository.findById(request.getProviderId())
                .filter(u -> u.getRole() == Role.SERVICE_PROVIDER && u.isEnabled())
                .orElseThrow(() -> new ResourceNotFoundException("Provider", "id", request.getProviderId()));

        LocalDateTime apptTime = request.getAppointmentTime();
        if (apptTime.isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Cannot book an appointment in the past");
        }

        int duration = (service.getDurationMinutes() != null && service.getDurationMinutes() > 0)
                ? service.getDurationMinutes() : 30;
        LocalTime startTime = apptTime.toLocalTime();
        LocalTime endTime = startTime.plusMinutes(duration);
        LocalDate apptDate = apptTime.toLocalDate();

        // Concurrency synchronization per provider
        synchronized (("provider_booking_lock_" + provider.getId()).intern()) {
            DayOfWeek dow = apptTime.getDayOfWeek();
            List<ProviderAvailability> availabilities = availabilityRepository
                    .findByProviderIdAndDayOfWeekAndActiveTrue(provider.getId(), dow);

            if (availabilities.isEmpty()) {
                throw new BadRequestException("Provider does not work on " + dow);
            }

            boolean withinWorkingHours = false;
            for (ProviderAvailability av : availabilities) {
                if (!startTime.isBefore(av.getStartTime()) && !endTime.isAfter(av.getEndTime())) {
                    if (av.getBreakStartTime() != null && av.getBreakEndTime() != null) {
                        if (startTime.isBefore(av.getBreakEndTime()) && endTime.isAfter(av.getBreakStartTime())) {
                            throw new BadRequestException("Selected time overlaps with provider break time");
                        }
                    }
                    withinWorkingHours = true;
                    break;
                }
            }

            if (!withinWorkingHours) {
                throw new BadRequestException("Selected appointment time is outside provider working hours");
            }

            // Check provider conflicts
            List<Appointment> providerDayAppts = appointmentRepository.findByServiceProviderIdAndAppointmentTimeBetween(
                    provider.getId(), apptDate.atStartOfDay(), apptDate.atTime(LocalTime.MAX)
            );
            boolean providerConflict = providerDayAppts.stream()
                    .filter(a -> !AppointmentStatus.CANCELLED.name().equalsIgnoreCase(a.getStatus()))
                    .anyMatch(a -> {
                        LocalTime aStart = a.getAppointmentTime().toLocalTime();
                        int aDur = (a.getService() != null && a.getService().getDurationMinutes() != null)
                                ? a.getService().getDurationMinutes() : 30;
                        LocalTime aEnd = aStart.plusMinutes(aDur);
                        return startTime.isBefore(aEnd) && endTime.isAfter(aStart);
                    });

            if (providerConflict) {
                throw new BadRequestException("Selected time slot is already booked for this provider");
            }

            // Check customer conflicts
            List<Appointment> customerDayAppts = appointmentRepository.findByCustomerIdAndAppointmentTimeBetween(
                    customer.getId(), apptDate.atStartOfDay(), apptDate.atTime(LocalTime.MAX)
            );
            boolean customerConflict = customerDayAppts.stream()
                    .filter(a -> !AppointmentStatus.CANCELLED.name().equalsIgnoreCase(a.getStatus()))
                    .anyMatch(a -> {
                        LocalTime aStart = a.getAppointmentTime().toLocalTime();
                        int aDur = (a.getService() != null && a.getService().getDurationMinutes() != null)
                                ? a.getService().getDurationMinutes() : 30;
                        LocalTime aEnd = aStart.plusMinutes(aDur);
                        return startTime.isBefore(aEnd) && endTime.isAfter(aStart);
                    });

            if (customerConflict) {
                throw new BadRequestException("You already have an appointment scheduled during this time slot");
            }

            String desc = (request.getNotes() != null && !request.getNotes().trim().isEmpty())
                    ? request.getNotes().trim() : "Appointment booking for " + service.getName();

            Appointment appointment = Appointment.builder()
                    .title(service.getName() + " - " + customer.getFullName())
                    .description(desc)
                    .appointmentTime(apptTime)
                    .status(AppointmentStatus.PENDING.name())
                    .customer(customer)
                    .serviceProvider(provider)
                    .service(service)
                    .build();

            Appointment saved = appointmentRepository.save(appointment);

            notificationService.createNotification(
                    customer,
                    "Appointment Booked",
                    "Your booking request for " + service.getName() + " with " + provider.getFullName() +
                            " on " + apptDate + " at " + startTime + " has been placed successfully.",
                    "APPOINTMENT_REQUEST",
                    saved.getId()
            );

            notificationService.createNotification(
                    provider,
                    "New Booking Request",
                    customer.getFullName() + " has booked " + service.getName() +
                            " for " + apptDate + " at " + startTime + ".",
                    "APPOINTMENT_REQUEST",
                    saved.getId()
            );

            log.info("Customer {} booked appointment ID {} with provider {}",
                    customerEmail, saved.getId(), provider.getEmail());

            return AppointmentResponse.fromEntity(saved);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AppointmentResponse> getAppointments(
            String customerEmail,
            String search,
            String status,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    ) {
        User customer = getCustomer(customerEmail);
        String trimmedSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String trimmedStatus = (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status))
                ? status.trim().toUpperCase() : null;

        Page<Appointment> page = appointmentRepository.findCustomerFiltered(
                customer.getId(),
                trimmedSearch,
                trimmedStatus,
                startDate,
                endDate,
                pageable
        );

        return PageResponse.of(page.map(AppointmentResponse::fromEntity));
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(String customerEmail, Long appointmentId) {
        User customer = getCustomer(customerEmail);
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));

        if (appt.getCustomer() == null || !appt.getCustomer().getId().equals(customer.getId())) {
            throw new BadRequestException("Access denied: You do not have permission to view this appointment");
        }

        return AppointmentResponse.fromEntity(appt);
    }

    @Override
    @Transactional
    public AppointmentResponse cancelAppointment(String customerEmail, Long appointmentId, CancelAppointmentRequest request) {
        User customer = getCustomer(customerEmail);
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));

        if (appt.getCustomer() == null || !appt.getCustomer().getId().equals(customer.getId())) {
            throw new BadRequestException("Access denied: You do not have permission to cancel this appointment");
        }

        if (AppointmentStatus.CANCELLED.name().equalsIgnoreCase(appt.getStatus())) {
            throw new BadRequestException("Appointment is already cancelled");
        }

        if (AppointmentStatus.COMPLETED.name().equalsIgnoreCase(appt.getStatus())) {
            throw new BadRequestException("Completed appointments cannot be cancelled");
        }

        if (appt.getAppointmentTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Past appointments cannot be cancelled");
        }

        appt.setStatus(AppointmentStatus.CANCELLED.name());
        appt.setCancellationReason(request.getReason());
        Appointment saved = appointmentRepository.save(appt);

        notificationService.createNotification(
                customer,
                "Appointment Cancelled",
                "Your appointment on " + appt.getAppointmentTime() + " has been cancelled. Reason: " + request.getReason(),
                "APPOINTMENT_CANCELLED",
                saved.getId()
        );

        if (appt.getServiceProvider() != null) {
            notificationService.createNotification(
                    appt.getServiceProvider(),
                    "Appointment Cancelled by Customer",
                    customer.getFullName() + " cancelled appointment on " + appt.getAppointmentTime() +
                            ". Reason: " + request.getReason(),
                    "APPOINTMENT_CANCELLED",
                    saved.getId()
            );
        }

        log.info("Customer {} cancelled appointment ID {}", customerEmail, saved.getId());
        return AppointmentResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public AppointmentResponse rescheduleAppointment(String customerEmail, Long appointmentId, RescheduleAppointmentRequest request) {
        User customer = getCustomer(customerEmail);
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));

        if (appt.getCustomer() == null || !appt.getCustomer().getId().equals(customer.getId())) {
            throw new BadRequestException("Access denied: You do not have permission to reschedule this appointment");
        }

        if (AppointmentStatus.CANCELLED.name().equalsIgnoreCase(appt.getStatus())) {
            throw new BadRequestException("Cancelled appointments cannot be rescheduled");
        }

        if (AppointmentStatus.COMPLETED.name().equalsIgnoreCase(appt.getStatus())) {
            throw new BadRequestException("Completed appointments cannot be rescheduled");
        }

        LocalDateTime newTime = request.getNewAppointmentTime();
        if (newTime == null || newTime.isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Cannot reschedule appointment to a past or invalid time");
        }

        User provider = appt.getServiceProvider();
        if (provider == null || !provider.isEnabled()) {
            throw new BadRequestException("Associated provider is not available for rescheduling");
        }

        int duration = (appt.getService() != null && appt.getService().getDurationMinutes() != null)
                ? appt.getService().getDurationMinutes() : 30;
        LocalTime startTime = newTime.toLocalTime();
        LocalTime endTime = startTime.plusMinutes(duration);
        LocalDate apptDate = newTime.toLocalDate();
        DayOfWeek dow = newTime.getDayOfWeek();

        synchronized (("provider_booking_lock_" + provider.getId()).intern()) {
            List<ProviderAvailability> availabilities = availabilityRepository
                    .findByProviderIdAndDayOfWeekAndActiveTrue(provider.getId(), dow);

            if (availabilities.isEmpty()) {
                throw new BadRequestException("Provider does not work on " + dow);
            }

            boolean withinWorkingHours = false;
            for (ProviderAvailability av : availabilities) {
                if (!startTime.isBefore(av.getStartTime()) && !endTime.isAfter(av.getEndTime())) {
                    if (av.getBreakStartTime() != null && av.getBreakEndTime() != null) {
                        if (startTime.isBefore(av.getBreakEndTime()) && endTime.isAfter(av.getBreakStartTime())) {
                            throw new BadRequestException("Selected reschedule time overlaps with provider break time");
                        }
                    }
                    withinWorkingHours = true;
                    break;
                }
            }

            if (!withinWorkingHours) {
                throw new BadRequestException("Selected reschedule time is outside provider working hours");
            }

            // Check provider conflicts excluding this appointment
            List<Appointment> providerDayAppts = appointmentRepository.findByServiceProviderIdAndAppointmentTimeBetween(
                    provider.getId(), apptDate.atStartOfDay(), apptDate.atTime(LocalTime.MAX)
            );
            boolean providerConflict = providerDayAppts.stream()
                    .filter(a -> !a.getId().equals(appt.getId()) && !AppointmentStatus.CANCELLED.name().equalsIgnoreCase(a.getStatus()))
                    .anyMatch(a -> {
                        LocalTime aStart = a.getAppointmentTime().toLocalTime();
                        int aDur = (a.getService() != null && a.getService().getDurationMinutes() != null)
                                ? a.getService().getDurationMinutes() : 30;
                        LocalTime aEnd = aStart.plusMinutes(aDur);
                        return startTime.isBefore(aEnd) && endTime.isAfter(aStart);
                    });

            if (providerConflict) {
                throw new BadRequestException("Selected time slot is already booked for this provider");
            }

            // Check customer conflicts excluding this appointment
            List<Appointment> customerDayAppts = appointmentRepository.findByCustomerIdAndAppointmentTimeBetween(
                    customer.getId(), apptDate.atStartOfDay(), apptDate.atTime(LocalTime.MAX)
            );
            boolean customerConflict = customerDayAppts.stream()
                    .filter(a -> !a.getId().equals(appt.getId()) && !AppointmentStatus.CANCELLED.name().equalsIgnoreCase(a.getStatus()))
                    .anyMatch(a -> {
                        LocalTime aStart = a.getAppointmentTime().toLocalTime();
                        int aDur = (a.getService() != null && a.getService().getDurationMinutes() != null)
                                ? a.getService().getDurationMinutes() : 30;
                        LocalTime aEnd = aStart.plusMinutes(aDur);
                        return startTime.isBefore(aEnd) && endTime.isAfter(aStart);
                    });

            if (customerConflict) {
                throw new BadRequestException("You already have another appointment scheduled during this time slot");
            }

            LocalDateTime oldTime = appt.getAppointmentTime();
            appt.setAppointmentTime(newTime);
            appt.setStatus(AppointmentStatus.PENDING.name());
            if (request.getReason() != null && !request.getReason().trim().isEmpty()) {
                String note = "Rescheduled: " + request.getReason().trim();
                appt.setDescription(appt.getDescription() != null ? appt.getDescription() + " | " + note : note);
            }

            Appointment saved = appointmentRepository.save(appt);

            notificationService.createNotification(
                    customer,
                    "Appointment Rescheduled",
                    "Your appointment has been rescheduled from " + oldTime + " to " + newTime +
                            " and is pending provider confirmation.",
                    "APPOINTMENT_REQUEST",
                    saved.getId()
            );

            notificationService.createNotification(
                    provider,
                    "Appointment Rescheduled by Customer",
                    customer.getFullName() + " rescheduled appointment to " + newTime + ".",
                    "APPOINTMENT_REQUEST",
                    saved.getId()
            );

            log.info("Customer {} rescheduled appointment ID {} from {} to {}",
                    customerEmail, saved.getId(), oldTime, newTime);

            return AppointmentResponse.fromEntity(saved);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AppointmentResponse> getAppointmentHistory(
            String customerEmail,
            String search,
            String status,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    ) {
        User customer = getCustomer(customerEmail);
        String trimmedSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String trimmedStatus = (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status))
                ? status.trim().toUpperCase() : null;

        Page<Appointment> page = appointmentRepository.findCustomerHistory(
                customer.getId(),
                LocalDateTime.now(),
                trimmedSearch,
                trimmedStatus,
                startDate,
                endDate,
                pageable
        );

        return PageResponse.of(page.map(AppointmentResponse::fromEntity));
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerProfileDto getCustomerProfile(String customerEmail) {
        User customer = getCustomer(customerEmail);
        return CustomerProfileDto.fromEntity(customer);
    }

    @Override
    @Transactional
    public CustomerProfileDto updateCustomerProfile(String customerEmail, UpdateCustomerProfileRequest request) {
        User customer = getCustomer(customerEmail);

        customer.setFullName(request.getFullName().trim());
        if (request.getPhoneNumber() != null) {
            customer.setPhoneNumber(request.getPhoneNumber().trim());
        }
        if (request.getDescription() != null) {
            customer.setDescription(request.getDescription().trim());
        }

        User saved = userRepository.save(customer);
        log.info("Customer profile updated for {}", customerEmail);
        return CustomerProfileDto.fromEntity(saved);
    }

    private User getCustomer(String email) {
        return userRepository.findByEmail(email)
                .filter(u -> u.getRole() == Role.CUSTOMER)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "email", email));
    }
}
