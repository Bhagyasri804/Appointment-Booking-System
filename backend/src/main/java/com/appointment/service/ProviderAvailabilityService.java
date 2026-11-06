package com.appointment.service;

import com.appointment.dto.AvailabilityDto;
import com.appointment.dto.AvailabilityRequest;

import java.util.List;

public interface ProviderAvailabilityService {

    List<AvailabilityDto> getAvailabilities(String providerEmail);

    AvailabilityDto createAvailability(String providerEmail, AvailabilityRequest request);

    AvailabilityDto updateAvailability(String providerEmail, Long availabilityId, AvailabilityRequest request);

    void deleteAvailability(String providerEmail, Long availabilityId);
}
