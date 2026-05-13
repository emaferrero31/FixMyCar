package com.tallermecanico.dto.auth;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterTallerRequest {

    @NotBlank(message = "El nombre del taller es obligatorio")
    @Size(max = 150)
    private String nombreTaller;

    @NotBlank(message = "La dirección es obligatoria")
    @Size(max = 255)
    private String direccion;

    @NotBlank(message = "El teléfono es obligatorio")
    @Size(max = 30)
    private String telefono;

    @NotBlank(message = "El correo es obligatorio")
    @Email
    @Size(max = 100)
    private String email;

    @NotBlank(message = "El usuario es obligatorio")
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, max = 100)
    private String password;
}
