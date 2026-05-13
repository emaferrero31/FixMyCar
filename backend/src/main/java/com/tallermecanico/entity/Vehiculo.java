package com.tallermecanico.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "vehiculos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehiculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(nullable = false, length = 60)
    private String marca;

    @Column(nullable = false, length = 60)
    private String modelo;

    @Column(name = "anio", nullable = false)
    private Integer anio;

    @Column(name = "patente", nullable = false, length = 20)
    private String patente;

    @Column(length = 40)
    private String color;

    @Column(name = "tipo_combustible", length = 30)
    private String tipoCombustible;

    @Column(name = "kilometraje", length = 30)
    private String kilometraje;

    @Column(length = 30)
    private String vin;

    /** Foto del vehículo (data URL JPEG/PNG), opcional — LONGVARCHAR → TEXT en PostgreSQL */
    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    @Column(name = "foto_data_url")
    private String fotoDataUrl;
}

