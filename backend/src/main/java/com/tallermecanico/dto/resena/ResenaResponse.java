package com.tallermecanico.dto.resena;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResenaResponse {

    private Long id;
    private Integer puntuacion;
    private String comentario;
    private Instant fecha;
    private String autorNombre;
    /** Id del usuario cliente (para que el front reconozca la reseña propia) */
    private Long usuarioId;
}
