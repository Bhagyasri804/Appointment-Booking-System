package com.appointment.controller;

import com.appointment.dto.ApiResponse;
import com.appointment.dto.UserResponse;
import com.appointment.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("role", "ADMIN");
        data.put("email", userDetails.getUsername());
        data.put("message", "Welcome to Admin Command Center");
        data.put("accessibleFeatures", new String[]{"system_overview", "user_management", "audit_logs", "settings"});

        return ResponseEntity.ok(ApiResponse.ok("Admin dashboard retrieved successfully", data));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok("All users retrieved successfully", users));
    }
}
