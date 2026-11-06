package com.appointment.service;

import com.appointment.dto.AvailabilityDto;
import com.appointment.dto.AvailabilityRequest;
import com.appointment.dto.CalendarDayDto;
import com.appointment.dto.NotificationDto;
import com.appointment.dto.ProviderOverviewDto;
import com.appointment.dto.ProviderProfileDto;
import com.appointment.dto.TimeSlotDto;
import com.appointment.dto.UpdateProviderProfileRequest;
import com.appointment.entity.Appointment;
import com.appointment.entity.AppointmentStatus;
import com.appointment.entity.Notification;
import com.appointment.entity.ProviderAvailability;
import com.appointment.entity.Role;
import com.appointment.entity.ServiceCategory;
import com.appointment.entity.ServiceEntity;
import com.appointment.entity.User;
import com.appointment.exception.BadRequestException;
import com.appointment.repository.AppointmentRepository;
import com.appointment.repository.NotificationRepository;
import com.appointment.repository.ProviderAvailabilityRepository;
import com.appointment.repository.UserRepository;
import com.appointment.service.impl.NotificationServiceImpl;
import com.appointment.service.impl.ProviderAppointmentServiceImpl;
import com.appointment.service.impl.ProviderAvailabilityServiceImpl;
import com.appointment.service.impl.ProviderCalendarServiceImpl;
import com.appointment.service.impl.ProviderDashboardServiceImpl;
import com.appointment.service.impl.ProviderProfileServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.query.FluentQuery;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProviderServiceTest {

    private InMemoryUserRepository userRepository;
    private InMemoryAppointmentRepository appointmentRepository;
    private InMemoryProviderAvailabilityRepository availabilityRepository;
    private InMemoryNotificationRepository notificationRepository;

    private NotificationService notificationService;
    private ProviderDashboardService dashboardService;
    private ProviderProfileService profileService;
    private ProviderAvailabilityService availabilityService;
    private ProviderAppointmentService appointmentService;
    private ProviderCalendarService calendarService;

    private User provider1;
    private User provider2;
    private User customer;
    private ServiceEntity service;

    @BeforeEach
    void setUp() {
        userRepository = new InMemoryUserRepository();
        appointmentRepository = new InMemoryAppointmentRepository();
        availabilityRepository = new InMemoryProviderAvailabilityRepository();
        notificationRepository = new InMemoryNotificationRepository();

        notificationService = new NotificationServiceImpl(notificationRepository, userRepository);
        dashboardService = new ProviderDashboardServiceImpl(appointmentRepository, userRepository);
        profileService = new ProviderProfileServiceImpl(userRepository);
        availabilityService = new ProviderAvailabilityServiceImpl(availabilityRepository, userRepository);
        appointmentService = new ProviderAppointmentServiceImpl(appointmentRepository, userRepository, notificationService);
        calendarService = new ProviderCalendarServiceImpl(availabilityRepository, appointmentRepository, userRepository);

        provider1 = userRepository.save(User.builder()
                .fullName("Dr. Robert Provider")
                .email("provider1@test.com")
                .password("encoded_pass")
                .phoneNumber("1112223333")
                .specialization("Cardiology")
                .description("Cardiology expert")
                .role(Role.SERVICE_PROVIDER)
                .enabled(true)
                .build());

        provider2 = userRepository.save(User.builder()
                .fullName("Dr. Sarah Provider")
                .email("provider2@test.com")
                .password("encoded_pass")
                .phoneNumber("4445556666")
                .specialization("Dentistry")
                .description("Dentist expert")
                .role(Role.SERVICE_PROVIDER)
                .enabled(true)
                .build());

        customer = userRepository.save(User.builder()
                .fullName("Alice Customer")
                .email("customer@test.com")
                .password("encoded_pass")
                .role(Role.CUSTOMER)
                .enabled(true)
                .build());

        ServiceCategory cat = ServiceCategory.builder().id(1L).name("Medical").active(true).build();
        service = ServiceEntity.builder()
                .id(1L)
                .name("General Consultation")
                .category(cat)
                .durationMinutes(30)
                .price(new BigDecimal("100.00"))
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Provider Overview computes metrics and isolated provider appointments accurately")
    void testProviderOverview() {
        LocalDateTime now = LocalDateTime.now();

        // 1 pending appointment for provider1
        appointmentRepository.save(Appointment.builder()
                .title("Appt 1")
                .serviceProvider(provider1)
                .customer(customer)
                .service(service)
                .status(AppointmentStatus.PENDING.name())
                .appointmentTime(now.plusDays(1))
                .build());

        // 1 completed appointment for provider1
        appointmentRepository.save(Appointment.builder()
                .title("Appt 2")
                .serviceProvider(provider1)
                .customer(customer)
                .service(service)
                .status(AppointmentStatus.COMPLETED.name())
                .appointmentTime(now.minusDays(1))
                .build());

        // 1 appointment for provider2 (should not count for provider1)
        appointmentRepository.save(Appointment.builder()
                .title("Appt for provider2")
                .serviceProvider(provider2)
                .customer(customer)
                .service(service)
                .status(AppointmentStatus.PENDING.name())
                .appointmentTime(now.plusDays(2))
                .build());

        ProviderOverviewDto overview = dashboardService.getProviderOverview(provider1.getEmail());

        assertNotNull(overview);
        assertEquals(2, overview.getTotalAppointments());
        assertEquals(1, overview.getPendingAppointments());
        assertEquals(1, overview.getCompletedAppointments());
        assertEquals(0, overview.getConfirmedAppointments());
        assertNotNull(overview.getTotalEarnings());
        assertNotNull(overview.getMonthlyStats());
    }

    @Test
    @DisplayName("Provider Profile can be viewed and updated successfully")
    void testProfileManagement() {
        ProviderProfileDto profile = profileService.getProfile(provider1.getEmail());
        assertEquals("Dr. Robert Provider", profile.getFullName());
        assertEquals("Cardiology", profile.getSpecialization());

        UpdateProviderProfileRequest updateReq = UpdateProviderProfileRequest.builder()
                .fullName("Dr. Robert Updated")
                .phoneNumber("9998887777")
                .specialization("Interventional Cardiology")
                .description("Updated physician bio with 15 years experience.")
                .build();

        ProviderProfileDto updated = profileService.updateProfile(provider1.getEmail(), updateReq);
        assertEquals("Dr. Robert Updated", updated.getFullName());
        assertEquals("9998887777", updated.getPhoneNumber());
        assertEquals("Interventional Cardiology", updated.getSpecialization());
        assertEquals("Updated physician bio with 15 years experience.", updated.getDescription());
    }

    @Test
    @DisplayName("Availability creation validates time order, break window, and slot overlap")
    void testAvailabilityValidations() {
        // 1. Invalid working hours (end <= start)
        AvailabilityRequest invalidTimes = AvailabilityRequest.builder()
                .dayOfWeek(DayOfWeek.MONDAY)
                .startTime(LocalTime.of(17, 0))
                .endTime(LocalTime.of(9, 0))
                .build();
        assertThrows(BadRequestException.class, () -> availabilityService.createAvailability(provider1.getEmail(), invalidTimes));

        // 2. Invalid break time outside working hours
        AvailabilityRequest invalidBreak = AvailabilityRequest.builder()
                .dayOfWeek(DayOfWeek.MONDAY)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(17, 0))
                .breakStartTime(LocalTime.of(18, 0))
                .breakEndTime(LocalTime.of(19, 0))
                .build();
        assertThrows(BadRequestException.class, () -> availabilityService.createAvailability(provider1.getEmail(), invalidBreak));

        // 3. Valid creation
        AvailabilityRequest validSlot = AvailabilityRequest.builder()
                .dayOfWeek(DayOfWeek.MONDAY)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(17, 0))
                .breakStartTime(LocalTime.of(13, 0))
                .breakEndTime(LocalTime.of(14, 0))
                .active(true)
                .build();
        AvailabilityDto created = availabilityService.createAvailability(provider1.getEmail(), validSlot);
        assertNotNull(created.getId());
        assertEquals(DayOfWeek.MONDAY, created.getDayOfWeek());

        // 4. Overlapping slot on the same day must be rejected
        AvailabilityRequest overlappingSlot = AvailabilityRequest.builder()
                .dayOfWeek(DayOfWeek.MONDAY)
                .startTime(LocalTime.of(16, 0))
                .endTime(LocalTime.of(19, 0))
                .build();
        assertThrows(BadRequestException.class, () -> availabilityService.createAvailability(provider1.getEmail(), overlappingSlot));
    }

    @Test
    @DisplayName("Provider Availability enforces isolation across different providers")
    void testAvailabilityIsolation() {
        AvailabilityRequest slot = AvailabilityRequest.builder()
                .dayOfWeek(DayOfWeek.TUESDAY)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(16, 0))
                .build();
        AvailabilityDto created = availabilityService.createAvailability(provider1.getEmail(), slot);

        // Provider2 cannot modify or delete provider1's slot
        assertThrows(BadRequestException.class, () ->
                availabilityService.deleteAvailability(provider2.getEmail(), created.getId()));
    }

    @Test
    @DisplayName("Appointment confirmation, rejection with reason, and completion operate securely with isolation")
    void testAppointmentLifecycleAndIsolation() {
        Appointment appt = appointmentRepository.save(Appointment.builder()
                .title("Cardiac Checkup")
                .serviceProvider(provider1)
                .customer(customer)
                .service(service)
                .status(AppointmentStatus.PENDING.name())
                .appointmentTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0))
                .build());

        // Provider2 cannot confirm provider1's appointment
        assertThrows(BadRequestException.class, () ->
                appointmentService.confirmAppointment(provider2.getEmail(), appt.getId()));

        // Provider1 confirms
        appointmentService.confirmAppointment(provider1.getEmail(), appt.getId());
        Appointment confirmed = appointmentRepository.findById(appt.getId()).orElseThrow();
        assertEquals(AppointmentStatus.CONFIRMED.name(), confirmed.getStatus());

        // Complete appointment
        appointmentService.completeAppointment(provider1.getEmail(), appt.getId());
        Appointment completed = appointmentRepository.findById(appt.getId()).orElseThrow();
        assertEquals(AppointmentStatus.COMPLETED.name(), completed.getStatus());

        // Test rejection with reason on new appointment
        Appointment appt2 = appointmentRepository.save(Appointment.builder()
                .title("Followup Consultation")
                .serviceProvider(provider1)
                .customer(customer)
                .service(service)
                .status(AppointmentStatus.PENDING.name())
                .appointmentTime(LocalDateTime.now().plusDays(3).withHour(11).withMinute(0))
                .build());

        assertThrows(BadRequestException.class, () ->
                appointmentService.rejectAppointment(provider1.getEmail(), appt2.getId(), "   "));

        appointmentService.rejectAppointment(provider1.getEmail(), appt2.getId(), "Provider unavailable due to surgical schedule");
        Appointment rejected = appointmentRepository.findById(appt2.getId()).orElseThrow();
        assertEquals(AppointmentStatus.CANCELLED.name(), rejected.getStatus());
        assertEquals("Provider unavailable due to surgical schedule", rejected.getCancellationReason());
    }

    @Test
    @DisplayName("Calendar day schedule computes booked, break, and available slots accurately")
    void testCalendarDaySlots() {
        LocalDate date = LocalDate.now().plusDays(7); // Next week
        DayOfWeek dow = date.getDayOfWeek();

        // Configure availability: 09:00 - 11:00 with no break
        availabilityRepository.save(ProviderAvailability.builder()
                .provider(provider1)
                .dayOfWeek(dow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(11, 0))
                .breakStartTime(LocalTime.of(9, 30))
                .breakEndTime(LocalTime.of(10, 0))
                .active(true)
                .build());

        // Book 10:00 - 10:30
        appointmentRepository.save(Appointment.builder()
                .title("Morning Checkup")
                .serviceProvider(provider1)
                .customer(customer)
                .service(service)
                .status(AppointmentStatus.CONFIRMED.name())
                .appointmentTime(date.atTime(10, 0))
                .build());

        CalendarDayDto calendarDay = calendarService.getCalendarForDate(provider1.getEmail(), date);
        assertNotNull(calendarDay);
        assertTrue(calendarDay.isHasWorkingHours());
        List<TimeSlotDto> slots = calendarDay.getSlots();
        assertEquals(4, slots.size()); // 09:00-09:30, 09:30-10:00, 10:00-10:30, 10:30-11:00

        assertEquals("AVAILABLE", slots.get(0).getStatus());
        assertEquals("BREAK", slots.get(1).getStatus());
        assertEquals("BOOKED", slots.get(2).getStatus());
        assertEquals("AVAILABLE", slots.get(3).getStatus());
    }

    @Test
    @DisplayName("Notification service tracks unread count and read status")
    void testNotificationService() {
        notificationService.createNotification(provider1, "New Request", "Customer booked an appointment", "APPOINTMENT_REQUEST", 1L);
        notificationService.createNotification(provider1, "Reminder", "Upcoming appointment tomorrow", "INFO", null);

        assertEquals(2, notificationService.getUnreadCount(provider1.getEmail()));
        List<NotificationDto> notifications = notificationService.getNotifications(provider1.getEmail());
        assertEquals(2, notifications.size());

        notificationService.markAsRead(provider1.getEmail(), notifications.get(0).getId());
        assertEquals(1, notificationService.getUnreadCount(provider1.getEmail()));

        notificationService.markAllAsRead(provider1.getEmail());
        assertEquals(0, notificationService.getUnreadCount(provider1.getEmail()));
    }

    // --- In-Memory Repository Fakes ---

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
        @Override public long count() { return data.size(); }
        @Override public boolean existsByRole(Role role) { return data.values().stream().anyMatch(u -> u.getRole() == role); }
        @Override public List<User> findByRole(Role role) { return data.values().stream().filter(u -> u.getRole() == role).toList(); }
        @Override public long countByRole(Role role) { return data.values().stream().filter(u -> u.getRole() == role).count(); }
        @Override public long countByEnabled(boolean enabled) { return data.values().stream().filter(u -> u.isEnabled() == enabled).count(); }
        @Override public Page<User> findFiltered(String search, Role role, Boolean enabled, Pageable pageable) { return new PageImpl<>(new ArrayList<>(data.values())); }
        @Override public List<User> findAll() { return new ArrayList<>(data.values()); }
        @Override public boolean existsById(Long id) { return data.containsKey(id); }
        @Override public <S extends User> List<S> saveAll(Iterable<S> entities) { return null; }
        @Override public List<User> findAllById(Iterable<Long> longs) { return null; }
        @Override public void deleteById(Long id) { data.remove(id); }
        @Override public void delete(User entity) {}
        @Override public void deleteAllById(Iterable<? extends Long> longs) {}
        @Override public void deleteAll(Iterable<? extends User> entities) {}
        @Override public void deleteAll() {}
        @Override public void flush() {}
        @Override public <S extends User> S saveAndFlush(S entity) { return save(entity); }
        @Override public <S extends User> List<S> saveAllAndFlush(Iterable<S> entities) { return null; }
        @Override public void deleteAllInBatch(Iterable<User> entities) {}
        @Override public void deleteAllByIdInBatch(Iterable<Long> longs) {}
        @Override public void deleteAllInBatch() {}
        @Override public User getOne(Long id) { return data.get(id); }
        @Override public User getById(Long id) { return data.get(id); }
        @Override public User getReferenceById(Long id) { return data.get(id); }
        @Override public <S extends User> Optional<S> findOne(Example<S> example) { return Optional.empty(); }
        @Override public <S extends User> List<S> findAll(Example<S> example) { return null; }
        @Override public <S extends User> List<S> findAll(Example<S> example, Sort sort) { return null; }
        @Override public <S extends User> Page<S> findAll(Example<S> example, Pageable pageable) { return null; }
        @Override public <S extends User> long count(Example<S> example) { return 0; }
        @Override public <S extends User> boolean exists(Example<S> example) { return false; }
        @Override public <S extends User, R> R findBy(Example<S> example, Function<FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { return null; }
        @Override public List<User> findAll(Sort sort) { return null; }
        @Override public Page<User> findAll(Pageable pageable) { return null; }
    }

    static class InMemoryAppointmentRepository implements AppointmentRepository {
        private final Map<Long, Appointment> data = new HashMap<>();
        private final AtomicLong gen = new AtomicLong(1);

        @Override public <S extends Appointment> S save(S e) {
            if (e.getId() == null) e.setId(gen.getAndIncrement());
            data.put(e.getId(), e);
            return e;
        }
        @Override public Optional<Appointment> findById(Long id) { return Optional.ofNullable(data.get(id)); }
        @Override public long count() { return data.size(); }
        @Override public long countByStatus(String status) { return data.values().stream().filter(a -> a.getStatus().equalsIgnoreCase(status)).count(); }
        @Override public List<Appointment> findAll() { return new ArrayList<>(data.values()); }
        @Override public List<Appointment> findByStatus(String status) { return data.values().stream().filter(a -> a.getStatus().equalsIgnoreCase(status)).toList(); }
        @Override public List<Appointment> findByCustomerId(Long customerId) { return null; }
        @Override public List<Appointment> findByServiceProviderId(Long serviceProviderId) {
            return data.values().stream().filter(a -> a.getServiceProvider() != null && a.getServiceProvider().getId().equals(serviceProviderId)).toList();
        }
        @Override public long countByServiceProviderId(Long serviceProviderId) {
            return data.values().stream().filter(a -> a.getServiceProvider() != null && a.getServiceProvider().getId().equals(serviceProviderId)).count();
        }
        @Override public long countByServiceProviderIdAndStatus(Long serviceProviderId, String status) {
            return data.values().stream().filter(a -> a.getServiceProvider() != null && a.getServiceProvider().getId().equals(serviceProviderId) && a.getStatus().equalsIgnoreCase(status)).count();
        }
        @Override public Page<Appointment> findFiltered(String search, String status, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
            return new PageImpl<>(new ArrayList<>(data.values()), pageable, data.size());
        }
        @Override public Page<Appointment> findProviderFiltered(Long providerId, String search, String status, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
            List<Appointment> list = data.values().stream().filter(a -> a.getServiceProvider() != null && a.getServiceProvider().getId().equals(providerId)).toList();
            return new PageImpl<>(list, pageable, list.size());
        }
        @Override public long countTodayAppointments(Long providerId, LocalDateTime startOfDay, LocalDateTime endOfDay) {
            return data.values().stream().filter(a -> a.getServiceProvider() != null && a.getServiceProvider().getId().equals(providerId) && a.getAppointmentTime() != null && !a.getAppointmentTime().isBefore(startOfDay) && !a.getAppointmentTime().isAfter(endOfDay)).count();
        }
        @Override public BigDecimal calculateTotalEarnings(Long providerId) {
            return data.values().stream()
                    .filter(a -> a.getServiceProvider() != null && a.getServiceProvider().getId().equals(providerId) && AppointmentStatus.COMPLETED.name().equalsIgnoreCase(a.getStatus()))
                    .map(a -> a.getService() != null && a.getService().getPrice() != null ? a.getService().getPrice() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        @Override public BigDecimal calculateMonthlyEarnings(Long providerId, LocalDateTime startOfMonth, LocalDateTime endOfMonth) {
            return calculateTotalEarnings(providerId);
        }
        @Override public List<Appointment> findByServiceProviderIdAndAppointmentTimeBetween(Long serviceProviderId, LocalDateTime start, LocalDateTime end) {
            return data.values().stream().filter(a -> a.getServiceProvider() != null && a.getServiceProvider().getId().equals(serviceProviderId) && a.getAppointmentTime() != null && !a.getAppointmentTime().isBefore(start) && !a.getAppointmentTime().isAfter(end)).toList();
        }
        @Override public List<Object[]> countAppointmentsByStatusGroup() { return new ArrayList<>(); }
        @Override public List<Object[]> findServicePopularity() { return new ArrayList<>(); }
        @Override public boolean existsById(Long aLong) { return data.containsKey(aLong); }
        @Override public <S extends Appointment> List<S> saveAll(Iterable<S> entities) { return null; }
        @Override public List<Appointment> findAllById(Iterable<Long> longs) { return null; }
        @Override public void deleteById(Long aLong) { data.remove(aLong); }
        @Override public void delete(Appointment entity) {}
        @Override public void deleteAllById(Iterable<? extends Long> longs) {}
        @Override public void deleteAll(Iterable<? extends Appointment> entities) {}
        @Override public void deleteAll() {}
        @Override public void flush() {}
        @Override public <S extends Appointment> S saveAndFlush(S entity) { return save(entity); }
        @Override public <S extends Appointment> List<S> saveAllAndFlush(Iterable<S> entities) { return null; }
        @Override public void deleteAllInBatch(Iterable<Appointment> entities) {}
        @Override public void deleteAllByIdInBatch(Iterable<Long> longs) {}
        @Override public void deleteAllInBatch() {}
        @Override public Appointment getOne(Long aLong) { return data.get(aLong); }
        @Override public Appointment getById(Long aLong) { return data.get(aLong); }
        @Override public Appointment getReferenceById(Long aLong) { return data.get(aLong); }
        @Override public <S extends Appointment> Optional<S> findOne(Example<S> example) { return Optional.empty(); }
        @Override public <S extends Appointment> List<S> findAll(Example<S> example) { return null; }
        @Override public <S extends Appointment> List<S> findAll(Example<S> example, Sort sort) { return null; }
        @Override public <S extends Appointment> Page<S> findAll(Example<S> example, Pageable pageable) { return null; }
        @Override public <S extends Appointment> long count(Example<S> example) { return 0; }
        @Override public <S extends Appointment> boolean exists(Example<S> example) { return false; }
        @Override public <S extends Appointment, R> R findBy(Example<S> example, Function<FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { return null; }
        @Override public List<Appointment> findAll(Sort sort) { return null; }
        @Override public Page<Appointment> findAll(Pageable pageable) { return null; }
    }

    static class InMemoryProviderAvailabilityRepository implements ProviderAvailabilityRepository {
        private final Map<Long, ProviderAvailability> data = new HashMap<>();
        private final AtomicLong gen = new AtomicLong(1);

        @Override public <S extends ProviderAvailability> S save(S e) {
            if (e.getId() == null) e.setId(gen.getAndIncrement());
            data.put(e.getId(), e);
            return e;
        }
        @Override public Optional<ProviderAvailability> findById(Long id) { return Optional.ofNullable(data.get(id)); }
        @Override public List<ProviderAvailability> findByProviderId(Long providerId) {
            return data.values().stream().filter(a -> a.getProvider().getId().equals(providerId)).toList();
        }
        @Override public List<ProviderAvailability> findByProviderIdOrderByDayOfWeekAscStartTimeAsc(Long providerId) {
            return findByProviderId(providerId);
        }
        @Override public List<ProviderAvailability> findByProviderIdAndDayOfWeek(Long providerId, DayOfWeek dayOfWeek) {
            return data.values().stream().filter(a -> a.getProvider().getId().equals(providerId) && a.getDayOfWeek() == dayOfWeek).toList();
        }
        @Override public List<ProviderAvailability> findByProviderIdAndDayOfWeekAndActiveTrue(Long providerId, DayOfWeek dayOfWeek) {
            return data.values().stream().filter(a -> a.getProvider().getId().equals(providerId) && a.getDayOfWeek() == dayOfWeek && a.isActive()).toList();
        }
        @Override public List<ProviderAvailability> findByProviderIdAndActiveTrue(Long providerId) {
            return data.values().stream().filter(a -> a.getProvider().getId().equals(providerId) && a.isActive()).toList();
        }
        @Override public boolean existsByProviderId(Long providerId) {
            return data.values().stream().anyMatch(a -> a.getProvider().getId().equals(providerId));
        }
        @Override public void delete(ProviderAvailability entity) { data.remove(entity.getId()); }
        @Override public void deleteById(Long id) { data.remove(id); }
        @Override public boolean existsById(Long id) { return data.containsKey(id); }
        @Override public List<ProviderAvailability> findAll() { return new ArrayList<>(data.values()); }
        @Override public List<ProviderAvailability> findAllById(Iterable<Long> longs) { return null; }
        @Override public long count() { return data.size(); }
        @Override public void deleteAllById(Iterable<? extends Long> longs) {}
        @Override public void deleteAll(Iterable<? extends ProviderAvailability> entities) {}
        @Override public void deleteAll() {}
        @Override public <S extends ProviderAvailability> List<S> saveAll(Iterable<S> entities) { return null; }
        @Override public void flush() {}
        @Override public <S extends ProviderAvailability> S saveAndFlush(S entity) { return save(entity); }
        @Override public <S extends ProviderAvailability> List<S> saveAllAndFlush(Iterable<S> entities) { return null; }
        @Override public void deleteAllInBatch(Iterable<ProviderAvailability> entities) {}
        @Override public void deleteAllByIdInBatch(Iterable<Long> longs) {}
        @Override public void deleteAllInBatch() {}
        @Override public ProviderAvailability getOne(Long aLong) { return data.get(aLong); }
        @Override public ProviderAvailability getById(Long aLong) { return data.get(aLong); }
        @Override public ProviderAvailability getReferenceById(Long aLong) { return data.get(aLong); }
        @Override public <S extends ProviderAvailability> Optional<S> findOne(Example<S> example) { return Optional.empty(); }
        @Override public <S extends ProviderAvailability> List<S> findAll(Example<S> example) { return null; }
        @Override public <S extends ProviderAvailability> List<S> findAll(Example<S> example, Sort sort) { return null; }
        @Override public <S extends ProviderAvailability> Page<S> findAll(Example<S> example, Pageable pageable) { return null; }
        @Override public <S extends ProviderAvailability> long count(Example<S> example) { return 0; }
        @Override public <S extends ProviderAvailability> boolean exists(Example<S> example) { return false; }
        @Override public <S extends ProviderAvailability, R> R findBy(Example<S> example, Function<FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { return null; }
        @Override public List<ProviderAvailability> findAll(Sort sort) { return null; }
        @Override public Page<ProviderAvailability> findAll(Pageable pageable) { return null; }
    }

    static class InMemoryNotificationRepository implements NotificationRepository {
        private final Map<Long, Notification> data = new HashMap<>();
        private final AtomicLong gen = new AtomicLong(1);

        @Override public <S extends Notification> S save(S e) {
            if (e.getId() == null) e.setId(gen.getAndIncrement());
            data.put(e.getId(), e);
            return e;
        }
        @Override public Optional<Notification> findById(Long id) { return Optional.ofNullable(data.get(id)); }
        @Override public List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId) {
            return data.values().stream().filter(n -> n.getUser().getId().equals(userId)).toList();
        }
        @Override public List<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(Long userId) {
            return data.values().stream().filter(n -> n.getUser().getId().equals(userId) && !n.isRead()).toList();
        }
        @Override public long countByUserIdAndReadFalse(Long userId) {
            return data.values().stream().filter(n -> n.getUser().getId().equals(userId) && !n.isRead()).count();
        }
        @Override public <S extends Notification> List<S> saveAll(Iterable<S> entities) {
            entities.forEach(this::save);
            return null;
        }
        @Override public List<Notification> findAll() { return new ArrayList<>(data.values()); }
        @Override public boolean existsById(Long id) { return data.containsKey(id); }
        @Override public List<Notification> findAllById(Iterable<Long> longs) { return null; }
        @Override public long count() { return data.size(); }
        @Override public void deleteById(Long id) { data.remove(id); }
        @Override public void delete(Notification entity) {}
        @Override public void deleteAllById(Iterable<? extends Long> longs) {}
        @Override public void deleteAll(Iterable<? extends Notification> entities) {}
        @Override public void deleteAll() {}
        @Override public void flush() {}
        @Override public <S extends Notification> S saveAndFlush(S entity) { return save(entity); }
        @Override public <S extends Notification> List<S> saveAllAndFlush(Iterable<S> entities) { return null; }
        @Override public void deleteAllInBatch(Iterable<Notification> entities) {}
        @Override public void deleteAllByIdInBatch(Iterable<Long> longs) {}
        @Override public void deleteAllInBatch() {}
        @Override public Notification getOne(Long aLong) { return data.get(aLong); }
        @Override public Notification getById(Long aLong) { return data.get(aLong); }
        @Override public Notification getReferenceById(Long aLong) { return data.get(aLong); }
        @Override public <S extends Notification> Optional<S> findOne(Example<S> example) { return Optional.empty(); }
        @Override public <S extends Notification> List<S> findAll(Example<S> example) { return null; }
        @Override public <S extends Notification> List<S> findAll(Example<S> example, Sort sort) { return null; }
        @Override public <S extends Notification> Page<S> findAll(Example<S> example, Pageable pageable) { return null; }
        @Override public <S extends Notification> long count(Example<S> example) { return 0; }
        @Override public <S extends Notification> boolean exists(Example<S> example) { return false; }
        @Override public <S extends Notification, R> R findBy(Example<S> example, Function<FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { return null; }
        @Override public List<Notification> findAll(Sort sort) { return null; }
        @Override public Page<Notification> findAll(Pageable pageable) { return null; }
    }
}


