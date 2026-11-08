package com.appointment.dto;

import com.appointment.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerProviderDto {

    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String specialization;
    private String description;
    private boolean enabled;
    private LocalDateTime createdAt;
    private List<AvailabilityDto> availabilities;

    public static CustomerProviderDto fromEntity(User user, List<AvailabilityDto> availabilities) {
        if (user == null) {
            return null;
        }
        return CustomerProviderDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .specialization(user.getSpecialization())
                .description(user.getDescription())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .availabilities(availabilities)
                .build();
    }
}
