package com.tallermecanico.dto.taller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TallerResponse {

    private Long id;
    private String nombreTaller;
    private String direccion;
    private String telefono;
    private String email;
    /** Usuario de acceso a la cuenta del taller */
    private String username;

    /** Promedio de reseñas (1–5), 0 si aún no hay valoraciones */
    private Double puntuacionPromedio;

    /** Cantidad de reseñas registradas */
    private Integer cantidadResenas;

    /** Perfil promocional serializado (JSON) para el taller dueño / ficha pública */
    private String perfilPublicoJson;

    /**
     * Logo del taller extraído del perfil (data URL imagen). En el listado se envía sin el JSON completo.
     */
    private String logoDataUrl;
}
