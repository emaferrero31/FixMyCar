package com.tallermecanico.dto.taller;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TallerPerfilPublicoRequest {

    /** Objeto promo serializado como string JSON (puede incluir imágenes base64) */
    @Size(max = 5_000_000)
    private String perfilJson;
}
