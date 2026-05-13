package com.tallermecanico.dto.taller;

import com.tallermecanico.dto.resena.ResenaResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TallerPublicoResponse {

    private Long id;
    private String nombreTaller;
    private String direccion;
    private String telefono;
    private String email;

    private Double puntuacionPromedio;
    private Integer cantidadResenas;

    /** JSON del perfil (mismo formato que guarda el taller en edición) */
    private String perfilPublicoJson;

    private List<ResenaResponse> resenas;
}
