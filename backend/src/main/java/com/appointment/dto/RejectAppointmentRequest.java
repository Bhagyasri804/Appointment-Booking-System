package com.appointment.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RejectAppointmentRequest {

    @NotBlank(message = "Rejection reason is required")
    @JsonAlias({"cancellationReason", "rejectionReason"})
    private String reason;
}
