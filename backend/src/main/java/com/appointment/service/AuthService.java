package com.appointment.service;

import com.appointment.dto.ApiResponse;
import com.appointment.dto.AuthResponse;
import com.appointment.dto.LoginRequest;
import com.appointment.dto.RegisterRequest;
import com.appointment.dto.UserResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse getCurrentUser(String email);

    ApiResponse<Void> logout(String bearerToken);
}
