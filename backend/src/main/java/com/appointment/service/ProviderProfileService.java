package com.appointment.service;

import com.appointment.dto.ProviderProfileDto;
import com.appointment.dto.UpdateProviderProfileRequest;

public interface ProviderProfileService {

    ProviderProfileDto getProfile(String providerEmail);

    ProviderProfileDto updateProfile(String providerEmail, UpdateProviderProfileRequest request);
}
