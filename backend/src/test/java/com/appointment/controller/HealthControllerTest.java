package com.appointment.controller;

import com.appointment.service.HealthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class HealthControllerTest {

    @Test
    @DisplayName("GET /api/health should return UP status and 200 OK")
    void getHealthShouldReturnUp() {
        HealthService mockHealthService = () -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("status", "UP");
            map.put("service", "appointment-booking-backend");
            map.put("message", "Appointment Booking System backend is running successfully");
            return map;
        };

        HealthController controller = new HealthController(mockHealthService);
        ResponseEntity<Map<String, Object>> response = controller.getHealth();

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("UP", response.getBody().get("status"));
        assertEquals("Appointment Booking System backend is running successfully", response.getBody().get("message"));
    }
}
