package com.appointment.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeSlotDto {

    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    /**
     * AVAILABLE, BOOKED, BREAK, UNAVAILABLE
     */
    private String status;

    private Long appointmentId;
    private String appointmentTitle;
    private String customerName;
    private String customerEmail;
    private String serviceName;
}
