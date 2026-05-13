package com.tallermecanico.dto.auth;

import com.tallermecanico.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private Long id;
    private String username;
    private String email;
    private Role role;
    /** Nombre para mostrar: "Nombre Apellido" (cliente) o nombre del taller */
    private String nombre;
    /** Solo para role TALLER: id del taller (para llamar a /api/talleres/{tallerId}/...) */
    private Long tallerId;
}
