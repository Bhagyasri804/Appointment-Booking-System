package com.appointment.service.impl;

import com.appointment.dto.AppointmentResponse;
import com.appointment.dto.CalendarDayDto;
import com.appointment.dto.TimeSlotDto;
import com.appointment.entity.Appointment;
import com.appointment.entity.AppointmentStatus;
import com.appointment.entity.ProviderAvailability;
import com.appointment.entity.User;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.AppointmentRepository;
import com.appointment.repository.ProviderAvailabilityRepository;
import com.appointment.repository.UserRepository;
import com.appointment.service.ProviderCalendarService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProviderCalendarServiceImpl implements ProviderCalendarService {

    private final ProviderAvailabilityRepository availabilityRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public CalendarDayDto getCalendarForDate(String providerEmail, LocalDate date) {
        User provider = getProviderByEmail(providerEmail);

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        List<Appointment> dayAppointments = appointmentRepository.findByServiceProviderIdAndAppointmentTimeBetween(
                provider.getId(), startOfDay, endOfDay
        );

        List<ProviderAvailability> availabilities = availabilityRepository.findByProviderIdAndDayOfWeekAndActiveTrue(
                provider.getId(), date.getDayOfWeek()
        );

        boolean hasWorkingHours = !availabilities.isEmpty();
        List<TimeSlotDto> slots = new ArrayList<>();

        if (hasWorkingHours) {
            for (ProviderAvailability availability : availabilities) {
                LocalTime current = availability.getStartTime();
                LocalTime end = availability.getEndTime();
                LocalTime breakStart = availability.getBreakStartTime();
                LocalTime breakEnd = availability.getBreakEndTime();

                while (current.isBefore(end)) {
                    LocalTime slotEnd = current.plusMinutes(30);
                    if (slotEnd.isAfter(end)) {
                        slotEnd = end;
                    }

                    // Check if inside break
                    boolean isBreak = false;
                    if (breakStart != null && breakEnd != null) {
                        // Slot overlaps break if current < breakEnd && slotEnd > breakStart
                        if (current.isBefore(breakEnd) && slotEnd.isAfter(breakStart)) {
                            isBreak = true;
                        }
                    }

                    if (isBreak) {
                        slots.add(TimeSlotDto.builder()
                                .startTime(current)
                                .endTime(slotEnd)
                                .status("BREAK")
                                .build());
                    } else {
                        // Check if an appointment overlaps this slot
                        LocalTime checkStart = current;
                        LocalTime checkEnd = slotEnd;
                        Appointment matchingAppt = dayAppointments.stream()
                                .filter(a -> !AppointmentStatus.CANCELLED.name().equalsIgnoreCase(a.getStatus()))
                                .filter(a -> {
                                    LocalTime apptTime = a.getAppointmentTime().toLocalTime();
                                    int duration = (a.getService() != null && a.getService().getDurationMinutes() != null)
                                            ? a.getService().getDurationMinutes() : 30;
                                    LocalTime apptEnd = apptTime.plusMinutes(duration);
                                    // Overlap: checkStart < apptEnd && checkEnd > apptTime
                                    return checkStart.isBefore(apptEnd) && checkEnd.isAfter(apptTime);
                                })
                                .findFirst()
                                .orElse(null);

                        if (matchingAppt != null) {
                            slots.add(TimeSlotDto.builder()
                                    .startTime(current)
                                    .endTime(slotEnd)
                                    .status("BOOKED")
                                    .appointmentId(matchingAppt.getId())
                                    .appointmentTitle(matchingAppt.getTitle())
                                    .customerName(matchingAppt.getCustomer() != null ? matchingAppt.getCustomer().getFullName() : "N/A")
                                    .customerEmail(matchingAppt.getCustomer() != null ? matchingAppt.getCustomer().getEmail() : "")
                                    .serviceName(matchingAppt.getService() != null ? matchingAppt.getService().getName() : "")
                                    .build());
                        } else {
                            slots.add(TimeSlotDto.builder()
                                    .startTime(current)
                                    .endTime(slotEnd)
                                    .status("AVAILABLE")
                                    .build());
                        }
                    }

                    current = slotEnd;
                }
            }
        }

        List<AppointmentResponse> appointmentResponses = dayAppointments.stream()
                .map(AppointmentResponse::fromEntity)
                .collect(Collectors.toList());

        return CalendarDayDto.builder()
                .date(date)
                .dayOfWeek(date.getDayOfWeek().name())
                .hasWorkingHours(hasWorkingHours)
                .slots(slots)
                .appointments(appointmentResponses)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getCalendarAppointments(String providerEmail, LocalDate startDate, LocalDate endDate, String status) {
        User provider = getProviderByEmail(providerEmail);

        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : LocalDate.now().minusMonths(1).atStartOfDay();
        LocalDateTime end = endDate != null ? endDate.atTime(LocalTime.MAX) : LocalDate.now().plusMonths(1).atTime(LocalTime.MAX);

        List<Appointment> appointments = appointmentRepository.findByServiceProviderIdAndAppointmentTimeBetween(
                provider.getId(), start, end
        );

        return appointments.stream()
                .filter(a -> status == null || status.trim().isEmpty() || a.getStatus().equalsIgnoreCase(status.trim()))
                .map(AppointmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    private User getProviderByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }
}
