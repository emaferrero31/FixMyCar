package com.tallermecanico.dto.cita;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CitaRequest {

    @NotNull(message = "El vehículo es obligatorio")
    private Long vehiculoId;

    @NotNull(message = "El taller es obligatorio")
    private Long tallerId;

    @NotNull(message = "La fecha y hora son obligatorias")
    private LocalDateTime fechaHora;

    @Size(max = 500)
    private String descripcion;
}
