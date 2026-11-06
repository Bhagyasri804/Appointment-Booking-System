package com.appointment.controller;

import com.appointment.dto.ApiResponse;
import com.appointment.dto.AppointmentResponse;
import com.appointment.dto.AvailabilityDto;
import com.appointment.dto.AvailabilityRequest;
import com.appointment.dto.CalendarDayDto;
import com.appointment.dto.NotificationDto;
import com.appointment.dto.PageResponse;
import com.appointment.dto.ProviderOverviewDto;
import com.appointment.dto.ProviderProfileDto;
import com.appointment.dto.RejectAppointmentRequest;
import com.appointment.dto.UpdateProviderProfileRequest;
import com.appointment.service.NotificationService;
import com.appointment.service.ProviderAppointmentService;
import com.appointment.service.ProviderAvailabilityService;
import com.appointment.service.ProviderCalendarService;
import com.appointment.service.ProviderDashboardService;
import com.appointment.service.ProviderProfileService;
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
import org.springframework.web.bind.annotation.DeleteMapping;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/provider")
@PreAuthorize("hasRole('SERVICE_PROVIDER')")
@RequiredArgsConstructor
public class ProviderController {

    private final ProviderDashboardService dashboardService;
    private final ProviderProfileService profileService;
    private final ProviderAvailabilityService availabilityService;
    private final ProviderAppointmentService appointmentService;
    private final ProviderCalendarService calendarService;
    private final NotificationService notificationService;

    // --- Backward Compatible Dashboard ---

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProviderDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        ProviderOverviewDto overview = dashboardService.getProviderOverview(email);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("role", "SERVICE_PROVIDER");
        data.put("email", email);
        data.put("message", "Welcome to Service Provider Portal");
        data.put("overview", overview);
        data.put("accessibleFeatures", new String[]{"manage_schedule", "view_clients", "update_services", "calendar", "notifications"});

        return ResponseEntity.ok(ApiResponse.ok("Service provider dashboard retrieved successfully", data));
    }

    // --- 1. Overview & Statistics ---

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<ProviderOverviewDto>> getOverview(
            @AuthenticationPrincipal UserDetails userDetails) {
        ProviderOverviewDto overview = dashboardService.getProviderOverview(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Provider overview retrieved successfully", overview));
    }

    // --- 2. Profile Management ---

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<ProviderProfileDto>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        ProviderProfileDto profile = profileService.getProfile(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Provider profile retrieved successfully", profile));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<ProviderProfileDto>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProviderProfileRequest request) {
        ProviderProfileDto updated = profileService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.ok("Provider profile updated successfully", updated));
    }

    // --- 3. Availability Management ---

    @GetMapping("/availability")
    public ResponseEntity<ApiResponse<List<AvailabilityDto>>> getAvailabilities(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<AvailabilityDto> list = availabilityService.getAvailabilities(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Provider availabilities retrieved successfully", list));
    }

    @PostMapping("/availability")
    public ResponseEntity<ApiResponse<AvailabilityDto>> createAvailability(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AvailabilityRequest request) {
        AvailabilityDto created = availabilityService.createAvailability(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Availability slot created successfully", created));
    }

    @PutMapping("/availability/{id}")
    public ResponseEntity<ApiResponse<AvailabilityDto>> updateAvailability(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody AvailabilityRequest request) {
        AvailabilityDto updated = availabilityService.updateAvailability(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(ApiResponse.ok("Availability slot updated successfully", updated));
    }

    @DeleteMapping("/availability/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAvailability(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        availabilityService.deleteAvailability(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.ok("Availability slot deleted successfully", null));
    }

    // --- 4. Appointment Management ---

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
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PageResponse<AppointmentResponse> response = appointmentService.getAppointments(
                userDetails.getUsername(), search, status, startDate, endDate, pageable);

        return ResponseEntity.ok(ApiResponse.ok("Appointments retrieved successfully", response));
    }

    @GetMapping("/appointments/{id}")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        AppointmentResponse response = appointmentService.getAppointmentById(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.ok("Appointment details retrieved successfully", response));
    }

    @PutMapping("/appointments/{id}/confirm")
    public ResponseEntity<ApiResponse<AppointmentResponse>> confirmAppointment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        AppointmentResponse confirmed = appointmentService.confirmAppointment(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.ok("Appointment confirmed successfully", confirmed));
    }

    @PutMapping("/appointments/{id}/reject")
    public ResponseEntity<ApiResponse<AppointmentResponse>> rejectAppointment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody RejectAppointmentRequest request) {
        AppointmentResponse rejected = appointmentService.rejectAppointment(userDetails.getUsername(), id, request.getReason());
        return ResponseEntity.ok(ApiResponse.ok("Appointment rejected successfully", rejected));
    }

    @PutMapping("/appointments/{id}/complete")
    public ResponseEntity<ApiResponse<AppointmentResponse>> completeAppointment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        AppointmentResponse completed = appointmentService.completeAppointment(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.ok("Appointment marked as completed successfully", completed));
    }

    // --- 5. Calendar & Time Slots ---

    @GetMapping("/calendar/day")
    public ResponseEntity<ApiResponse<CalendarDayDto>> getCalendarDay(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        CalendarDayDto day = calendarService.getCalendarForDate(userDetails.getUsername(), date);
        return ResponseEntity.ok(ApiResponse.ok("Calendar day schedule retrieved successfully", day));
    }

    @GetMapping("/calendar/appointments")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getCalendarAppointments(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String status) {
        List<AppointmentResponse> list = calendarService.getCalendarAppointments(
                userDetails.getUsername(), startDate, endDate, status);
        return ResponseEntity.ok(ApiResponse.ok("Calendar appointments retrieved successfully", list));
    }

    // --- 6. Notifications ---

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
        return ResponseEntity.ok(ApiResponse.ok("Unread notifications count retrieved", count));
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<ApiResponse<NotificationDto>> markNotificationRead(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        NotificationDto updated = notificationService.markAsRead(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read", updated));
    }

    @PutMapping("/notifications/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllNotificationsRead(
            @AuthenticationPrincipal UserDetails userDetails) {
        notificationService.markAllAsRead(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read", null));
    }
}
