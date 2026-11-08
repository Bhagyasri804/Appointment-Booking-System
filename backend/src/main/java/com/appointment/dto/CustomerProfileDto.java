package com.appointment.dto;

import com.appointment.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerProfileDto {

    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String description;
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CustomerProfileDto fromEntity(User user) {
        if (user == null) {
            return null;
        }
        return CustomerProfileDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .description(user.getDescription())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
