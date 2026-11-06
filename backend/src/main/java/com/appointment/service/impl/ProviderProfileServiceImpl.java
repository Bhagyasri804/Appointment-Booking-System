package com.appointment.service.impl;

import com.appointment.dto.ProviderProfileDto;
import com.appointment.dto.UpdateProviderProfileRequest;
import com.appointment.entity.User;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.UserRepository;
import com.appointment.service.ProviderProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProviderProfileServiceImpl implements ProviderProfileService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public ProviderProfileDto getProfile(String providerEmail) {
        User provider = getProviderByEmail(providerEmail);
        return ProviderProfileDto.fromEntity(provider);
    }

    @Override
    @Transactional
    public ProviderProfileDto updateProfile(String providerEmail, UpdateProviderProfileRequest request) {
        User provider = getProviderByEmail(providerEmail);

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            provider.setFullName(request.getFullName().trim());
        }
        provider.setPhoneNumber(request.getPhoneNumber());
        provider.setDescription(request.getDescription());
        provider.setSpecialization(request.getSpecialization());

        User updated = userRepository.save(provider);
        log.info("Provider profile updated successfully for: {}", providerEmail);
        return ProviderProfileDto.fromEntity(updated);
    }

    private User getProviderByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }
}
