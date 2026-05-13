package com.tallermecanico.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "talleres")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Taller {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "nombre_taller", nullable = false, length = 150)
    private String nombreTaller;

    @Column(nullable = false, length = 255)
    private String direccion;

    @Column(nullable = false, length = 30)
    private String telefono;

    /** JSON del perfil promocional (descripción, fotos en base64, horarios, etiquetas, etc.) */
    @Column(name = "perfil_publico_json", columnDefinition = "TEXT")
    private String perfilPublicoJson;
}
