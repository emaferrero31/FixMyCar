package com.tallermecanico.dto.auth;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterClienteRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100)
    private String nombre;

    @NotBlank(message = "El apellido es obligatorio")
    @Size(max = 100)
    private String apellido;

    @NotBlank(message = "El correo es obligatorio")
    @Email
    @Size(max = 100)
    private String email;

    @Size(max = 30)
    private String telefono;

    @NotBlank(message = "El usuario es obligatorio")
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, max = 100)
    private String password;
}
