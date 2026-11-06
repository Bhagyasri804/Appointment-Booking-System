package com.appointment.security;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenBlacklistService {

    private final Map<String, Instant> blacklistedTokens = new ConcurrentHashMap<>();

    public void blacklistToken(String token, Instant expiryInstant) {
        if (token != null && !token.isBlank()) {
            cleanExpiredTokens();
            blacklistedTokens.put(token, expiryInstant != null ? expiryInstant : Instant.now().plusSeconds(86400));
        }
    }

    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        Instant expiry = blacklistedTokens.get(token);
        if (expiry == null) {
            return false;
        }
        if (Instant.now().isAfter(expiry)) {
            blacklistedTokens.remove(token);
            return false;
        }
        return true;
    }

    private void cleanExpiredTokens() {
        if (blacklistedTokens.size() > 500) {
            Instant now = Instant.now();
            blacklistedTokens.entrySet().removeIf(entry -> now.isAfter(entry.getValue()));
        }
    }
}
