package com.appointment.controller;

import com.appointment.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/provider")
@PreAuthorize("hasRole('SERVICE_PROVIDER')")
public class ProviderController {

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProviderDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("role", "SERVICE_PROVIDER");
        data.put("email", userDetails.getUsername());
        data.put("message", "Welcome to Service Provider Portal");
        data.put("accessibleFeatures", new String[]{"manage_schedule", "view_clients", "update_services"});

        return ResponseEntity.ok(ApiResponse.ok("Service provider dashboard retrieved successfully", data));
    }
}
