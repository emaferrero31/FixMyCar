package com.tallermecanico.dto.taller;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TallerUpdateRequest {

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
    @Email(message = "Correo inválido")
    @Size(max = 100)
    private String email;
}
