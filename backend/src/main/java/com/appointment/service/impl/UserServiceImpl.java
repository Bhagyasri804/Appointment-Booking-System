package com.appointment.service.impl;

import com.appointment.dto.PageResponse;
import com.appointment.dto.UserResponse;
import com.appointment.entity.Role;
import com.appointment.entity.User;
import com.appointment.exception.BadRequestException;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.UserRepository;
import com.appointment.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getUsersByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserResponse.fromEntity(user);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getUsers(
            String search,
            Role role,
            Boolean enabled,
            int page,
            int size,
            String sortBy,
            String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        String searchParam = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        Page<User> pageResult = userRepository.findFiltered(searchParam, role, enabled, pageable);

        return PageResponse.of(pageResult, UserResponse::fromEntity);
    }

    @Override
    @Transactional
    public UserResponse toggleUserStatus(Long id, boolean enabled, String requestingAdminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // Security check: Prevent admin from deactivating their own account
        if (user.getEmail().equalsIgnoreCase(requestingAdminEmail) && !enabled) {
            log.warn("Admin {} attempted to deactivate their own account (ID: {})", requestingAdminEmail, id);
            throw new BadRequestException("Administrators cannot deactivate their own account");
        }

        user.setEnabled(enabled);
        User updated = userRepository.save(user);
        log.info("User ID {} status updated to enabled={} by admin {}", id, enabled, requestingAdminEmail);
        return UserResponse.fromEntity(updated);
    }
}
