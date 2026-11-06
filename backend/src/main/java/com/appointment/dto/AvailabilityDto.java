package com.appointment.dto;

import com.appointment.entity.ProviderAvailability;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityDto {

    private Long id;
    private DayOfWeek dayOfWeek;
    private String dayName;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime breakStartTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime breakEndTime;

    private boolean active;

    public static AvailabilityDto fromEntity(ProviderAvailability entity) {
        if (entity == null) {
            return null;
        }
        return AvailabilityDto.builder()
                .id(entity.getId())
                .dayOfWeek(entity.getDayOfWeek())
                .dayName(entity.getDayOfWeek() != null ? entity.getDayOfWeek().name() : "")
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .breakStartTime(entity.getBreakStartTime())
                .breakEndTime(entity.getBreakEndTime())
                .active(entity.isActive())
                .build();
    }
}
