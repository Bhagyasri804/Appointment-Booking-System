package com.appointment.service;

import com.appointment.dto.AdminDashboardStatsDto;
import com.appointment.dto.CancelAppointmentRequest;
import com.appointment.dto.ServiceDto;
import com.appointment.dto.ServiceRequest;
import com.appointment.dto.UserResponse;
import com.appointment.entity.Appointment;
import com.appointment.entity.AppointmentStatus;
import com.appointment.entity.Role;
import com.appointment.entity.ServiceCategory;
import com.appointment.entity.ServiceEntity;
import com.appointment.entity.User;
import com.appointment.exception.BadRequestException;
import com.appointment.repository.AppointmentRepository;
import com.appointment.repository.ServiceCategoryRepository;
import com.appointment.repository.ServiceEntityRepository;
import com.appointment.repository.UserRepository;
import com.appointment.service.impl.AdminAppointmentServiceImpl;
import com.appointment.service.impl.AdminDashboardServiceImpl;
import com.appointment.service.impl.ServiceManagementServiceImpl;
import com.appointment.service.impl.UserServiceImpl;
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
import java.time.LocalDateTime;
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

class AdminServiceTest {

    private InMemoryUserRepository userRepository;
    private InMemoryAppointmentRepository appointmentRepository;
    private InMemoryServiceEntityRepository serviceEntityRepository;
    private InMemoryServiceCategoryRepository serviceCategoryRepository;

    private AdminDashboardServiceImpl adminDashboardService;
    private UserServiceImpl userService;
    private ServiceManagementServiceImpl serviceManagementService;
    private AdminAppointmentServiceImpl adminAppointmentService;

    @BeforeEach
    void setUp() {
        userRepository = new InMemoryUserRepository();
        appointmentRepository = new InMemoryAppointmentRepository();
        serviceEntityRepository = new InMemoryServiceEntityRepository();
        serviceCategoryRepository = new InMemoryServiceCategoryRepository();

        adminDashboardService = new AdminDashboardServiceImpl(userRepository, appointmentRepository, serviceEntityRepository);
        userService = new UserServiceImpl(userRepository);
        serviceManagementService = new ServiceManagementServiceImpl(serviceEntityRepository, serviceCategoryRepository);
        adminAppointmentService = new AdminAppointmentServiceImpl(appointmentRepository);
    }

    @Test
    @DisplayName("Dashboard stats should aggregate user, appointment, and service counts correctly")
    void shouldReturnCorrectDashboardStats() {
        userRepository.save(User.builder().fullName("Admin").email("admin@test.com").role(Role.ADMIN).build());
        userRepository.save(User.builder().fullName("Cust 1").email("cust1@test.com").role(Role.CUSTOMER).build());
        userRepository.save(User.builder().fullName("Cust 2").email("cust2@test.com").role(Role.CUSTOMER).build());
        userRepository.save(User.builder().fullName("Prov 1").email("prov1@test.com").role(Role.SERVICE_PROVIDER).build());

        appointmentRepository.save(Appointment.builder().title("A1").status(AppointmentStatus.PENDING.name()).build());
        appointmentRepository.save(Appointment.builder().title("A2").status(AppointmentStatus.CONFIRMED.name()).build());
        appointmentRepository.save(Appointment.builder().title("A3").status(AppointmentStatus.COMPLETED.name()).build());
        appointmentRepository.save(Appointment.builder().title("A4").status(AppointmentStatus.CANCELLED.name()).build());

        serviceEntityRepository.save(ServiceEntity.builder().name("S1").active(true).build());
        serviceEntityRepository.save(ServiceEntity.builder().name("S2").active(false).build());

        AdminDashboardStatsDto stats = adminDashboardService.getDashboardStats();

        assertNotNull(stats);
        assertEquals(4L, stats.getTotalUsers());
        assertEquals(2L, stats.getTotalCustomers());
        assertEquals(1L, stats.getTotalProviders());
        assertEquals(1L, stats.getTotalAdmins());

        assertEquals(4L, stats.getTotalAppointments());
        assertEquals(1L, stats.getPendingAppointments());
        assertEquals(1L, stats.getConfirmedAppointments());
        assertEquals(1L, stats.getCompletedAppointments());
        assertEquals(1L, stats.getCancelledAppointments());

        assertEquals(2L, stats.getTotalServices());
        assertEquals(1L, stats.getActiveServices());
    }

