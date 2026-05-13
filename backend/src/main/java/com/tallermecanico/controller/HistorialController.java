package com.tallermecanico.controller;

import com.tallermecanico.dto.historial.RegistroHistorialResponse;
import com.tallermecanico.service.HistorialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * El cliente solo puede consultar el historial.
 * Los registros se agregan desde el taller al marcar una cita como completada.
 */
@RestController
@RequestMapping("/clientes/{userId}/vehiculos/{vehiculoId}/historial")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HistorialController {

    private final HistorialService historialService;

    @GetMapping
    public ResponseEntity<?> listar(@PathVariable Long userId, @PathVariable Long vehiculoId) {
        try {
            List<RegistroHistorialResponse> lista = historialService.listarPorVehiculo(vehiculoId, userId);
            return ResponseEntity.ok(lista);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
