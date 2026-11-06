package com.appointment.controller;

import com.appointment.dto.AdminDashboardStatsDto;
import com.appointment.dto.ApiResponse;
import com.appointment.dto.AppointmentResponse;
import com.appointment.dto.CancelAppointmentRequest;
import com.appointment.dto.CategoryRequest;
import com.appointment.dto.PageResponse;
import com.appointment.dto.ReportsDto;
import com.appointment.dto.ServiceCategoryDto;
import com.appointment.dto.ServiceDto;
import com.appointment.dto.ServiceRequest;
import com.appointment.dto.UserResponse;
import com.appointment.dto.UserStatusUpdateRequest;
import com.appointment.entity.Role;
import com.appointment.service.AdminAppointmentService;
import com.appointment.service.AdminDashboardService;
import com.appointment.service.ServiceManagementService;
import com.appointment.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final AdminDashboardService adminDashboardService;
    private final ServiceManagementService serviceManagementService;
    private final AdminAppointmentService adminAppointmentService;

    // --- Overview & Diagnostics ---
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("role", "ADMIN");
        data.put("email", userDetails.getUsername());
        data.put("message", "Welcome to Admin Command Center");
        data.put("accessibleFeatures", new String[]{
                "dashboard_stats", "user_management", "service_management", "appointment_management", "reports_analytics"
        });

        return ResponseEntity.ok(ApiResponse.ok("Admin dashboard retrieved successfully", data));
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<AdminDashboardStatsDto>> getDashboardStats() {
        AdminDashboardStatsDto stats = adminDashboardService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.ok("Dashboard statistics retrieved successfully", stats));
    }

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<ReportsDto>> getReports() {
        ReportsDto reports = adminDashboardService.getReports();
        return ResponseEntity.ok(ApiResponse.ok("Reports and analytics retrieved successfully", reports));
    }

    // --- User Management ---
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean enabled,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        PageResponse<UserResponse> users = userService.getUsers(search, role, enabled, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.ok("Users retrieved successfully", users));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.ok("User retrieved successfully", user));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UserStatusUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        UserResponse updated = userService.toggleUserStatus(id, request.getEnabled(), userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("User status updated successfully", updated));
    }

    // --- Service Management ---
    @GetMapping("/services")
    public ResponseEntity<ApiResponse<PageResponse<ServiceDto>>> getServices(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        PageResponse<ServiceDto> services = serviceManagementService.getServices(search, categoryId, active, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.ok("Services retrieved successfully", services));
    }

    @GetMapping("/services/{id}")
    public ResponseEntity<ApiResponse<ServiceDto>> getServiceById(@PathVariable Long id) {
        ServiceDto service = serviceManagementService.getServiceById(id);
        return ResponseEntity.ok(ApiResponse.ok("Service retrieved successfully", service));
    }

    @PostMapping("/services")
    public ResponseEntity<ApiResponse<ServiceDto>> createService(@Valid @RequestBody ServiceRequest request) {
        ServiceDto created = serviceManagementService.createService(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Service created successfully", created));
    }

    @PutMapping("/services/{id}")
    public ResponseEntity<ApiResponse<ServiceDto>> updateService(
            @PathVariable Long id,
            @Valid @RequestBody ServiceRequest request) {

        ServiceDto updated = serviceManagementService.updateService(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Service updated successfully", updated));
    }

    @DeleteMapping("/services/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteService(@PathVariable Long id) {
        serviceManagementService.deleteService(id);
        return ResponseEntity.ok(ApiResponse.ok("Service deleted successfully"));
    }

    @PutMapping("/services/{id}/status")
    public ResponseEntity<ApiResponse<ServiceDto>> toggleServiceStatus(
            @PathVariable Long id,
            @RequestParam boolean active) {

        ServiceDto updated = serviceManagementService.toggleServiceStatus(id, active);
        return ResponseEntity.ok(ApiResponse.ok("Service status updated successfully", updated));
    }

    // --- Service Categories ---
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<ServiceCategoryDto>>> getCategories() {
        List<ServiceCategoryDto> categories = serviceManagementService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.ok("Service categories retrieved successfully", categories));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<ServiceCategoryDto>> createCategory(@Valid @RequestBody CategoryRequest request) {
        ServiceCategoryDto created = serviceManagementService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Category created successfully", created));
    }

    // --- Appointment Management ---
    @GetMapping("/appointments")
    public ResponseEntity<ApiResponse<PageResponse<AppointmentResponse>>> getAppointments(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "appointmentTime") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        PageResponse<AppointmentResponse> appointments = adminAppointmentService.getAppointments(
                search, status, startDate, endDate, page, size, sortBy, sortDir
        );
        return ResponseEntity.ok(ApiResponse.ok("Appointments retrieved successfully", appointments));
    }

    @GetMapping("/appointments/{id}")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentById(@PathVariable Long id) {
        AppointmentResponse appointment = adminAppointmentService.getAppointmentById(id);
        return ResponseEntity.ok(ApiResponse.ok("Appointment retrieved successfully", appointment));
    }

    @PutMapping("/appointments/{id}/cancel")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancelAppointment(
            @PathVariable Long id,
            @Valid @RequestBody CancelAppointmentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        AppointmentResponse cancelled = adminAppointmentService.cancelAppointment(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Appointment cancelled successfully", cancelled));
    }
}
