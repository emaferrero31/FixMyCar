package com.tallermecanico.dto.historial;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class RegistroHistorialRequest {

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;

    @NotBlank(message = "La descripción del arreglo es obligatoria")
    @Size(max = 1000)
    private String descripcion;

    private Long tallerId;

    private BigDecimal costo;

    @Size(max = 30)
    private String kilometrajeMomento;
}
