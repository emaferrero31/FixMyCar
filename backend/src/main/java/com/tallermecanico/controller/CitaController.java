package com.tallermecanico.controller;

import com.tallermecanico.dto.cita.CitaRequest;
import com.tallermecanico.dto.cita.CitaResponse;
import com.tallermecanico.service.CitaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/clientes/{userId}/citas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CitaController {

    private final CitaService citaService;

    @GetMapping
    public ResponseEntity<List<CitaResponse>> listar(@PathVariable Long userId) {
        return ResponseEntity.ok(citaService.listarPorCliente(userId));
    }

    @PostMapping
    public ResponseEntity<?> crear(@PathVariable Long userId, @Valid @RequestBody CitaRequest request) {
        try {
            CitaResponse creada = citaService.crear(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(creada);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
