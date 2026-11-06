package com.appointment.security;

import com.appointment.entity.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;
    private final String secret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private final long expiration = 3600000; // 1 hour

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(tokenProvider, "jwtSecret", secret);
        ReflectionTestUtils.setField(tokenProvider, "jwtExpirationInMs", expiration);
    }

    @Test
    @DisplayName("Should generate a valid JWT token and extract claims correctly")
    void shouldGenerateAndValidateToken() {
        UserPrincipal principal = UserPrincipal.builder()
                .id(1L)
                .fullName("John Doe")
                .email("john@example.com")
                .role(Role.CUSTOMER)
                .enabled(true)
                .build();

        String token = tokenProvider.generateToken(principal);

        assertNotNull(token);
        assertTrue(tokenProvider.validateToken(token));
        assertEquals("john@example.com", tokenProvider.getUsernameFromToken(token));
        assertEquals("CUSTOMER", tokenProvider.getRoleFromToken(token));
        assertEquals(1L, tokenProvider.getUserIdFromToken(token));
    }

    @Test
    @DisplayName("Should fail validation on invalid or tampered token")
    void shouldFailOnTamperedToken() {
        assertFalse(tokenProvider.validateToken("invalid.tampered.token"));
        assertFalse(tokenProvider.validateToken(""));
        assertFalse(tokenProvider.validateToken(null));
    }
}
