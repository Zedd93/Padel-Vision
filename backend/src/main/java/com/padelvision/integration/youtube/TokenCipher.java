package com.padelvision.integration.youtube;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Szyfrowanie tokenów OAuth przed zapisem do bazy (AES-256-GCM).
 * <p>
 * Format szyfrogramu: {@code base64(iv[12] || ciphertext || tag[16])}.
 * Każde wywołanie {@link #encrypt} losuje nowy IV, więc ten sam token
 * daje za każdym razem inny szyfrogram.
 * <p>
 * Klucz pochodzi z {@code YOUTUBE_TOKEN_ENC_KEY}. Jego utrata oznacza,
 * że wszystkie kluby muszą przejść OAuth od nowa.
 */
@Component
@RequiredArgsConstructor
public class TokenCipher {

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH_BITS = 128;
    private static final int KEY_LENGTH_BYTES = 32;

    private final YouTubeProperties properties;
    private final SecureRandom random = new SecureRandom();

    private volatile SecretKey cachedKey;

    public String encrypt(String plaintext) {
        if (plaintext == null) {
            return null;
        }
        try {
            byte[] iv = new byte[IV_LENGTH];
            random.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, key(), new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            byte[] combined = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            // Komunikat bez treści tokenu — wyjątki szyfrowania trafiają do logów.
            throw new IllegalStateException("Nie udało się zaszyfrować tokenu YouTube", e);
        }
    }

    public String decrypt(String ciphertext) {
        if (ciphertext == null) {
            return null;
        }
        try {
            byte[] combined = Base64.getDecoder().decode(ciphertext);
            if (combined.length <= IV_LENGTH) {
                throw new IllegalStateException("Szyfrogram tokenu YouTube jest uszkodzony");
            }

            byte[] iv = new byte[IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, IV_LENGTH);
            byte[] encrypted = new byte[combined.length - IV_LENGTH];
            System.arraycopy(combined, IV_LENGTH, encrypted, 0, encrypted.length);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(TAG_LENGTH_BITS, iv));

            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException(
                    "Nie udało się odszyfrować tokenu YouTube — sprawdź, czy YOUTUBE_TOKEN_ENC_KEY "
                            + "to ten sam klucz, którym token był szyfrowany", e);
        }
    }

    private SecretKey key() {
        SecretKey key = cachedKey;
        if (key != null) {
            return key;
        }

        String encoded = properties.getTokenEncKey();
        if (encoded == null || encoded.isBlank()) {
            throw new IllegalStateException(
                    "Brak YOUTUBE_TOKEN_ENC_KEY — wygeneruj klucz: openssl rand -base64 32 "
                            + "(patrz docs/YOUTUBE_SETUP.md krok 5)");
        }

        byte[] raw;
        try {
            raw = Base64.getDecoder().decode(encoded.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("YOUTUBE_TOKEN_ENC_KEY nie jest poprawnym base64", e);
        }
        if (raw.length != KEY_LENGTH_BYTES) {
            throw new IllegalStateException(
                    "YOUTUBE_TOKEN_ENC_KEY musi mieć 32 bajty po zdekodowaniu base64, ma " + raw.length);
        }

        key = new SecretKeySpec(raw, ALGORITHM);
        cachedKey = key;
        return key;
    }
}
