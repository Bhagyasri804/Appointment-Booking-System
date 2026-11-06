package com.appointment.config;

import com.appointment.entity.Role;
import com.appointment.entity.User;
import com.appointment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(10)
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@appointment.com}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@123}")
    private String adminPassword;

    @Value("${app.admin.name:System Administrator}")
    private String adminName;

    @Value("${app.admin.phone:1234567890}")
    private String adminPhone;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByRole(Role.ADMIN)) {
            log.info("No ADMIN user found in system. Seeding default initial administrator...");

            User admin = User.builder()
                    .fullName(adminName)
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .phoneNumber(adminPhone)
                    .role(Role.ADMIN)
                    .enabled(true)
                    .build();

            userRepository.save(admin);
            log.info("=================================================");
            log.info(" Initial ADMIN account initialized successfully!");
            log.info(" Email: {}", adminEmail);
            log.info(" Role:  {}", Role.ADMIN);
            log.info("=================================================");
        } else {
            log.info("ADMIN account exists. Skipping initial admin seeding.");
        }
    }
}
