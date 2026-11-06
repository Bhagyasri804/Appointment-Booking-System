package com.appointment.service.impl;

import com.appointment.service.HealthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class HealthServiceImpl implements HealthService {

    private final DataSource dataSource;

    @Override
    public Map<String, Object> getHealthStatus() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "UP");
        response.put("service", "appointment-booking-backend");
        response.put("message", "Appointment Booking System backend is running successfully");
        response.put("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());

        boolean dbConnected = false;
        String dbInfo = "DISCONNECTED";

        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(2)) {
                dbConnected = true;
                dbInfo = connection.getMetaData().getDatabaseProductName() + " " + connection.getMetaData().getDatabaseProductVersion();
            }
        } catch (Exception e) {
            log.warn("Database connectivity check failed: {}", e.getMessage());
            dbInfo = "Unavailable: " + e.getMessage();
        }

        Map<String, Object> dbDetails = new LinkedHashMap<>();
        dbDetails.put("status", dbConnected ? "CONNECTED" : "DISCONNECTED");
        dbDetails.put("database", "appointment_db");
        dbDetails.put("details", dbInfo);

        response.put("database", dbDetails);
        return response;
    }
}
