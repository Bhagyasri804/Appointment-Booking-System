package com.appointment.service.impl;

import com.appointment.dto.AvailabilityDto;
import com.appointment.dto.AvailabilityRequest;
import com.appointment.entity.ProviderAvailability;
import com.appointment.entity.User;
import com.appointment.exception.BadRequestException;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.ProviderAvailabilityRepository;
import com.appointment.repository.UserRepository;
import com.appointment.service.ProviderAvailabilityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProviderAvailabilityServiceImpl implements ProviderAvailabilityService {

    private final ProviderAvailabilityRepository availabilityRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AvailabilityDto> getAvailabilities(String providerEmail) {
        User provider = getProviderByEmail(providerEmail);
        return availabilityRepository.findByProviderIdOrderByDayOfWeekAscStartTimeAsc(provider.getId())
                .stream()
                .map(AvailabilityDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AvailabilityDto createAvailability(String providerEmail, AvailabilityRequest request) {
        User provider = getProviderByEmail(providerEmail);

        validateAvailabilityTimes(request, null, provider.getId());

        ProviderAvailability availability = ProviderAvailability.builder()
                .provider(provider)
                .dayOfWeek(request.getDayOfWeek())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .breakStartTime(request.getBreakStartTime())
                .breakEndTime(request.getBreakEndTime())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        ProviderAvailability saved = availabilityRepository.save(availability);
        log.info("Created availability slot ID {} for provider {} on {}", saved.getId(), providerEmail, request.getDayOfWeek());
        return AvailabilityDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public AvailabilityDto updateAvailability(String providerEmail, Long availabilityId, AvailabilityRequest request) {
        User provider = getProviderByEmail(providerEmail);

        ProviderAvailability existing = availabilityRepository.findById(availabilityId)
                .orElseThrow(() -> new ResourceNotFoundException("ProviderAvailability", "id", availabilityId));

        if (!existing.getProvider().getId().equals(provider.getId())) {
            throw new BadRequestException("Access denied: You do not own this availability schedule");
        }

        validateAvailabilityTimes(request, availabilityId, provider.getId());

        existing.setDayOfWeek(request.getDayOfWeek());
        existing.setStartTime(request.getStartTime());
        existing.setEndTime(request.getEndTime());
        existing.setBreakStartTime(request.getBreakStartTime());
        existing.setBreakEndTime(request.getBreakEndTime());
        if (request.getActive() != null) {
            existing.setActive(request.getActive());
        }

        ProviderAvailability updated = availabilityRepository.save(existing);
        log.info("Updated availability slot ID {} for provider {}", updated.getId(), providerEmail);
        return AvailabilityDto.fromEntity(updated);
    }

    @Override
    @Transactional
    public void deleteAvailability(String providerEmail, Long availabilityId) {
        User provider = getProviderByEmail(providerEmail);

        ProviderAvailability existing = availabilityRepository.findById(availabilityId)
                .orElseThrow(() -> new ResourceNotFoundException("ProviderAvailability", "id", availabilityId));

        if (!existing.getProvider().getId().equals(provider.getId())) {
            throw new BadRequestException("Access denied: You do not own this availability schedule");
        }

        availabilityRepository.delete(existing);
        log.info("Deleted availability slot ID {} for provider {}", availabilityId, providerEmail);
    }

    private void validateAvailabilityTimes(AvailabilityRequest request, Long currentSlotId, Long providerId) {
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new BadRequestException("Working hours end time must be after start time");
        }

        boolean hasBreakStart = request.getBreakStartTime() != null;
        boolean hasBreakEnd = request.getBreakEndTime() != null;

        if (hasBreakStart != hasBreakEnd) {
            throw new BadRequestException("Both break start time and break end time must be specified");
        }

        if (hasBreakStart) {
            if (!request.getBreakStartTime().isBefore(request.getBreakEndTime())) {
                throw new BadRequestException("Break end time must be after break start time");
            }

            if (request.getBreakStartTime().isBefore(request.getStartTime()) || request.getBreakEndTime().isAfter(request.getEndTime())) {
                throw new BadRequestException(String.format("Break time (%s - %s) must fall entirely within working hours (%s - %s)",
                        request.getBreakStartTime(), request.getBreakEndTime(), request.getStartTime(), request.getEndTime()));
            }
        }

        // Check for overlapping slots for the same day of week
        List<ProviderAvailability> sameDaySlots = availabilityRepository.findByProviderIdAndDayOfWeek(providerId, request.getDayOfWeek());
        for (ProviderAvailability slot : sameDaySlots) {
            if (currentSlotId != null && slot.getId().equals(currentSlotId)) {
                continue; // Skip self when updating
            }
            // Overlap condition: start < other.end AND end > other.start
            boolean overlaps = request.getStartTime().isBefore(slot.getEndTime()) && request.getEndTime().isAfter(slot.getStartTime());
            if (overlaps) {
                throw new BadRequestException(String.format("Availability slot (%s - %s) overlaps with an existing slot (%s - %s) on %s",
                        request.getStartTime(), request.getEndTime(), slot.getStartTime(), slot.getEndTime(), request.getDayOfWeek()));
            }
        }
    }

    private User getProviderByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }
}
