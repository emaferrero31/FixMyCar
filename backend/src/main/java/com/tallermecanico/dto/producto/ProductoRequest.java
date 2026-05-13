package com.tallermecanico.dto.producto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProductoRequest {

    @NotBlank
    @Size(max = 120)
    private String nombre;

    @Size(max = 255)
    private String descripcion;

    @Size(max = 64)
    private String categoria;

    @NotNull
    @Min(0)
    private Integer cantidad;

    @NotNull
    @Min(0)
    private Double precioUnitario;

    @Min(0)
    private Integer umbralStockBajo;
}

