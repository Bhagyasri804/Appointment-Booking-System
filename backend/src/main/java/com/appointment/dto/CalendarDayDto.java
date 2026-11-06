package com.appointment.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarDayDto {

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
    private String dayOfWeek;
    private boolean hasWorkingHours;
    private List<TimeSlotDto> slots;
    private List<AppointmentResponse> appointments;
}
