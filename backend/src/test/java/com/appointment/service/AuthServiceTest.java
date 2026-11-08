package com.appointment.service;

import com.appointment.dto.ApiResponse;
import com.appointment.dto.AuthResponse;
import com.appointment.dto.LoginRequest;
import com.appointment.dto.RegisterRequest;
import com.appointment.dto.UserResponse;
import com.appointment.entity.Role;
import com.appointment.entity.User;
import com.appointment.exception.BadRequestException;
import com.appointment.exception.EmailAlreadyExistsException;
import com.appointment.repository.UserRepository;
import com.appointment.security.JwtTokenProvider;
import com.appointment.security.TokenBlacklistService;
import com.appointment.security.UserPrincipal;
import com.appointment.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.query.FluentQuery;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

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

class AuthServiceTest {

    private InMemoryUserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtTokenProvider tokenProvider;
    private TokenBlacklistService tokenBlacklistService;
    private AuthenticationManager authenticationManager;
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        userRepository = new InMemoryUserRepository();
        passwordEncoder = new BCryptPasswordEncoder();

        tokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(tokenProvider, "jwtSecret", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        ReflectionTestUtils.setField(tokenProvider, "jwtExpirationInMs", 86400000L);

        tokenBlacklistService = new TokenBlacklistService();

        authenticationManager = authentication -> {
            String email = authentication.getName();
            String rawPassword = (String) authentication.getCredentials();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

            if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
                throw new BadCredentialsException("Invalid credentials");
            }

            UserPrincipal principal = UserPrincipal.create(user);
            return new UsernamePasswordAuthenticationToken(principal, rawPassword, principal.getAuthorities());
        };

