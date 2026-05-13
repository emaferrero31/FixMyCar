package com.tallermecanico.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "citas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehiculo_id")
    private Vehiculo vehiculo;

    /** Cliente que no usa la app (solo gestión desde el taller). */
    @Column(name = "externo_nombre", length = 200)
    private String externoNombre;

    @Column(name = "externo_telefono", length = 40)
    private String externoTelefono;

    @Column(name = "externo_vehiculo", length = 255)
    private String externoVehiculo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "taller_id", nullable = false)
    private Taller taller;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoCita estado = EstadoCita.PENDIENTE;

    @Column(length = 500)
    private String descripcion;
}
