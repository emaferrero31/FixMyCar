package com.tallermecanico.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "productos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "taller_id", nullable = false)
    private Taller taller;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(length = 255)
    private String descripcion;

    @Column(length = 64)
    private String categoria;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(nullable = false)
    private Double precioUnitario;

    @Column
    private Integer umbralStockBajo;
}