        authService = new AuthServiceImpl(
                userRepository,
                passwordEncoder,
                authenticationManager,
                tokenProvider,
                tokenBlacklistService
        );
    }

    @Test
    @DisplayName("Should successfully register a new customer with BCrypt encrypted password")
    void shouldRegisterCustomerSuccessfully() {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("Alice Customer")
                .email("alice@example.com")
                .password("Password123")
                .phoneNumber("9876543210")
                .role(Role.CUSTOMER)
                .build();

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals("alice@example.com", response.getEmail());
        assertEquals(Role.CUSTOMER, response.getRole());

        // Verify password was hashed with BCrypt
        User savedUser = userRepository.findByEmail("alice@example.com").orElseThrow();
        assertNotNull(savedUser.getPassword());
        assertTrue(passwordEncoder.matches("Password123", savedUser.getPassword()));
        assertFalse(savedUser.getPassword().equals("Password123"));

        // Verify JWT token is valid
        assertTrue(tokenProvider.validateToken(response.getToken()));
        assertEquals("alice@example.com", tokenProvider.getUsernameFromToken(response.getToken()));
        assertEquals("CUSTOMER", tokenProvider.getRoleFromToken(response.getToken()));
    }

    @Test
    @DisplayName("Should successfully register a service provider")
    void shouldRegisterServiceProviderSuccessfully() {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("Dr. Bob Provider")
                .email("bob@example.com")
                .password("ProviderPass1")
                .phoneNumber("5551234567")
                .role(Role.SERVICE_PROVIDER)
                .build();

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals(Role.SERVICE_PROVIDER, response.getRole());
        assertEquals("bob@example.com", response.getEmail());
        assertTrue(tokenProvider.validateToken(response.getToken()));
        assertEquals("SERVICE_PROVIDER", tokenProvider.getRoleFromToken(response.getToken()));
    }

    @Test
    @DisplayName("Should reject direct registration as ADMIN")
    void shouldRejectAdminRegistration() {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("Fake Admin")
                .email("fakeadmin@example.com")
                .password("AdminSecret123")
                .role(Role.ADMIN)
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.register(request));
        assertTrue(ex.getMessage().contains("ADMIN"));
    }

    @Test
    @DisplayName("Should reject registration if email is already in use")
    void shouldRejectDuplicateEmail() {
        RegisterRequest first = RegisterRequest.builder()
                .fullName("First User")
                .email("duplicate@example.com")
                .password("Password123")
                .role(Role.CUSTOMER)
                .build();
        authService.register(first);

        RegisterRequest duplicate = RegisterRequest.builder()
                .fullName("Second User")
                .email("duplicate@example.com")
                .password("NewPassword456")
                .role(Role.CUSTOMER)
                .build();

        assertThrows(EmailAlreadyExistsException.class, () -> authService.register(duplicate));
    }

    @Test
    @DisplayName("Should login successfully with correct credentials")
    void shouldLoginSuccessfully() {
        RegisterRequest registerReq = RegisterRequest.builder()
                .fullName("John Smith")
                .email("john@example.com")
                .password("Secret@123")
                .role(Role.CUSTOMER)
                .build();
        authService.register(registerReq);

        LoginRequest loginReq = LoginRequest.builder()
                .email("john@example.com")
                .password("Secret@123")
                .build();

        AuthResponse response = authService.login(loginReq);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals("john@example.com", response.getEmail());
        assertEquals(Role.CUSTOMER, response.getRole());
        assertTrue(tokenProvider.validateToken(response.getToken()));
    }

    @Test
    @DisplayName("Should fail login with incorrect credentials")
    void shouldFailLoginWithBadPassword() {
        RegisterRequest registerReq = RegisterRequest.builder()
                .fullName("Jane Doe")
                .email("jane@example.com")
                .password("CorrectPass")
                .role(Role.CUSTOMER)
                .build();
        authService.register(registerReq);

        LoginRequest loginReq = LoginRequest.builder()
                .email("jane@example.com")
                .password("WrongPassword")
                .build();

        assertThrows(BadCredentialsException.class, () -> authService.login(loginReq));
    }

    @Test
    @DisplayName("Should blacklist token upon logout and reject blacklisted token")
    void shouldBlacklistTokenOnLogout() {
        RegisterRequest registerReq = RegisterRequest.builder()
                .fullName("Logout User")
                .email("logout@example.com")
                .password("Password123")
                .role(Role.CUSTOMER)
                .build();
        AuthResponse auth = authService.register(registerReq);
        String token = auth.getToken();

        assertFalse(tokenBlacklistService.isBlacklisted(token));

        ApiResponse<Void> logoutResponse = authService.logout("Bearer " + token);
        assertTrue(logoutResponse.isSuccess());

        assertTrue(tokenBlacklistService.isBlacklisted(token));
    }

    @Test
    @DisplayName("Should retrieve current user profile by email")
    void shouldRetrieveCurrentUser() {
        RegisterRequest registerReq = RegisterRequest.builder()
                .fullName("Profile User")
                .email("profile@example.com")
                .password("Password123")
                .phoneNumber("1112223333")
                .role(Role.CUSTOMER)
                .build();
        authService.register(registerReq);

        UserResponse userResponse = authService.getCurrentUser("profile@example.com");

        assertNotNull(userResponse);
        assertEquals("Profile User", userResponse.getFullName());
        assertEquals("profile@example.com", userResponse.getEmail());
        assertEquals("1112223333", userResponse.getPhoneNumber());
        assertEquals(Role.CUSTOMER, userResponse.getRole());
    }

    /**
     * In-memory implementation of UserRepository for fast, reliable unit testing.
     */
    static class InMemoryUserRepository implements UserRepository {
        private final Map<Long, User> byId = new HashMap<>();
        private final Map<String, User> byEmail = new HashMap<>();
        private final AtomicLong idGen = new AtomicLong(1);

        @Override
        public Optional<User> findByEmail(String email) {
            return Optional.ofNullable(byEmail.get(email.toLowerCase()));
        }

        @Override
        public boolean existsByEmail(String email) {
            return byEmail.containsKey(email.toLowerCase());
        }

        @Override
        public boolean existsByRole(Role role) {
            return byId.values().stream().anyMatch(u -> u.getRole() == role);
        }

        @Override
        public List<User> findByRole(Role role) {
            return byId.values().stream().filter(u -> u.getRole() == role).toList();
        }

        @Override
        public List<User> findByRoleAndEnabledTrue(Role role) {
            return byId.values().stream().filter(u -> u.getRole() == role && u.isEnabled()).toList();
        }

        @Override
        public List<User> searchProviders(String search) {
            return byId.values().stream().filter(u -> u.getRole() == Role.SERVICE_PROVIDER && u.isEnabled()).toList();
        }

        @Override
        public long countByRole(Role role) {
            return byId.values().stream().filter(u -> u.getRole() == role).count();
        }

        @Override
        public long countByEnabled(boolean enabled) {
            return byId.values().stream().filter(u -> u.isEnabled() == enabled).count();
        }

        @Override
        public Page<User> findFiltered(String search, Role role, Boolean enabled, Pageable pageable) {
            List<User> list = byId.values().stream()
                    .filter(u -> role == null || u.getRole() == role)
                    .filter(u -> enabled == null || u.isEnabled() == enabled)
                    .filter(u -> search == null || u.getFullName().toLowerCase().contains(search.toLowerCase()) || u.getEmail().toLowerCase().contains(search.toLowerCase()))
                    .toList();
            return new PageImpl<>(list, pageable, list.size());
        }

        @Override
        public <S extends User> S save(S entity) {
            if (entity.getId() == null) {
                entity.setId(idGen.getAndIncrement());
            }
            if (entity.getCreatedAt() == null) {
                entity.setCreatedAt(LocalDateTime.now());
                entity.setUpdatedAt(LocalDateTime.now());
            }
            byId.put(entity.getId(), entity);
            byEmail.put(entity.getEmail().toLowerCase(), entity);
            return entity;
        }

        @Override
        public Optional<User> findById(Long aLong) {
            return Optional.ofNullable(byId.get(aLong));
        }

        @Override
        public List<User> findAll() {
            return new ArrayList<>(byId.values());
        }

        // Unused JPA methods
        @Override public boolean existsById(Long aLong) { return byId.containsKey(aLong); }
        @Override public <S extends User> List<S> saveAll(Iterable<S> entities) { return null; }
        @Override public List<User> findAllById(Iterable<Long> longs) { return null; }
        @Override public long count() { return byId.size(); }
        @Override public void deleteById(Long aLong) {}
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
        @Override public User getOne(Long aLong) { return byId.get(aLong); }
        @Override public User getById(Long aLong) { return byId.get(aLong); }
        @Override public User getReferenceById(Long aLong) { return byId.get(aLong); }
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
}
