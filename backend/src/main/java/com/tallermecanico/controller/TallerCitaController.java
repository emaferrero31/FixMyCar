package com.tallermecanico.controller;

import com.tallermecanico.dto.cita.CitaManualTallerRequest;
import com.tallermecanico.dto.cita.CitaResponse;
import com.tallermecanico.dto.cita.CompletarCitaRequest;
import com.tallermecanico.service.CitaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/talleres/{tallerId}/citas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TallerCitaController {

    private final CitaService citaService;

    @GetMapping
    public ResponseEntity<List<CitaResponse>> listar(@PathVariable Long tallerId) {
        return ResponseEntity.ok(citaService.listarPorTaller(tallerId));
    }

    @PostMapping("/manual")
    public ResponseEntity<?> crearManual(
            @PathVariable Long tallerId,
            @Valid @RequestBody CitaManualTallerRequest request) {
        try {
            CitaResponse creada = citaService.crearManualDesdeTaller(tallerId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(creada);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest().body(Map.of("message",
                    "La base de datos rechazó el turno. Suele pasar si la tabla citas aún exige cliente o vehículo obligatorios: hay que permitir NULL en cliente_id y vehiculo_id para turnos cargados solo desde el taller."));
        }
    }

    @PutMapping("/{citaId}/aceptar")
    public ResponseEntity<?> aceptar(@PathVariable Long tallerId, @PathVariable Long citaId) {
        try {
            return ResponseEntity.ok(citaService.aceptar(citaId, tallerId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{citaId}/rechazar")
    public ResponseEntity<?> rechazar(@PathVariable Long tallerId, @PathVariable Long citaId) {
        try {
            return ResponseEntity.ok(citaService.rechazar(citaId, tallerId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{citaId}/en-curso")
    public ResponseEntity<?> marcarEnCurso(@PathVariable Long tallerId, @PathVariable Long citaId) {
        try {
            return ResponseEntity.ok(citaService.marcarEnCurso(citaId, tallerId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{citaId}/completar")
    public ResponseEntity<?> completar(
            @PathVariable Long tallerId,
            @PathVariable Long citaId,
            @Valid @RequestBody CompletarCitaRequest request) {
        try {
            CitaResponse actualizada = citaService.completar(citaId, tallerId, request);
            return ResponseEntity.ok(actualizada);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
