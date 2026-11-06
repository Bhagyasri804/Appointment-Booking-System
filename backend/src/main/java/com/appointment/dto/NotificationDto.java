package com.appointment.dto;

import com.appointment.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {

    private Long id;
    private String title;
    private String message;
    private String type;
    private boolean read;
    private Long relatedAppointmentId;
    private LocalDateTime createdAt;

    public static NotificationDto fromEntity(Notification entity) {
        if (entity == null) {
            return null;
        }
        return NotificationDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .message(entity.getMessage())
                .type(entity.getType())
                .read(entity.isRead())
                .relatedAppointmentId(entity.getRelatedAppointmentId())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
