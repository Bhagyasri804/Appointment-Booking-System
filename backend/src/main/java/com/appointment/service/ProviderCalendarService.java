package com.appointment.service;

import com.appointment.dto.AppointmentResponse;
import com.appointment.dto.CalendarDayDto;

import java.time.LocalDate;
import java.util.List;

public interface ProviderCalendarService {

    CalendarDayDto getCalendarForDate(String providerEmail, LocalDate date);

    List<AppointmentResponse> getCalendarAppointments(String providerEmail, LocalDate startDate, LocalDate endDate, String status);
}
