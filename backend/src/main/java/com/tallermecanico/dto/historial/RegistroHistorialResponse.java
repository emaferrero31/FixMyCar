package com.tallermecanico.dto.historial;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistroHistorialResponse {

    private Long id;
    private Long vehiculoId;
    private LocalDate fecha;
    private String descripcion;
    private Long tallerId;
    private String tallerNombre;
    private BigDecimal costo;
    private String kilometrajeMomento;
}
