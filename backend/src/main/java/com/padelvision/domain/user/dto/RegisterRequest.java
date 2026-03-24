package com.padelvision.domain.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Adres email jest wymagany")
    @Email(message = "Nieprawidlowy format adresu email")
    private String email;

    @NotBlank(message = "Nazwa uzytkownika jest wymagana")
    @Size(min = 3, max = 30, message = "Nazwa uzytkownika musi miec od 3 do 30 znakow")
    private String username;

    @NotBlank(message = "Haslo jest wymagane")
    @Size(min = 8, message = "Haslo musi miec co najmniej 8 znakow")
    private String password;

    private String name;
}
