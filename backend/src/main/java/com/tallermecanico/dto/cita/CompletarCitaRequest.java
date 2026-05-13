package com.tallermecanico.dto.cita;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CompletarCitaRequest {

    @NotBlank(message = "La descripción del trabajo realizado es obligatoria")
    @Size(max = 1000)
    private String descripcion;

    private BigDecimal costo;

    @Size(max = 30)
    private String kilometrajeMomento;
}
