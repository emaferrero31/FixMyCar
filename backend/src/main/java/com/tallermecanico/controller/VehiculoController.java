package com.tallermecanico.controller;

import com.tallermecanico.dto.vehiculo.VehiculoRequest;
import com.tallermecanico.dto.vehiculo.VehiculoResponse;
import com.tallermecanico.service.VehiculoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping
@CrossOrigin(origins = "*")
public class VehiculoController {

    private final VehiculoService vehiculoService;

    public VehiculoController(VehiculoService vehiculoService) {
        this.vehiculoService = vehiculoService;
    }

    /**
     * Lista los vehículos del cliente asociado al usuario dado.
     * URL: GET /api/clientes/{userId}/vehiculos
     */
    @GetMapping("/clientes/{userId}/vehiculos")
    public ResponseEntity<List<VehiculoResponse>> listarPorUsuario(@PathVariable Long userId) {
        List<VehiculoResponse> lista = vehiculoService.listarPorUserId(userId);
        return ResponseEntity.ok(lista);
    }

    /**
     * Crea un vehículo para el cliente asociado al usuario dado.
     * URL: POST /api/clientes/{userId}/vehiculos
     */
    @PostMapping("/clientes/{userId}/vehiculos")
    public ResponseEntity<?> crear(@PathVariable Long userId, @Valid @RequestBody VehiculoRequest request) {
        try {
            VehiculoResponse creado = vehiculoService.crearParaUser(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(creado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Actualiza un vehículo existente.
     * URL: PUT /api/vehiculos/{id}
     */
    @PutMapping("/vehiculos/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @Valid @RequestBody VehiculoRequest request) {
        try {
            VehiculoResponse actualizado = vehiculoService.actualizar(id, request);
            return ResponseEntity.ok(actualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Elimina un vehículo.
     * URL: DELETE /api/vehiculos/{id}
     */
    @DeleteMapping("/vehiculos/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            vehiculoService.eliminar(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}