    @Test
    @DisplayName("Should prevent administrator from deactivating their own account")
    void shouldPreventAdminSelfDeactivation() {
        User admin = userRepository.save(User.builder()
                .fullName("System Admin")
                .email("admin@appointment.com")
                .role(Role.ADMIN)
                .enabled(true)
                .build());

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> userService.toggleUserStatus(admin.getId(), false, "admin@appointment.com")
        );
        assertTrue(ex.getMessage().contains("cannot deactivate their own account"));
    }

    @Test
    @DisplayName("Should allow administrator to toggle other user's status")
    void shouldToggleOtherUserStatus() {
        User customer = userRepository.save(User.builder()
                .fullName("John Customer")
                .email("john@customer.com")
                .role(Role.CUSTOMER)
                .enabled(true)
                .build());

        UserResponse response = userService.toggleUserStatus(customer.getId(), false, "admin@appointment.com");

        assertNotNull(response);
        assertFalse(response.isEnabled());
    }

    @Test
    @DisplayName("Should create service with valid category")
    void shouldCreateServiceSuccessfully() {
        ServiceCategory category = serviceCategoryRepository.save(ServiceCategory.builder()
                .name("Medical & Health")
                .active(true)
                .build());

        ServiceRequest request = ServiceRequest.builder()
                .name("Dental Cleaning")
                .description("Routine teeth cleaning")
                .categoryId(category.getId())
                .durationMinutes(45)
                .price(new BigDecimal("99.99"))
                .active(true)
                .build();

        ServiceDto result = serviceManagementService.createService(request);

        assertNotNull(result);
        assertNotNull(result.getId());
        assertEquals("Dental Cleaning", result.getName());
        assertEquals("Medical & Health", result.getCategoryName());
    }

    @Test
    @DisplayName("Should cancel appointment with admin reason")
    void shouldCancelAppointmentWithReason() {
        Appointment appointment = appointmentRepository.save(Appointment.builder()
                .title("Annual Checkup")
                .status(AppointmentStatus.CONFIRMED.name())
                .appointmentTime(LocalDateTime.now().plusDays(1))
                .build());

        CancelAppointmentRequest request = new CancelAppointmentRequest("Provider is unavailable due to emergency");

        var response = adminAppointmentService.cancelAppointment(appointment.getId(), request, "admin@appointment.com");

        assertNotNull(response);
        assertEquals(AppointmentStatus.CANCELLED.name(), response.getStatus());
        assertTrue(response.getCancellationReason().contains("Provider is unavailable"));
    }

    // In-memory stubs
    static class InMemoryUserRepository implements UserRepository {
        private final Map<Long, User> data = new HashMap<>();
        private final AtomicLong gen = new AtomicLong(1);

        @Override public <S extends User> S save(S e) {
            if (e.getId() == null) e.setId(gen.getAndIncrement());
            data.put(e.getId(), e);
            return e;
        }
        @Override public Optional<User> findById(Long id) { return Optional.ofNullable(data.get(id)); }
        @Override public long count() { return data.size(); }
        @Override public long countByRole(Role r) { return data.values().stream().filter(u -> u.getRole() == r).count(); }
        @Override public long countByEnabled(boolean e) { return data.values().stream().filter(u -> u.isEnabled() == e).count(); }
        @Override public List<User> findAll() { return new ArrayList<>(data.values()); }
        @Override public Optional<User> findByEmail(String email) { return data.values().stream().filter(u -> u.getEmail().equalsIgnoreCase(email)).findFirst(); }
        @Override public boolean existsByEmail(String email) { return findByEmail(email).isPresent(); }
        @Override public boolean existsByRole(Role role) { return data.values().stream().anyMatch(u -> u.getRole() == role); }
        @Override public List<User> findByRole(Role role) { return data.values().stream().filter(u -> u.getRole() == role).toList(); }
        @Override public Page<User> findFiltered(String search, Role role, Boolean enabled, Pageable pageable) { return new PageImpl<>(new ArrayList<>(data.values()), pageable, data.size()); }
        @Override public boolean existsById(Long aLong) { return data.containsKey(aLong); }
        @Override public <S extends User> List<S> saveAll(Iterable<S> entities) { return null; }
        @Override public List<User> findAllById(Iterable<Long> longs) { return null; }
        @Override public void deleteById(Long aLong) { data.remove(aLong); }
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
        @Override public User getOne(Long aLong) { return data.get(aLong); }
        @Override public User getById(Long aLong) { return data.get(aLong); }
        @Override public User getReferenceById(Long aLong) { return data.get(aLong); }
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
        @Override public List<Appointment> findByServiceProviderId(Long serviceProviderId) { return null; }
        @Override public Page<Appointment> findFiltered(String search, String status, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) { return new PageImpl<>(new ArrayList<>(data.values()), pageable, data.size()); }
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

    static class InMemoryServiceEntityRepository implements ServiceEntityRepository {
        private final Map<Long, ServiceEntity> data = new HashMap<>();
        private final AtomicLong gen = new AtomicLong(1);

        @Override public <S extends ServiceEntity> S save(S e) {
            if (e.getId() == null) e.setId(gen.getAndIncrement());
            data.put(e.getId(), e);
            return e;
        }
        @Override public Optional<ServiceEntity> findById(Long id) { return Optional.ofNullable(data.get(id)); }
        @Override public long count() { return data.size(); }
        @Override public long countByActiveTrue() { return data.values().stream().filter(ServiceEntity::isActive).count(); }
        @Override public List<ServiceEntity> findByActiveTrue() { return data.values().stream().filter(ServiceEntity::isActive).toList(); }
        @Override public List<ServiceEntity> findByCategoryId(Long categoryId) { return null; }
        @Override public boolean existsById(Long aLong) { return data.containsKey(aLong); }
        @Override public void deleteById(Long aLong) { data.remove(aLong); }
        @Override public Page<ServiceEntity> findFiltered(String search, Long categoryId, Boolean active, Pageable pageable) { return new PageImpl<>(new ArrayList<>(data.values()), pageable, data.size()); }
        @Override public <S extends ServiceEntity> List<S> saveAll(Iterable<S> entities) { return null; }
        @Override public List<ServiceEntity> findAllById(Iterable<Long> longs) { return null; }
        @Override public List<ServiceEntity> findAll() { return new ArrayList<>(data.values()); }
        @Override public void delete(ServiceEntity entity) {}
        @Override public void deleteAllById(Iterable<? extends Long> longs) {}
        @Override public void deleteAll(Iterable<? extends ServiceEntity> entities) {}
        @Override public void deleteAll() {}
        @Override public void flush() {}
        @Override public <S extends ServiceEntity> S saveAndFlush(S entity) { return save(entity); }
        @Override public <S extends ServiceEntity> List<S> saveAllAndFlush(Iterable<S> entities) { return null; }
        @Override public void deleteAllInBatch(Iterable<ServiceEntity> entities) {}
        @Override public void deleteAllByIdInBatch(Iterable<Long> longs) {}
        @Override public void deleteAllInBatch() {}
        @Override public ServiceEntity getOne(Long aLong) { return data.get(aLong); }
        @Override public ServiceEntity getById(Long aLong) { return data.get(aLong); }
        @Override public ServiceEntity getReferenceById(Long aLong) { return data.get(aLong); }
        @Override public <S extends ServiceEntity> Optional<S> findOne(Example<S> example) { return Optional.empty(); }
        @Override public <S extends ServiceEntity> List<S> findAll(Example<S> example) { return null; }
        @Override public <S extends ServiceEntity> List<S> findAll(Example<S> example, Sort sort) { return null; }
        @Override public <S extends ServiceEntity> Page<S> findAll(Example<S> example, Pageable pageable) { return null; }
        @Override public <S extends ServiceEntity> long count(Example<S> example) { return 0; }
        @Override public <S extends ServiceEntity> boolean exists(Example<S> example) { return false; }
        @Override public <S extends ServiceEntity, R> R findBy(Example<S> example, Function<FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { return null; }
        @Override public List<ServiceEntity> findAll(Sort sort) { return null; }
        @Override public Page<ServiceEntity> findAll(Pageable pageable) { return null; }
    }

    static class InMemoryServiceCategoryRepository implements ServiceCategoryRepository {
        private final Map<Long, ServiceCategory> data = new HashMap<>();
        private final AtomicLong gen = new AtomicLong(1);

        @Override public <S extends ServiceCategory> S save(S e) {
            if (e.getId() == null) e.setId(gen.getAndIncrement());
            data.put(e.getId(), e);
            return e;
        }
        @Override public Optional<ServiceCategory> findById(Long id) { return Optional.ofNullable(data.get(id)); }
        @Override public Optional<ServiceCategory> findByNameIgnoreCase(String name) { return data.values().stream().filter(c -> c.getName().equalsIgnoreCase(name)).findFirst(); }
        @Override public boolean existsByNameIgnoreCase(String name) { return findByNameIgnoreCase(name).isPresent(); }
        @Override public List<ServiceCategory> findByActiveTrue() { return data.values().stream().filter(ServiceCategory::isActive).toList(); }
        @Override public List<ServiceCategory> findAll() { return new ArrayList<>(data.values()); }
        @Override public boolean existsById(Long aLong) { return data.containsKey(aLong); }
        @Override public <S extends ServiceCategory> List<S> saveAll(Iterable<S> entities) { return null; }
        @Override public List<ServiceCategory> findAllById(Iterable<Long> longs) { return null; }
        @Override public long count() { return data.size(); }
        @Override public void deleteById(Long aLong) { data.remove(aLong); }
        @Override public void delete(ServiceCategory entity) {}
        @Override public void deleteAllById(Iterable<? extends Long> longs) {}
        @Override public void deleteAll(Iterable<? extends ServiceCategory> entities) {}
        @Override public void deleteAll() {}
        @Override public void flush() {}
        @Override public <S extends ServiceCategory> S saveAndFlush(S entity) { return save(entity); }
        @Override public <S extends ServiceCategory> List<S> saveAllAndFlush(Iterable<S> entities) { return null; }
        @Override public void deleteAllInBatch(Iterable<ServiceCategory> entities) {}
        @Override public void deleteAllByIdInBatch(Iterable<Long> longs) {}
        @Override public void deleteAllInBatch() {}
        @Override public ServiceCategory getOne(Long aLong) { return data.get(aLong); }
        @Override public ServiceCategory getById(Long aLong) { return data.get(aLong); }
        @Override public ServiceCategory getReferenceById(Long aLong) { return data.get(aLong); }
        @Override public <S extends ServiceCategory> Optional<S> findOne(Example<S> example) { return Optional.empty(); }
        @Override public <S extends ServiceCategory> List<S> findAll(Example<S> example) { return null; }
        @Override public <S extends ServiceCategory> List<S> findAll(Example<S> example, Sort sort) { return null; }
        @Override public <S extends ServiceCategory> Page<S> findAll(Example<S> example, Pageable pageable) { return null; }
        @Override public <S extends ServiceCategory> long count(Example<S> example) { return 0; }
        @Override public <S extends ServiceCategory> boolean exists(Example<S> example) { return false; }
        @Override public <S extends ServiceCategory, R> R findBy(Example<S> example, Function<FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { return null; }
        @Override public List<ServiceCategory> findAll(Sort sort) { return null; }
        @Override public Page<ServiceCategory> findAll(Pageable pageable) { return null; }
    }
}
