package com.appointment.dto;

import com.appointment.entity.Appointment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {

    private Long id;
    private String title;
    private String description;
    private LocalDateTime appointmentTime;
    private String status;
    private String cancellationReason;

    // Customer Info
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    // Provider Info
    private Long providerId;
    private String providerName;
    private String providerEmail;
    private String providerPhone;

    // Service Info
    private Long serviceId;
    private String serviceName;
    private String categoryName;
    private Integer durationMinutes;
    private BigDecimal price;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AppointmentResponse fromEntity(Appointment entity) {
        if (entity == null) return null;
        return AppointmentResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .appointmentTime(entity.getAppointmentTime())
                .status(entity.getStatus())
                .cancellationReason(entity.getCancellationReason())
                .customerId(entity.getCustomer() != null ? entity.getCustomer().getId() : null)
                .customerName(entity.getCustomer() != null ? entity.getCustomer().getFullName() : "N/A")
                .customerEmail(entity.getCustomer() != null ? entity.getCustomer().getEmail() : "N/A")
                .customerPhone(entity.getCustomer() != null ? entity.getCustomer().getPhoneNumber() : "N/A")
                .providerId(entity.getServiceProvider() != null ? entity.getServiceProvider().getId() : null)
                .providerName(entity.getServiceProvider() != null ? entity.getServiceProvider().getFullName() : "N/A")
                .providerEmail(entity.getServiceProvider() != null ? entity.getServiceProvider().getEmail() : "N/A")
                .providerPhone(entity.getServiceProvider() != null ? entity.getServiceProvider().getPhoneNumber() : "N/A")
                .serviceId(entity.getService() != null ? entity.getService().getId() : null)
                .serviceName(entity.getService() != null ? entity.getService().getName() : "General Consultation")
                .categoryName(entity.getService() != null && entity.getService().getCategory() != null
                        ? entity.getService().getCategory().getName() : "General")
                .durationMinutes(entity.getService() != null ? entity.getService().getDurationMinutes() : 30)
                .price(entity.getService() != null ? entity.getService().getPrice() : BigDecimal.ZERO)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
