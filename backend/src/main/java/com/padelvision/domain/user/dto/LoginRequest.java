package com.padelvision.domain.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Adres email jest wymagany")
    @Email(message = "Nieprawidlowy format adresu email")
    private String email;

    @NotBlank(message = "Haslo jest wymagane")
    @Size(min = 8, message = "Haslo musi miec co najmniej 8 znakow")
    private String password;
}
