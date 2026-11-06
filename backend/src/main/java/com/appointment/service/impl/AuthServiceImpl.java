package com.appointment.service.impl;

import com.appointment.dto.ApiResponse;
import com.appointment.dto.AuthResponse;
import com.appointment.dto.LoginRequest;
import com.appointment.dto.RegisterRequest;
import com.appointment.dto.UserResponse;
import com.appointment.entity.Role;
import com.appointment.entity.User;
import com.appointment.exception.BadRequestException;
import com.appointment.exception.EmailAlreadyExistsException;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.UserRepository;
import com.appointment.security.JwtAuthenticationFilter;
import com.appointment.security.JwtTokenProvider;
import com.appointment.security.TokenBlacklistService;
import com.appointment.security.UserPrincipal;
import com.appointment.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final TokenBlacklistService tokenBlacklistService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Processing registration request for email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new EmailAlreadyExistsException("Email is already registered: " + request.getEmail());
        }

        Role requestedRole = request.getRole() != null ? request.getRole() : Role.CUSTOMER;

        if (requestedRole == Role.ADMIN) {
            throw new BadRequestException("Public registration as ADMIN is not permitted");
        }

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null)
                .role(requestedRole)
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully with ID {} and role {}", savedUser.getId(), savedUser.getRole());

        UserPrincipal principal = UserPrincipal.create(savedUser);
        String token = tokenProvider.generateToken(principal);

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .id(savedUser.getId())
                .fullName(savedUser.getFullName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .message("User registered successfully")
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        log.info("Processing login request for email: {}", email);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String token = tokenProvider.generateToken(userPrincipal);

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .id(userPrincipal.getId())
                .fullName(userPrincipal.getFullName())
                .email(userPrincipal.getEmail())
                .role(userPrincipal.getRole())
                .message("Login successful")
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        return UserResponse.fromEntity(user);
    }

    @Override
    public ApiResponse<Void> logout(String authorizationHeader) {
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String token = authorizationHeader.substring(7);
            Instant expiry = tokenProvider.getExpirationInstant(token);
            tokenBlacklistService.blacklistToken(token, expiry);
            log.info("JWT token blacklisted successfully upon logout");
        }
        SecurityContextHolder.clearContext();
        return ApiResponse.ok("Logout successful");
    }
}
