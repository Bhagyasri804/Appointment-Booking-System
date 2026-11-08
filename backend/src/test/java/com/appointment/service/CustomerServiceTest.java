package com.appointment.service;

import com.appointment.dto.AppointmentResponse;
import com.appointment.dto.AvailabilityDto;
import com.appointment.dto.BookAppointmentRequest;
import com.appointment.dto.CancelAppointmentRequest;
import com.appointment.dto.CustomerDashboardDto;
import com.appointment.dto.CustomerProfileDto;
import com.appointment.dto.CustomerProviderDto;
import com.appointment.dto.PageResponse;
import com.appointment.dto.RescheduleAppointmentRequest;
import com.appointment.dto.ServiceDto;
import com.appointment.dto.TimeSlotDto;
import com.appointment.dto.UpdateCustomerProfileRequest;
import com.appointment.entity.Appointment;
import com.appointment.entity.AppointmentStatus;
import com.appointment.entity.Notification;
import com.appointment.entity.ProviderAvailability;
import com.appointment.entity.Role;
import com.appointment.entity.ServiceCategory;
import com.appointment.entity.ServiceEntity;
import com.appointment.entity.User;
import com.appointment.exception.BadRequestException;
import com.appointment.exception.ResourceNotFoundException;
import com.appointment.repository.AppointmentRepository;
import com.appointment.repository.NotificationRepository;
import com.appointment.repository.ProviderAvailabilityRepository;
import com.appointment.repository.ServiceEntityRepository;
import com.appointment.repository.UserRepository;
import com.appointment.service.impl.CustomerServiceImpl;
import com.appointment.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CustomerServiceTest {

    private InMemoryUserRepository userRepository;
    private InMemoryAppointmentRepository appointmentRepository;
    private InMemoryServiceEntityRepository serviceRepository;
    private InMemoryProviderAvailabilityRepository availabilityRepository;
    private InMemoryNotificationRepository notificationRepository;

    private NotificationService notificationService;
    private CustomerService customerService;

    private User customer1;
    private User customer2;
    private User provider1;
    private ServiceCategory medicalCategory;
    private ServiceEntity checkupService;

    @BeforeEach
    void setUp() {
        userRepository = new InMemoryUserRepository();
        appointmentRepository = new InMemoryAppointmentRepository();
        serviceRepository = new InMemoryServiceEntityRepository();
        availabilityRepository = new InMemoryProviderAvailabilityRepository();
        notificationRepository = new InMemoryNotificationRepository();

        notificationService = new NotificationServiceImpl(notificationRepository, userRepository);
        customerService = new CustomerServiceImpl(
                appointmentRepository,
                userRepository,
                serviceRepository,
                availabilityRepository,
                notificationService
        );

        customer1 = userRepository.save(User.builder()
                .fullName("Alice Customer")
                .email("alice@test.com")
                .password("encoded_pass")
                .phoneNumber("1234567890")
                .role(Role.CUSTOMER)
                .enabled(true)
                .build());

        customer2 = userRepository.save(User.builder()
                .fullName("Bob Customer")
                .email("bob@test.com")
                .password("encoded_pass")
                .phoneNumber("9876543210")
                .role(Role.CUSTOMER)
                .enabled(true)
                .build());

        provider1 = userRepository.save(User.builder()
                .fullName("Dr. Smith")
                .email("drsmith@test.com")
                .password("encoded_pass")
                .phoneNumber("5551234")
                .specialization("General Physician")
                .description("Expert in general health and preventive care")
                .role(Role.SERVICE_PROVIDER)
                .enabled(true)
                .build());

        medicalCategory = ServiceCategory.builder()
                .id(1L)
                .name("Medical & Health")
                .description("Healthcare services")
                .active(true)
                .build();

        checkupService = serviceRepository.save(ServiceEntity.builder()
                .name("General Health Checkup")
                .description("Complete full-body checkup")
                .category(medicalCategory)
                .durationMinutes(30)
                .price(new BigDecimal("60.00"))
                .active(true)
                .build());
    }

    @Test
    @DisplayName("Customer dashboard statistics accurately aggregate counts and recent bookings")
    void testCustomerDashboardStats() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Upcoming confirmed
        appointmentRepository.save(Appointment.builder()
                .title("Checkup 1")
                .customer(customer1)
                .serviceProvider(provider1)
                .service(checkupService)
                .status(AppointmentStatus.CONFIRMED.name())
                .appointmentTime(now.plusDays(2))
                .build());

        // 2. Pending
        appointmentRepository.save(Appointment.builder()
                .title("Checkup 2")
                .customer(customer1)
                .serviceProvider(provider1)
                .service(checkupService)
                .status(AppointmentStatus.PENDING.name())
                .appointmentTime(now.plusDays(4))
                .build());

        // 3. Completed
        appointmentRepository.save(Appointment.builder()
                .title("Checkup 3")
                .customer(customer1)
                .serviceProvider(provider1)
                .service(checkupService)
                .status(AppointmentStatus.COMPLETED.name())
                .appointmentTime(now.minusDays(5))
                .build());

        // 4. Cancelled
        appointmentRepository.save(Appointment.builder()
                .title("Checkup 4")
                .customer(customer1)
                .serviceProvider(provider1)
                .service(checkupService)
                .status(AppointmentStatus.CANCELLED.name())
                .appointmentTime(now.plusDays(1))
                .build());

        // Another customer's appointment (must not leak)
        appointmentRepository.save(Appointment.builder()
                .title("Bob Checkup")
                .customer(customer2)
                .serviceProvider(provider1)
                .service(checkupService)
                .status(AppointmentStatus.CONFIRMED.name())
                .appointmentTime(now.plusDays(3))
                .build());

        CustomerDashboardDto dashboard = customerService.getCustomerDashboard(customer1.getEmail());
        assertNotNull(dashboard);
        assertEquals(4, dashboard.getTotalAppointments());
        assertEquals(2, dashboard.getUpcomingAppointments()); // confirmed and pending in future
        assertEquals(1, dashboard.getPendingAppointments());
        assertEquals(1, dashboard.getConfirmedAppointments());
        assertEquals(1, dashboard.getCompletedAppointments());
        assertEquals(1, dashboard.getCancelledAppointments());
        assertEquals(4, dashboard.getRecentAppointments().size());
    }

    @Test
    @DisplayName("Browse active services with filtering, search, and sorting")
    void testServiceAndProviderListing() {
        ServiceEntity cheapService = serviceRepository.save(ServiceEntity.builder()
                .name("Blood Test")
                .category(medicalCategory)
                .durationMinutes(15)
                .price(new BigDecimal("25.00"))
                .active(true)
                .build());

        // Inactive service (should not appear)
        serviceRepository.save(ServiceEntity.builder()
                .name("Discontinued Lab")
                .category(medicalCategory)
                .durationMinutes(30)
                .price(new BigDecimal("10.00"))
                .active(false)
                .build());

        List<ServiceDto> servicesAsc = customerService.getServices(null, null, "price", "asc");
        assertEquals(2, servicesAsc.size());
        assertEquals("Blood Test", servicesAsc.get(0).getName());
        assertEquals("General Health Checkup", servicesAsc.get(1).getName());

        List<ServiceDto> filtered = customerService.getServices("Blood", null, "price", "asc");
        assertEquals(1, filtered.size());
        assertEquals("Blood Test", filtered.get(0).getName());

        // Provider listing
        List<CustomerProviderDto> providers = customerService.getProviders(null);
        assertEquals(1, providers.size());
        assertEquals("Dr. Smith", providers.get(0).getFullName());
        assertEquals("General Physician", providers.get(0).getSpecialization());
    }

    @Test
    @DisplayName("Successfully book appointment and generate notifications")
    void testAppointmentCreation() {
        LocalDate date = LocalDate.now().plusDays(2);
        DayOfWeek dow = date.getDayOfWeek();

        // Working hours: 09:00 - 17:00, lunch break: 12:00 - 13:00
        availabilityRepository.save(ProviderAvailability.builder()
                .provider(provider1)
                .dayOfWeek(dow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(17, 0))
                .breakStartTime(LocalTime.of(12, 0))
                .breakEndTime(LocalTime.of(13, 0))
                .active(true)
                .build());

        BookAppointmentRequest request = BookAppointmentRequest.builder()
                .providerId(provider1.getId())
                .serviceId(checkupService.getId())
                .appointmentTime(date.atTime(10, 0))
                .notes("Feeling fatigue lately")
                .build();

        AppointmentResponse response = customerService.bookAppointment(customer1.getEmail(), request);
        assertNotNull(response);
        assertEquals(AppointmentStatus.PENDING.name(), response.getStatus());
        assertEquals("General Health Checkup - Alice Customer", response.getTitle());
        assertEquals("Feeling fatigue lately", response.getDescription());
        assertEquals(customer1.getId(), response.getCustomerId());
        assertEquals(provider1.getId(), response.getProviderId());

        // Check notifications
        List<Notification> customerNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(customer1.getId());
        assertFalse(customerNotifications.isEmpty());
        assertTrue(customerNotifications.get(0).getTitle().contains("Appointment Booked"));

        List<Notification> providerNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(provider1.getId());
        assertFalse(providerNotifications.isEmpty());
        assertTrue(providerNotifications.get(0).getTitle().contains("New Booking Request"));
    }

    @Test
    @DisplayName("Rejects booking in the past, outside working hours, during break, and on off-days")
    void testInvalidAndUnavailableTimeSlots() {
        LocalDate date = LocalDate.now().plusDays(3);
        DayOfWeek dow = date.getDayOfWeek();

        availabilityRepository.save(ProviderAvailability.builder()
                .provider(provider1)
                .dayOfWeek(dow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(17, 0))
                .breakStartTime(LocalTime.of(12, 0))
                .breakEndTime(LocalTime.of(13, 0))
                .active(true)
                .build());

        // 1. Past appointment
        BookAppointmentRequest pastRequest = BookAppointmentRequest.builder()
                .providerId(provider1.getId())
                .serviceId(checkupService.getId())
                .appointmentTime(LocalDateTime.now().minusHours(2))
                .build();
        assertThrows(BadRequestException.class, () -> customerService.bookAppointment(customer1.getEmail(), pastRequest));

        // 2. Outside working hours (early morning 08:00)
        BookAppointmentRequest earlyRequest = BookAppointmentRequest.builder()
                .providerId(provider1.getId())
                .serviceId(checkupService.getId())
                .appointmentTime(date.atTime(8, 0))
                .build();
        assertThrows(BadRequestException.class, () -> customerService.bookAppointment(customer1.getEmail(), earlyRequest));

        // 3. During break time (12:15)
        BookAppointmentRequest breakRequest = BookAppointmentRequest.builder()
                .providerId(provider1.getId())
                .serviceId(checkupService.getId())
                .appointmentTime(date.atTime(12, 15))
                .build();
        assertThrows(BadRequestException.class, () -> customerService.bookAppointment(customer1.getEmail(), breakRequest));

        // 4. Provider does not work on different day
        LocalDate offDay = date.plusDays(1);
        BookAppointmentRequest offDayRequest = BookAppointmentRequest.builder()
                .providerId(provider1.getId())
                .serviceId(checkupService.getId())
                .appointmentTime(offDay.atTime(10, 0))
                .build();
        assertThrows(BadRequestException.class, () -> customerService.bookAppointment(customer1.getEmail(), offDayRequest));
    }

    @Test
    @DisplayName("Prevents double-booking and concurrent booking conflicts")
    void testDoubleBookingPrevention() {
        LocalDate date = LocalDate.now().plusDays(2);
        DayOfWeek dow = date.getDayOfWeek();

        availabilityRepository.save(ProviderAvailability.builder()
                .provider(provider1)
                .dayOfWeek(dow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(17, 0))
                .active(true)
                .build());

        // First customer books 10:00
        BookAppointmentRequest req1 = BookAppointmentRequest.builder()
                .providerId(provider1.getId())
                .serviceId(checkupService.getId())
                .appointmentTime(date.atTime(10, 0))
                .build();
        customerService.bookAppointment(customer1.getEmail(), req1);

        // Second customer tries to book the same slot 10:00
        BookAppointmentRequest req2 = BookAppointmentRequest.builder()
                .providerId(provider1.getId())
                .serviceId(checkupService.getId())
                .appointmentTime(date.atTime(10, 0))
                .build();
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> customerService.bookAppointment(customer2.getEmail(), req2));
        assertTrue(ex.getMessage().contains("already booked"));

        // First customer tries to book another appointment at the exact same time with different provider
        User provider2 = userRepository.save(User.builder()
                .fullName("Dr. Jones")
                .email("drjones@test.com")
                .password("encoded_pass")
                .role(Role.SERVICE_PROVIDER)
                .enabled(true)
                .build());
        availabilityRepository.save(ProviderAvailability.builder()
                .provider(provider2)
                .dayOfWeek(dow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(17, 0))
                .active(true)
                .build());

        BookAppointmentRequest customerDoubleBookingReq = BookAppointmentRequest.builder()
                .providerId(provider2.getId())
                .serviceId(checkupService.getId())
                .appointmentTime(date.atTime(10, 0))
                .build();
        BadRequestException custEx = assertThrows(BadRequestException.class,
                () -> customerService.bookAppointment(customer1.getEmail(), customerDoubleBookingReq));
        assertTrue(custEx.getMessage().contains("already have an appointment"));
    }

    @Test
    @DisplayName("Concurrent booking attempts for identical slot allow only one success")
    void testConcurrentBookingAttempts() throws InterruptedException {
        LocalDate date = LocalDate.now().plusDays(5);
        DayOfWeek dow = date.getDayOfWeek();

        availabilityRepository.save(ProviderAvailability.builder()
                .provider(provider1)
                .dayOfWeek(dow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(17, 0))
                .active(true)
                .build());

        int threads = 4;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(threads);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        for (int i = 0; i < threads; i++) {
            final String email = (i % 2 == 0) ? customer1.getEmail() : customer2.getEmail();
            executor.submit(() -> {
                try {
                    BookAppointmentRequest req = BookAppointmentRequest.builder()
                            .providerId(provider1.getId())
                            .serviceId(checkupService.getId())
                            .appointmentTime(date.atTime(14, 0))
                            .build();
                    customerService.bookAppointment(email, req);
                    successCount.incrementAndGet();
                } catch (BadRequestException e) {
                    failureCount.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executor.shutdown();

        assertEquals(1, successCount.get(), "Exactly one concurrent booking must succeed");
        assertEquals(threads - 1, failureCount.get(), "Conflicting bookings must be rejected");
    }

    @Test
    @DisplayName("Cancellation and rescheduling follow business rules and notifications")
    void testCancellationAndRescheduling() {
        LocalDate date = LocalDate.now().plusDays(3);
        DayOfWeek dow = date.getDayOfWeek();

        availabilityRepository.save(ProviderAvailability.builder()
                .provider(provider1)
                .dayOfWeek(dow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(17, 0))
                .active(true)
                .build());

        Appointment appt = appointmentRepository.save(Appointment.builder()
                .title("Annual Checkup")
                .customer(customer1)
                .serviceProvider(provider1)
                .service(checkupService)
                .status(AppointmentStatus.CONFIRMED.name())
                .appointmentTime(date.atTime(10, 0))
                .build());

        // Reschedule to 11:00
        RescheduleAppointmentRequest reschedReq = RescheduleAppointmentRequest.builder()
                .newAppointmentTime(date.atTime(11, 0))
                .reason("Schedule conflict at work")
                .build();

        AppointmentResponse rescheduled = customerService.rescheduleAppointment(customer1.getEmail(), appt.getId(), reschedReq);
        assertEquals(date.atTime(11, 0), rescheduled.getAppointmentTime());
        assertEquals(AppointmentStatus.PENDING.name(), rescheduled.getStatus());

        // Cancel
        CancelAppointmentRequest cancelReq = CancelAppointmentRequest.builder()
                .reason("Need to travel urgently")
                .build();
        AppointmentResponse cancelled = customerService.cancelAppointment(customer1.getEmail(), appt.getId(), cancelReq);
        assertEquals(AppointmentStatus.CANCELLED.name(), cancelled.getStatus());
        assertEquals("Need to travel urgently", cancelled.getCancellationReason());

        // Attempting to cancel already cancelled appointment throws exception
        assertThrows(BadRequestException.class, () -> customerService.cancelAppointment(customer1.getEmail(), appt.getId(), cancelReq));
    }

    @Test
    @DisplayName("Strict customer data isolation prevents access to other users' data")
    void testCustomerDataIsolation() {
        Appointment bobAppt = appointmentRepository.save(Appointment.builder()
                .title("Bob Private Consult")
                .customer(customer2)
                .serviceProvider(provider1)
                .service(checkupService)
                .status(AppointmentStatus.CONFIRMED.name())
                .appointmentTime(LocalDateTime.now().plusDays(2))
                .build());

        // Alice attempts to view Bob's appointment
        assertThrows(BadRequestException.class,
                () -> customerService.getAppointmentById(customer1.getEmail(), bobAppt.getId()));

        // Alice attempts to cancel Bob's appointment
        CancelAppointmentRequest cancelReq = CancelAppointmentRequest.builder()
                .reason("Malicious cancellation")
                .build();
        assertThrows(BadRequestException.class,
                () -> customerService.cancelAppointment(customer1.getEmail(), bobAppt.getId(), cancelReq));

        // Alice attempts to reschedule Bob's appointment
        RescheduleAppointmentRequest reschedReq = RescheduleAppointmentRequest.builder()
                .newAppointmentTime(LocalDateTime.now().plusDays(4))
                .build();
        assertThrows(BadRequestException.class,
                () -> customerService.rescheduleAppointment(customer1.getEmail(), bobAppt.getId(), reschedReq));
    }

    @Test
    @DisplayName("Customer profile update updates full name, phone number, and description")
    void testProfileManagement() {
        CustomerProfileDto profile = customerService.getCustomerProfile(customer1.getEmail());
        assertNotNull(profile);
        assertEquals("Alice Customer", profile.getFullName());
        assertEquals("alice@test.com", profile.getEmail());

        UpdateCustomerProfileRequest updateReq = UpdateCustomerProfileRequest.builder()
                .fullName("Alice M. Customer")
                .phoneNumber("+1-555-9999")
                .description("Preferred contact via SMS")
                .build();

        CustomerProfileDto updated = customerService.updateCustomerProfile(customer1.getEmail(), updateReq);
        assertEquals("Alice M. Customer", updated.getFullName());
        assertEquals("+1-555-9999", updated.getPhoneNumber());
        assertEquals("Preferred contact via SMS", updated.getDescription());
        assertEquals("alice@test.com", updated.getEmail()); // Email preserved
    }

    // --- In-Memory Repository Implementations for Tests ---

    static class InMemoryUserRepository implements UserRepository {
        private final Map<Long, User> data = new HashMap<>();
        private final AtomicLong gen = new AtomicLong(1);

        @Override public <S extends User> S save(S entity) {
            if (entity.getId() == null) entity.setId(gen.getAndIncrement());
            data.put(entity.getId(), entity);
            return entity;
        }
        @Override public Optional<User> findById(Long id) { return Optional.ofNullable(data.get(id)); }
        @Override public Optional<User> findByEmail(String email) {
            return data.values().stream().filter(u -> u.getEmail().equalsIgnoreCase(email)).findFirst();
        }
        @Override public boolean existsByEmail(String email) { return findByEmail(email).isPresent(); }
        @Override public List<User> findByRole(Role role) {
            return data.values().stream().filter(u -> u.getRole() == role).collect(Collectors.toList());
        }
        @Override public List<User> findByRoleAndEnabledTrue(Role role) {
            return data.values().stream().filter(u -> u.getRole() == role && u.isEnabled()).collect(Collectors.toList());
        }
        @Override public List<User> searchProviders(String search) {
            String lower = search.toLowerCase();
            return data.values().stream()
                    .filter(u -> u.getRole() == Role.SERVICE_PROVIDER && u.isEnabled())
                    .filter(u -> (u.getFullName() != null && u.getFullName().toLowerCase().contains(lower)) ||
                                 (u.getSpecialization() != null && u.getSpecialization().toLowerCase().contains(lower)))
                    .collect(Collectors.toList());
        }
        @Override public long count() { return data.size(); }
        @Override public boolean existsByRole(Role role) { return data.values().stream().anyMatch(u -> u.getRole() == role); }
        @Override public long countByRole(Role role) { return data.values().stream().filter(u -> u.getRole() == role).count(); }
        @Override public long countByEnabled(boolean enabled) { return data.values().stream().filter(u -> u.isEnabled() == enabled).count(); }
        @Override public Page<User> findFiltered(String search, Role role, Boolean enabled, Pageable pageable) { return new PageImpl<>(new ArrayList<>(data.values())); }
        @Override public boolean existsById(Long id) { return data.containsKey(id); }
        @Override public List<User> findAll() { return new ArrayList<>(data.values()); }
        @Override public List<User> findAllById(Iterable<Long> ids) { return null; }
        @Override public void deleteById(Long id) { data.remove(id); }
        @Override public void delete(User entity) { data.remove(entity.getId()); }
        @Override public void deleteAllById(Iterable<? extends Long> ids) {}
        @Override public void deleteAll(Iterable<? extends User> entities) {}
        @Override public void deleteAll() { data.clear(); }
        @Override public <S extends User> List<S> saveAll(Iterable<S> entities) { return null; }
        @Override public void flush() {}
        @Override public <S extends User> S saveAndFlush(S entity) { return save(entity); }
        @Override public <S extends User> List<S> saveAllAndFlush(Iterable<S> entities) { return null; }
        @Override public void deleteAllInBatch(Iterable<User> entities) {}
        @Override public void deleteAllByIdInBatch(Iterable<Long> ids) {}
        @Override public void deleteAllInBatch() {}
        @Override public User getOne(Long id) { return data.get(id); }
        @Override public User getById(Long id) { return data.get(id); }
        @Override public User getReferenceById(Long id) { return data.get(id); }
        @Override public <S extends User> Optional<S> findOne(org.springframework.data.domain.Example<S> example) { return Optional.empty(); }
        @Override public <S extends User> List<S> findAll(org.springframework.data.domain.Example<S> example) { return null; }
        @Override public <S extends User> List<S> findAll(org.springframework.data.domain.Example<S> example, Sort sort) { return null; }
        @Override public <S extends User> Page<S> findAll(org.springframework.data.domain.Example<S> example, Pageable pageable) { return null; }
        @Override public <S extends User> long count(org.springframework.data.domain.Example<S> example) { return 0; }
        @Override public <S extends User> boolean exists(org.springframework.data.domain.Example<S> example) { return false; }
        @Override public <S extends User, R> R findBy(org.springframework.data.domain.Example<S> example, java.util.function.Function<org.springframework.data.repository.query.FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { return null; }
        @Override public List<User> findAll(Sort sort) { return new ArrayList<>(data.values()); }
        @Override public Page<User> findAll(Pageable pageable) { return new PageImpl<>(new ArrayList<>(data.values())); }
    }

    static class InMemoryAppointmentRepository implements AppointmentRepository {
        private final Map<Long, Appointment> data = new HashMap<>();
        private final AtomicLong gen = new AtomicLong(1);

        @Override public <S extends Appointment> S save(S entity) {
            if (entity.getId() == null) entity.setId(gen.getAndIncrement());
            data.put(entity.getId(), entity);
            return entity;
        }
        @Override public Optional<Appointment> findById(Long id) { return Optional.ofNullable(data.get(id)); }
        @Override public List<Appointment> findByCustomerId(Long customerId) {
            return data.values().stream().filter(a -> a.getCustomer() != null && a.getCustomer().getId().equals(customerId)).collect(Collectors.toList());
        }
        @Override public long countByCustomerId(Long customerId) {
            return data.values().stream().filter(a -> a.getCustomer() != null && a.getCustomer().getId().equals(customerId)).count();
        }
        @Override public long countByCustomerIdAndStatus(Long customerId, String status) {
            return data.values().stream()
                    .filter(a -> a.getCustomer() != null && a.getCustomer().getId().equals(customerId))
                    .filter(a -> a.getStatus().equalsIgnoreCase(status))
                    .count();
        }
        @Override public long countUpcomingAppointments(Long customerId, LocalDateTime now) {
            return data.values().stream()
                    .filter(a -> a.getCustomer() != null && a.getCustomer().getId().equals(customerId))
                    .filter(a -> !a.getStatus().equalsIgnoreCase(AppointmentStatus.CANCELLED.name()))
                    .filter(a -> !a.getAppointmentTime().isBefore(now))
                    .count();
        }
        @Override public List<Appointment> findTop5ByCustomerIdOrderByAppointmentTimeDesc(Long customerId) {
            return data.values().stream()
                    .filter(a -> a.getCustomer() != null && a.getCustomer().getId().equals(customerId))
                    .sorted(Comparator.comparing(Appointment::getAppointmentTime).reversed())
                    .limit(5)
                    .collect(Collectors.toList());
        }
        @Override public List<Appointment> findByCustomerIdAndAppointmentTimeBetween(Long customerId, LocalDateTime start, LocalDateTime end) {
            return data.values().stream()
                    .filter(a -> a.getCustomer() != null && a.getCustomer().getId().equals(customerId))
                    .filter(a -> !a.getAppointmentTime().isBefore(start) && !a.getAppointmentTime().isAfter(end))
                    .collect(Collectors.toList());
        }
        @Override public List<Appointment> findByServiceProviderIdAndAppointmentTimeBetween(Long serviceProviderId, LocalDateTime start, LocalDateTime end) {
            return data.values().stream()
                    .filter(a -> a.getServiceProvider() != null && a.getServiceProvider().getId().equals(serviceProviderId))
                    .filter(a -> !a.getAppointmentTime().isBefore(start) && !a.getAppointmentTime().isAfter(end))
                    .collect(Collectors.toList());
        }
        @Override public Page<Appointment> findCustomerFiltered(Long customerId, String search, String status, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
            List<Appointment> list = data.values().stream()
                    .filter(a -> a.getCustomer() != null && a.getCustomer().getId().equals(customerId))
                    .filter(a -> status == null || a.getStatus().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
            return new PageImpl<>(list, pageable, list.size());
        }
        @Override public Page<Appointment> findCustomerHistory(Long customerId, LocalDateTime now, String search, String status, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
            List<Appointment> list = data.values().stream()
                    .filter(a -> a.getCustomer() != null && a.getCustomer().getId().equals(customerId))
                    .filter(a -> a.getStatus().equalsIgnoreCase(AppointmentStatus.COMPLETED.name()) ||
                                 a.getStatus().equalsIgnoreCase(AppointmentStatus.CANCELLED.name()) ||
                                 a.getAppointmentTime().isBefore(now))
                    .collect(Collectors.toList());
            return new PageImpl<>(list, pageable, list.size());
        }
        @Override public List<Appointment> findByStatus(String status) { return null; }
        @Override public long countByStatus(String status) { return 0; }
        @Override public List<Appointment> findByServiceProviderId(Long serviceProviderId) { return null; }
        @Override public long countByServiceProviderId(Long serviceProviderId) { return 0; }
        @Override public long countByServiceProviderIdAndStatus(Long serviceProviderId, String status) { return 0; }
        @Override public Page<Appointment> findFiltered(String search, String status, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) { return null; }
        @Override public Page<Appointment> findProviderFiltered(Long providerId, String search, String status, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) { return null; }
        @Override public long countTodayAppointments(Long providerId, LocalDateTime startOfDay, LocalDateTime endOfDay) { return 0; }
        @Override public BigDecimal calculateTotalEarnings(Long providerId) { return BigDecimal.ZERO; }
        @Override public BigDecimal calculateMonthlyEarnings(Long providerId, LocalDateTime startOfMonth, LocalDateTime endOfMonth) { return BigDecimal.ZERO; }
        @Override public List<Object[]> countAppointmentsByStatusGroup() { return null; }
        @Override public List<Object[]> findServicePopularity() { return null; }
        @Override public void flush() {}
        @Override public <S extends Appointment> S saveAndFlush(S entity) { return save(entity); }
        @Override public <S extends Appointment> List<S> saveAllAndFlush(Iterable<S> entities) { return null; }
        @Override public void deleteAllInBatch(Iterable<Appointment> entities) {}
        @Override public void deleteAllByIdInBatch(Iterable<Long> ids) {}
        @Override public void deleteAllInBatch() {}
        @Override public Appointment getOne(Long id) { return null; }
        @Override public Appointment getById(Long id) { return null; }
        @Override public Appointment getReferenceById(Long id) { return null; }
        @Override public <S extends Appointment> Optional<S> findOne(org.springframework.data.domain.Example<S> example) { return Optional.empty(); }
        @Override public <S extends Appointment> List<S> findAll(org.springframework.data.domain.Example<S> example) { return null; }
        @Override public <S extends Appointment> List<S> findAll(org.springframework.data.domain.Example<S> example, Sort sort) { return null; }
        @Override public <S extends Appointment> Page<S> findAll(org.springframework.data.domain.Example<S> example, Pageable pageable) { return null; }
        @Override public <S extends Appointment> long count(org.springframework.data.domain.Example<S> example) { return 0; }
        @Override public <S extends Appointment> boolean exists(org.springframework.data.domain.Example<S> example) { return false; }
        @Override public <S extends Appointment, R> R findBy(org.springframework.data.domain.Example<S> example, java.util.function.Function<org.springframework.data.repository.query.FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { return null; }
        @Override public <S extends Appointment> List<S> saveAll(Iterable<S> entities) { return null; }
        @Override public boolean existsById(Long id) { return data.containsKey(id); }
        @Override public List<Appointment> findAll() { return new ArrayList<>(data.values()); }
        @Override public List<Appointment> findAllById(Iterable<Long> ids) { return null; }
        @Override public long count() { return data.size(); }
        @Override public void deleteById(Long id) { data.remove(id); }
        @Override public void delete(Appointment entity) { data.remove(entity.getId()); }
        @Override public void deleteAllById(Iterable<? extends Long> ids) {}
        @Override public void deleteAll(Iterable<? extends Appointment> entities) {}
        @Override public void deleteAll() { data.clear(); }
        @Override public List<Appointment> findAll(Sort sort) { return null; }
        @Override public Page<Appointment> findAll(Pageable pageable) { return null; }
    }

    static class InMemoryServiceEntityRepository implements ServiceEntityRepository {
        private final Map<Long, ServiceEntity> data = new HashMap<>();
        private final AtomicLong gen = new AtomicLong(1);

        @Override public <S extends ServiceEntity> S save(S entity) {
            if (entity.getId() == null) entity.setId(gen.getAndIncrement());
            data.put(entity.getId(), entity);
            return entity;
        }
        @Override public Optional<ServiceEntity> findById(Long id) { return Optional.ofNullable(data.get(id)); }
        @Override public List<ServiceEntity> findCustomerServices(String search, Long categoryId, Sort sort) {
            return data.values().stream()
                    .filter(ServiceEntity::isActive)
                    .filter(s -> search == null || s.getName().toLowerCase().contains(search.toLowerCase()))
                    .filter(s -> categoryId == null || (s.getCategory() != null && s.getCategory().getId().equals(categoryId)))
                    .sorted((s1, s2) -> {
                        if (sort != null && sort.getOrderFor("price") != null) {
                            int cmp = s1.getPrice().compareTo(s2.getPrice());
                            return sort.getOrderFor("price").isDescending() ? -cmp : cmp;
                        }
                        return s1.getName().compareToIgnoreCase(s2.getName());
                    })
                    .collect(Collectors.toList());
        }
        @Override public List<ServiceEntity> findByActiveTrue() {
            return data.values().stream().filter(ServiceEntity::isActive).collect(Collectors.toList());
        }
        @Override public List<ServiceEntity> findByCategoryId(Long categoryId) { return null; }
        @Override public long countByActiveTrue() { return data.values().stream().filter(ServiceEntity::isActive).count(); }
        @Override public Page<ServiceEntity> findFiltered(String search, Long categoryId, Boolean active, Pageable pageable) { return null; }
        @Override public void flush() {}
        @Override public <S extends ServiceEntity> S saveAndFlush(S entity) { return save(entity); }
        @Override public <S extends ServiceEntity> List<S> saveAllAndFlush(Iterable<S> entities) { return null; }
        @Override public void deleteAllInBatch(Iterable<ServiceEntity> entities) {}
        @Override public void deleteAllByIdInBatch(Iterable<Long> ids) {}
        @Override public void deleteAllInBatch() {}
        @Override public ServiceEntity getOne(Long id) { return null; }
        @Override public ServiceEntity getById(Long id) { return null; }
        @Override public ServiceEntity getReferenceById(Long id) { return null; }
        @Override public <S extends ServiceEntity> Optional<S> findOne(org.springframework.data.domain.Example<S> example) { return Optional.empty(); }
        @Override public <S extends ServiceEntity> List<S> findAll(org.springframework.data.domain.Example<S> example) { return null; }
        @Override public <S extends ServiceEntity> List<S> findAll(org.springframework.data.domain.Example<S> example, Sort sort) { return null; }
        @Override public <S extends ServiceEntity> Page<S> findAll(org.springframework.data.domain.Example<S> example, Pageable pageable) { return null; }
        @Override public <S extends ServiceEntity> long count(org.springframework.data.domain.Example<S> example) { return 0; }
        @Override public <S extends ServiceEntity> boolean exists(org.springframework.data.domain.Example<S> example) { return false; }
        @Override public <S extends ServiceEntity, R> R findBy(org.springframework.data.domain.Example<S> example, java.util.function.Function<org.springframework.data.repository.query.FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { return null; }
        @Override public <S extends ServiceEntity> List<S> saveAll(Iterable<S> entities) { return null; }
        @Override public boolean existsById(Long id) { return data.containsKey(id); }
        @Override public List<ServiceEntity> findAll() { return new ArrayList<>(data.values()); }
        @Override public List<ServiceEntity> findAllById(Iterable<Long> ids) { return null; }
        @Override public long count() { return data.size(); }
        @Override public void deleteById(Long id) { data.remove(id); }
        @Override public void delete(ServiceEntity entity) { data.remove(entity.getId()); }
        @Override public void deleteAllById(Iterable<? extends Long> ids) {}
        @Override public void deleteAll(Iterable<? extends ServiceEntity> entities) {}
        @Override public void deleteAll() { data.clear(); }
        @Override public List<ServiceEntity> findAll(Sort sort) { return null; }
        @Override public Page<ServiceEntity> findAll(Pageable pageable) { return null; }
    }

    static class InMemoryProviderAvailabilityRepository implements ProviderAvailabilityRepository {
        private final Map<Long, ProviderAvailability> data = new HashMap<>();
        private final AtomicLong gen = new AtomicLong(1);

        @Override public <S extends ProviderAvailability> S save(S entity) {
            if (entity.getId() == null) entity.setId(gen.getAndIncrement());
            data.put(entity.getId(), entity);
            return entity;
        }
        @Override public Optional<ProviderAvailability> findById(Long id) { return Optional.ofNullable(data.get(id)); }
        @Override public List<ProviderAvailability> findByProviderIdAndDayOfWeekAndActiveTrue(Long providerId, DayOfWeek dayOfWeek) {
            return data.values().stream()
                    .filter(a -> a.getProvider() != null && a.getProvider().getId().equals(providerId))
                    .filter(a -> a.getDayOfWeek() == dayOfWeek && a.isActive())
                    .collect(Collectors.toList());
        }
        @Override public List<ProviderAvailability> findByProviderIdAndActiveTrue(Long providerId) {
            return data.values().stream()
                    .filter(a -> a.getProvider() != null && a.getProvider().getId().equals(providerId) && a.isActive())
                    .collect(Collectors.toList());
        }
        @Override public List<ProviderAvailability> findByProviderIdOrderByDayOfWeekAscStartTimeAsc(Long providerId) {
            return data.values().stream()
                    .filter(a -> a.getProvider() != null && a.getProvider().getId().equals(providerId))
                    .sorted(Comparator.comparing(ProviderAvailability::getDayOfWeek).thenComparing(ProviderAvailability::getStartTime))
                    .collect(Collectors.toList());
        }
        @Override public List<ProviderAvailability> findByProviderId(Long providerId) { return null; }
        @Override public List<ProviderAvailability> findByProviderIdAndDayOfWeek(Long providerId, DayOfWeek dayOfWeek) { return null; }
        @Override public boolean existsByProviderId(Long providerId) { return false; }
        @Override public void flush() {}
        @Override public <S extends ProviderAvailability> S saveAndFlush(S entity) { return save(entity); }
        @Override public <S extends ProviderAvailability> List<S> saveAllAndFlush(Iterable<S> entities) { return null; }
        @Override public void deleteAllInBatch(Iterable<ProviderAvailability> entities) {}
        @Override public void deleteAllByIdInBatch(Iterable<Long> ids) {}
        @Override public void deleteAllInBatch() {}
        @Override public ProviderAvailability getOne(Long id) { return null; }
        @Override public ProviderAvailability getById(Long id) { return null; }
        @Override public ProviderAvailability getReferenceById(Long id) { return null; }
        @Override public <S extends ProviderAvailability> Optional<S> findOne(org.springframework.data.domain.Example<S> example) { return Optional.empty(); }
        @Override public <S extends ProviderAvailability> List<S> findAll(org.springframework.data.domain.Example<S> example) { return null; }
        @Override public <S extends ProviderAvailability> List<S> findAll(org.springframework.data.domain.Example<S> example, Sort sort) { return null; }
        @Override public <S extends ProviderAvailability> Page<S> findAll(org.springframework.data.domain.Example<S> example, Pageable pageable) { return null; }
        @Override public <S extends ProviderAvailability> long count(org.springframework.data.domain.Example<S> example) { return 0; }
        @Override public <S extends ProviderAvailability> boolean exists(org.springframework.data.domain.Example<S> example) { return false; }
        @Override public <S extends ProviderAvailability, R> R findBy(org.springframework.data.domain.Example<S> example, java.util.function.Function<org.springframework.data.repository.query.FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { return null; }
        @Override public <S extends ProviderAvailability> List<S> saveAll(Iterable<S> entities) { return null; }
        @Override public boolean existsById(Long id) { return data.containsKey(id); }
        @Override public List<ProviderAvailability> findAll() { return new ArrayList<>(data.values()); }
        @Override public List<ProviderAvailability> findAllById(Iterable<Long> ids) { return null; }
        @Override public long count() { return data.size(); }
        @Override public void deleteById(Long id) { data.remove(id); }
        @Override public void delete(ProviderAvailability entity) { data.remove(entity.getId()); }
        @Override public void deleteAllById(Iterable<? extends Long> ids) {}
        @Override public void deleteAll(Iterable<? extends ProviderAvailability> entities) {}
        @Override public void deleteAll() { data.clear(); }
        @Override public List<ProviderAvailability> findAll(Sort sort) { return null; }
        @Override public Page<ProviderAvailability> findAll(Pageable pageable) { return null; }
    }

    static class InMemoryNotificationRepository implements NotificationRepository {
        private final Map<Long, Notification> data = new HashMap<>();
        private final AtomicLong gen = new AtomicLong(1);

        @Override public <S extends Notification> S save(S entity) {
            if (entity.getId() == null) entity.setId(gen.getAndIncrement());
            data.put(entity.getId(), entity);
            return entity;
        }
        @Override public Optional<Notification> findById(Long id) { return Optional.ofNullable(data.get(id)); }
        @Override public List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId) {
            return data.values().stream().filter(n -> n.getUser() != null && n.getUser().getId().equals(userId)).collect(Collectors.toList());
        }
        @Override public List<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(Long userId) {
            return data.values().stream().filter(n -> n.getUser() != null && n.getUser().getId().equals(userId) && !n.isRead()).collect(Collectors.toList());
        }
        @Override public long countByUserIdAndReadFalse(Long userId) {
            return data.values().stream().filter(n -> n.getUser() != null && n.getUser().getId().equals(userId) && !n.isRead()).count();
        }
        @Override public <S extends Notification> List<S> saveAll(Iterable<S> entities) {
            List<S> list = new ArrayList<>();
            for (S e : entities) list.add(save(e));
            return list;
        }
        @Override public void flush() {}
        @Override public <S extends Notification> S saveAndFlush(S entity) { return save(entity); }
        @Override public <S extends Notification> List<S> saveAllAndFlush(Iterable<S> entities) { return null; }
        @Override public void deleteAllInBatch(Iterable<Notification> entities) {}
        @Override public void deleteAllByIdInBatch(Iterable<Long> ids) {}
        @Override public void deleteAllInBatch() {}
        @Override public Notification getOne(Long id) { return null; }
        @Override public Notification getById(Long id) { return null; }
        @Override public Notification getReferenceById(Long id) { return null; }
        @Override public <S extends Notification> Optional<S> findOne(org.springframework.data.domain.Example<S> example) { return Optional.empty(); }
        @Override public <S extends Notification> List<S> findAll(org.springframework.data.domain.Example<S> example) { return null; }
        @Override public <S extends Notification> List<S> findAll(org.springframework.data.domain.Example<S> example, Sort sort) { return null; }
        @Override public <S extends Notification> Page<S> findAll(org.springframework.data.domain.Example<S> example, Pageable pageable) { return null; }
        @Override public <S extends Notification> long count(org.springframework.data.domain.Example<S> example) { return 0; }
        @Override public <S extends Notification> boolean exists(org.springframework.data.domain.Example<S> example) { return false; }
        @Override public <S extends Notification, R> R findBy(org.springframework.data.domain.Example<S> example, java.util.function.Function<org.springframework.data.repository.query.FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { return null; }
        @Override public boolean existsById(Long id) { return data.containsKey(id); }
        @Override public List<Notification> findAll() { return new ArrayList<>(data.values()); }
        @Override public List<Notification> findAllById(Iterable<Long> ids) { return null; }
        @Override public long count() { return data.size(); }
        @Override public void deleteById(Long id) { data.remove(id); }
        @Override public void delete(Notification entity) { data.remove(entity.getId()); }
        @Override public void deleteAllById(Iterable<? extends Long> ids) {}
        @Override public void deleteAll(Iterable<? extends Notification> entities) {}
        @Override public void deleteAll() { data.clear(); }
        @Override public List<Notification> findAll(Sort sort) { return null; }
        @Override public Page<Notification> findAll(Pageable pageable) { return null; }
    }
}
