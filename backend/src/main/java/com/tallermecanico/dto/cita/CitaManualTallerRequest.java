package com.tallermecanico.dto.cita;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CitaManualTallerRequest {

    @NotBlank
    @Size(max = 200)
    private String nombreCliente;

    @Size(max = 40)
    private String telefono;

    /**
     * Texto libre: marca, modelo, patente, etc. (cliente sin registro en la app).
     */
    @NotBlank
    @Size(max = 255)
    private String vehiculoTexto;

    @NotNull
    private LocalDateTime fechaHora;

    @Size(max = 500)
    private String descripcion;
}
