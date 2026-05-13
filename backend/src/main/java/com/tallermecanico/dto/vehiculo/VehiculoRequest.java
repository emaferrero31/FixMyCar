package com.tallermecanico.dto.vehiculo;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VehiculoRequest {

    @NotBlank
    @Size(max = 60)
    private String marca;

    @NotBlank
    @Size(max = 60)
    private String modelo;

    @NotNull
    @Min(1900)
    @Max(2100)
    private Integer anio;

    @NotBlank
    @Size(max = 20)
    private String patente;

    @NotBlank
    @Size(max = 40)
    private String color;

    @NotBlank
    @Size(max = 30)
    private String tipoCombustible;

    @NotBlank
    @Size(max = 30)
    private String kilometraje;

    @Size(max = 30)
    private String vin;

    /** Data URL de imagen (opcional). Límite alto: comprimimos en cliente; BD en TEXT */
    @Size(max = 6_000_000)
    private String fotoDataUrl;
}

