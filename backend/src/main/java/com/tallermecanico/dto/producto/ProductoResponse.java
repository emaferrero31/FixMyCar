package com.tallermecanico.dto.producto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductoResponse {

    private Long id;
    private Long tallerId;
    private String nombre;
    private String descripcion;
    private String categoria;
    private Integer cantidad;
    private Double precioUnitario;
    private Integer umbralStockBajo;
}

