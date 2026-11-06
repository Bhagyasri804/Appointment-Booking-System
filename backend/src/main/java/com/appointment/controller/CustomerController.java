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
@RequestMapping("/api/customer")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerController {

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCustomerDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("role", "CUSTOMER");
        data.put("email", userDetails.getUsername());
        data.put("message", "Welcome to Customer Portal");
        data.put("accessibleFeatures", new String[]{"browse_services", "book_appointment", "my_bookings"});

        return ResponseEntity.ok(ApiResponse.ok("Customer dashboard retrieved successfully", data));
    }
}
