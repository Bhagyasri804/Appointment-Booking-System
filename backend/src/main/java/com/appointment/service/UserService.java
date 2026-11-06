package com.appointment.service;

import com.appointment.dto.PageResponse;
import com.appointment.dto.UserResponse;
import com.appointment.entity.Role;

import java.util.List;

public interface UserService {

    List<UserResponse> getAllUsers();

    List<UserResponse> getUsersByRole(Role role);

    UserResponse getUserById(Long id);

    PageResponse<UserResponse> getUsers(
            String search,
            Role role,
            Boolean enabled,
            int page,
            int size,
            String sortBy,
            String sortDir
    );

    UserResponse toggleUserStatus(Long id, boolean enabled, String requestingAdminEmail);
}
