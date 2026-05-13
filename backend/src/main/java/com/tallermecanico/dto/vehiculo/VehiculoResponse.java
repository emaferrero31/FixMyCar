package com.tallermecanico.dto.vehiculo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehiculoResponse {

    private Long id;
    private Long clienteId;
    private Long userId;
    private String marca;
    private String modelo;
    private Integer anio;
    private String patente;
    private String color;
    private String tipoCombustible;
    private String kilometraje;
    private String vin;
    private String fotoDataUrl;
}

