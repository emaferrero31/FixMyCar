package com.tallermecanico.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "registros_historial")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistroHistorial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehiculo_id", nullable = false)
    private Vehiculo vehiculo;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false, length = 1000)
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "taller_id")
    private Taller taller;

    @Column(precision = 12, scale = 2)
    private BigDecimal costo;

    @Column(name = "kilometraje_momento", length = 30)
    private String kilometrajeMomento;
}
