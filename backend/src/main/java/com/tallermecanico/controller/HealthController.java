package com.tallermecanico.controller;

import com.tallermecanico.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/health")
@CrossOrigin(origins = "*")
public class HealthController {

    private final UserRepository userRepository;

    public HealthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Comprueba si la app está viva y conectada a la base de datos.
     * Abrí en el navegador: http://localhost:8080/api/health
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> check() {
        try {
            long usuarios = userRepository.count();
            return ResponseEntity.ok(Map.of(
                    "status", "ok",
                    "database", "connected",
                    "usuariosRegistrados", usuarios
            ));
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of(
                    "status", "error",
                    "database", "disconnected",
                    "mensaje", e.getMessage()
            ));
        }
    }
}
