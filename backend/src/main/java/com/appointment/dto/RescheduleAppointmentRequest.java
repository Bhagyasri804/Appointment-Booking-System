package com.appointment.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RescheduleAppointmentRequest {

    @NotNull(message = "New appointment date and time is required")
    private LocalDateTime newAppointmentTime;

    @Size(max = 500, message = "Reschedule reason cannot exceed 500 characters")
    private String reason;
}
