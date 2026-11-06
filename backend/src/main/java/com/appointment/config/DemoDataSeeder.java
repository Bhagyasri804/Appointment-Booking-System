package com.appointment.config;

import com.appointment.entity.Appointment;
import com.appointment.entity.AppointmentStatus;
import com.appointment.entity.Role;
import com.appointment.entity.ServiceCategory;
import com.appointment.entity.ServiceEntity;
import com.appointment.entity.User;
import com.appointment.repository.AppointmentRepository;
import com.appointment.repository.ServiceCategoryRepository;
import com.appointment.repository.ServiceEntityRepository;
import com.appointment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Component
@Order(20)
@RequiredArgsConstructor
public class DemoDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ServiceCategoryRepository serviceCategoryRepository;
    private final ServiceEntityRepository serviceEntityRepository;
    private final AppointmentRepository appointmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedCategoriesAndServices();
        seedDemoUsersAndAppointments();
    }

    private void seedCategoriesAndServices() {
        if (serviceCategoryRepository.count() == 0) {
            log.info("Seeding initial service categories and services...");

            ServiceCategory medical = serviceCategoryRepository.save(ServiceCategory.builder()
                    .name("Medical & Health")
                    .description("General healthcare, medical checkups, and diagnostic consultations")
                    .active(true)
                    .build());

            ServiceCategory dental = serviceCategoryRepository.save(ServiceCategory.builder()
                    .name("Dental Care")
                    .description("Dentistry, teeth whitening, orthodontics, and oral hygiene")
                    .active(true)
                    .build());

            ServiceCategory wellness = serviceCategoryRepository.save(ServiceCategory.builder()
                    .name("Wellness & Therapy")
                    .description("Physical therapy, massage, rehabilitation, and mental health")
                    .active(true)
                    .build());

            ServiceCategory consulting = serviceCategoryRepository.save(ServiceCategory.builder()
                    .name("Professional Consulting")
                    .description("One-on-one expert consultations, legal, and financial planning")
                    .active(true)
                    .build());

            serviceEntityRepository.save(ServiceEntity.builder()
                    .name("General Health Checkup")
                    .description("Comprehensive medical exam covering vitals, blood pressure, and basic labs")
                    .category(medical)
                    .durationMinutes(30)
                    .price(new BigDecimal("60.00"))
                    .active(true)
                    .build());

            serviceEntityRepository.save(ServiceEntity.builder()
                    .name("Cardiology Consultation")
                    .description("In-depth evaluation of heart health, ECG analysis, and lifestyle guidance")
                    .category(medical)
                    .durationMinutes(45)
                    .price(new BigDecimal("150.00"))
                    .active(true)
                    .build());

            serviceEntityRepository.save(ServiceEntity.builder()
                    .name("Teeth Cleaning & Whitening")
                    .description("Professional ultrasonic tartar removal, polishing, and enamel whitening")
                    .category(dental)
                    .durationMinutes(45)
                    .price(new BigDecimal("120.00"))
                    .active(true)
                    .build());

            serviceEntityRepository.save(ServiceEntity.builder()
                    .name("Physiotherapy Session")
                    .description("Targeted musculoskeletal rehabilitation and mobility enhancement")
                    .category(wellness)
                    .durationMinutes(60)
                    .price(new BigDecimal("90.00"))
                    .active(true)
                    .build());

            serviceEntityRepository.save(ServiceEntity.builder()
                    .name("Executive Strategy Session")
                    .description("Advisory consultation for professional scheduling and strategic development")
                    .category(consulting)
                    .durationMinutes(60)
                    .price(new BigDecimal("200.00"))
                    .active(true)
                    .build());

            log.info("Initial service categories and services seeded successfully!");
        }
    }

    private void seedDemoUsersAndAppointments() {
        if (!userRepository.existsByEmail("customer@appointment.com")) {
            userRepository.save(User.builder()
                    .fullName("Alice Customer")
                    .email("customer@appointment.com")
                    .password(passwordEncoder.encode("Customer@123"))
                    .phoneNumber("9876543210")
                    .role(Role.CUSTOMER)
                    .enabled(true)
                    .build());
        }

        if (!userRepository.existsByEmail("provider@appointment.com")) {
            userRepository.save(User.builder()
                    .fullName("Dr. Robert Provider")
                    .email("provider@appointment.com")
                    .password(passwordEncoder.encode("Provider@123"))
                    .phoneNumber("5551234567")
                    .role(Role.SERVICE_PROVIDER)
                    .enabled(true)
                    .build());
        }

        if (appointmentRepository.count() == 0) {
            log.info("Seeding demonstration appointments for dashboard analytics...");
            User customer = userRepository.findByEmail("customer@appointment.com").orElse(null);
            User provider = userRepository.findByEmail("provider@appointment.com").orElse(null);
            ServiceEntity checkup = serviceEntityRepository.findAll().stream().findFirst().orElse(null);

            if (customer != null && provider != null && checkup != null) {
                LocalDateTime now = LocalDateTime.now();

                // 1. Confirmed upcoming appointment
                appointmentRepository.save(Appointment.builder()
                        .title("Annual Health Checkup - Alice")
                        .description("Regular yearly medical follow-up")
                        .appointmentTime(now.plusDays(2).withHour(10).withMinute(0))
                        .status(AppointmentStatus.CONFIRMED.name())
                        .customer(customer)
                        .serviceProvider(provider)
                        .service(checkup)
                        .build());

                // 2. Pending appointment
                appointmentRepository.save(Appointment.builder()
                        .title("Cardiology Consultation - Alice")
                        .description("Follow-up on previous lab results")
                        .appointmentTime(now.plusDays(4).withHour(14).withMinute(30))
                        .status(AppointmentStatus.PENDING.name())
                        .customer(customer)
                        .serviceProvider(provider)
                        .service(checkup)
                        .build());

                // 3. Completed appointment
                appointmentRepository.save(Appointment.builder()
                        .title("Teeth Cleaning & Whitening - Alice")
                        .description("Routine dental scaling and cleaning completed")
                        .appointmentTime(now.minusDays(5).withHour(11).withMinute(0))
                        .status(AppointmentStatus.COMPLETED.name())
                        .customer(customer)
                        .serviceProvider(provider)
                        .service(checkup)
                        .build());

                // 4. Cancelled appointment
                appointmentRepository.save(Appointment.builder()
                        .title("Physiotherapy Assessment - Alice")
                        .description("Patient requested reschedule")
                        .appointmentTime(now.minusDays(10).withHour(16).withMinute(0))
                        .status(AppointmentStatus.CANCELLED.name())
                        .cancellationReason("Patient had emergency travel conflict")
                        .customer(customer)
                        .serviceProvider(provider)
                        .service(checkup)
                        .build());

                log.info("Demonstration appointments seeded successfully!");
            }
        }
    }
}
