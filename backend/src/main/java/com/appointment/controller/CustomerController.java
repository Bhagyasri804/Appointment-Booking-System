package com.appointment.controller;

import com.appointment.dto.ApiResponse;
import com.appointment.dto.AppointmentResponse;
import com.appointment.dto.AvailabilityDto;
import com.appointment.dto.BookAppointmentRequest;
import com.appointment.dto.CancelAppointmentRequest;
import com.appointment.dto.CustomerDashboardDto;
import com.appointment.dto.CustomerProfileDto;
import com.appointment.dto.CustomerProviderDto;
import com.appointment.dto.NotificationDto;
import com.appointment.dto.PageResponse;
import com.appointment.dto.RescheduleAppointmentRequest;
import com.appointment.dto.ServiceCategoryDto;
import com.appointment.dto.ServiceDto;
import com.appointment.dto.TimeSlotDto;
import com.appointment.dto.UpdateCustomerProfileRequest;
import com.appointment.repository.ServiceCategoryRepository;
import com.appointment.service.CustomerService;
import com.appointment.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/customer")
@PreAuthorize("hasRole('CUSTOMER')")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;
    private final NotificationService notificationService;
    private final ServiceCategoryRepository serviceCategoryRepository;

    // --- 1. Dashboard Overview ---

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<CustomerDashboardDto>> getCustomerDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {
        CustomerDashboardDto dashboard = customerService.getCustomerDashboard(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Customer dashboard retrieved successfully", dashboard));
    }

    // --- 2. Browse Services ---

    @GetMapping("/services")
    public ResponseEntity<ApiResponse<List<ServiceDto>>> getServices(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        List<ServiceDto> services = customerService.getServices(search, categoryId, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.ok("Services retrieved successfully", services));
    }

    @GetMapping("/services/{id}")
    public ResponseEntity<ApiResponse<ServiceDto>> getServiceById(@PathVariable Long id) {
        ServiceDto service = customerService.getServiceById(id);
        return ResponseEntity.ok(ApiResponse.ok("Service details retrieved successfully", service));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<ServiceCategoryDto>>> getCategories() {
        List<ServiceCategoryDto> categories = serviceCategoryRepository.findByActiveTrue().stream()
                .map(ServiceCategoryDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok("Active categories retrieved successfully", categories));
    }

    // --- 3. Browse Service Providers & Availability ---

    @GetMapping("/providers")
    public ResponseEntity<ApiResponse<List<CustomerProviderDto>>> getProviders(
            @RequestParam(required = false) String search) {
        List<CustomerProviderDto> providers = customerService.getProviders(search);
        return ResponseEntity.ok(ApiResponse.ok("Service providers retrieved successfully", providers));
    }

    @GetMapping("/providers/{id}")
    public ResponseEntity<ApiResponse<CustomerProviderDto>> getProviderById(@PathVariable Long id) {
        CustomerProviderDto provider = customerService.getProviderById(id);
        return ResponseEntity.ok(ApiResponse.ok("Provider profile retrieved successfully", provider));
    }

    @GetMapping("/providers/{id}/availability")
    public ResponseEntity<ApiResponse<List<AvailabilityDto>>> getProviderAvailability(@PathVariable Long id) {
        List<AvailabilityDto> availabilities = customerService.getProviderAvailability(id);
        return ResponseEntity.ok(ApiResponse.ok("Provider availability retrieved successfully", availabilities));
    }

    @GetMapping("/available-slots")
    public ResponseEntity<ApiResponse<List<TimeSlotDto>>> getAvailableSlots(
            @RequestParam Long providerId,
            @RequestParam Long serviceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<TimeSlotDto> slots = customerService.getAvailableSlots(providerId, serviceId, date);
        return ResponseEntity.ok(ApiResponse.ok("Available time slots retrieved successfully", slots));
    }

    // --- 4. Book Appointments ---

    @PostMapping("/appointments")
    public ResponseEntity<ApiResponse<AppointmentResponse>> bookAppointment(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BookAppointmentRequest request) {
        AppointmentResponse appointment = customerService.bookAppointment(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Appointment booked successfully", appointment));
    }

    // --- 5. Customer Appointments ---

    @GetMapping("/appointments")
    public ResponseEntity<ApiResponse<PageResponse<AppointmentResponse>>> getAppointments(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "appointmentTime") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        PageResponse<AppointmentResponse> response = customerService.getAppointments(
                userDetails.getUsername(), search, status, startDate, endDate, pageable
        );
        return ResponseEntity.ok(ApiResponse.ok("Appointments retrieved successfully", response));
    }

    @GetMapping("/appointments/{id}")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        AppointmentResponse appt = customerService.getAppointmentById(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.ok("Appointment details retrieved successfully", appt));
    }

    @PutMapping("/appointments/{id}/cancel")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancelAppointment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody CancelAppointmentRequest request) {
        AppointmentResponse cancelled = customerService.cancelAppointment(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(ApiResponse.ok("Appointment cancelled successfully", cancelled));
    }

    @PutMapping("/appointments/{id}/reschedule")
    public ResponseEntity<ApiResponse<AppointmentResponse>> rescheduleAppointment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody RescheduleAppointmentRequest request) {
        AppointmentResponse rescheduled = customerService.rescheduleAppointment(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(ApiResponse.ok("Appointment rescheduled successfully", rescheduled));
    }

    // --- 6. Appointment History ---

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<PageResponse<AppointmentResponse>>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "appointmentTime") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        PageResponse<AppointmentResponse> response = customerService.getAppointmentHistory(
                userDetails.getUsername(), search, status, startDate, endDate, pageable
        );
        return ResponseEntity.ok(ApiResponse.ok("Appointment history retrieved successfully", response));
    }

    // --- 7. Customer Profile ---

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<CustomerProfileDto>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        CustomerProfileDto profile = customerService.getCustomerProfile(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Customer profile retrieved successfully", profile));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<CustomerProfileDto>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateCustomerProfileRequest request) {
        CustomerProfileDto profile = customerService.updateCustomerProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.ok("Customer profile updated successfully", profile));
    }

    // --- 8. Notifications ---

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<NotificationDto> notifications = notificationService.getNotifications(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Notifications retrieved successfully", notifications));
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadNotificationCount(
            @AuthenticationPrincipal UserDetails userDetails) {
        long count = notificationService.getUnreadCount(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Unread count retrieved successfully", count));
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<ApiResponse<NotificationDto>> markNotificationRead(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        NotificationDto notification = notificationService.markAsRead(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read", notification));
    }

    @PutMapping("/notifications/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllNotificationsRead(
            @AuthenticationPrincipal UserDetails userDetails) {
        notificationService.markAllAsRead(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read", null));
    }
}
