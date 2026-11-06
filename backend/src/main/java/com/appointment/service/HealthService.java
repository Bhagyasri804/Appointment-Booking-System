package com.appointment.service;

import java.util.Map;

public interface HealthService {

    /**
     * Retrieves the health and database connectivity status of the backend.
     *
     * @return Map containing health metadata and status flags.
     */
    Map<String, Object> getHealthStatus();
}
