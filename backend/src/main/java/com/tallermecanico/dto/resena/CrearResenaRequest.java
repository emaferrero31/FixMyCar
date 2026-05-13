package com.tallermecanico.dto.resena;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CrearResenaRequest {

    @NotNull(message = "El usuario es obligatorio")
    private Long userId;

    @NotNull(message = "La puntuación es obligatoria")
    @Min(value = 1, message = "La puntuación mínima es 1")
    @Max(value = 5, message = "La puntuación máxima es 5")
    private Integer puntuacion;

    @Size(max = 2000, message = "El comentario no puede superar los 2000 caracteres")
    private String comentario;
}
