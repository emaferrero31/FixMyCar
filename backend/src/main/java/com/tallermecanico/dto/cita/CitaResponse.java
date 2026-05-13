package com.tallermecanico.dto.cita;

import com.tallermecanico.entity.EstadoCita;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CitaResponse {

    private Long id;
    private Long clienteId;
    private String clienteNombre;
    private Long vehiculoId;
    private String vehiculoMarcaModelo;
    private Long tallerId;
    private String tallerNombre;
    private LocalDateTime fechaHora;
    private EstadoCita estado;
    private String descripcion;
}
