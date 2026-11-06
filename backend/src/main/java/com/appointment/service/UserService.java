package com.appointment.service;

import com.appointment.dto.UserResponse;
import com.appointment.entity.Role;

import java.util.List;

public interface UserService {

    List<UserResponse> getAllUsers();

    List<UserResponse> getUsersByRole(Role role);

    UserResponse getUserById(Long id);
}
