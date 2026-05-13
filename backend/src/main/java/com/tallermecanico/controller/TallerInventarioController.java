package com.tallermecanico.controller;

import com.tallermecanico.dto.producto.ProductoRequest;
import com.tallermecanico.dto.producto.ProductoResponse;
import com.tallermecanico.service.ProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/talleres/{tallerId}/inventario")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TallerInventarioController {

    private final ProductoService productoService;

    @GetMapping
    public ResponseEntity<List<ProductoResponse>> listar(@PathVariable Long tallerId) {
        return ResponseEntity.ok(productoService.listarPorTaller(tallerId));
    }

    @PostMapping
    public ResponseEntity<?> crear(
            @PathVariable Long tallerId,
            @Valid @RequestBody ProductoRequest request
    ) {
        try {
            ProductoResponse creado = productoService.crearParaTaller(tallerId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(creado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{productoId}")
    public ResponseEntity<?> actualizar(
            @PathVariable Long tallerId,
            @PathVariable Long productoId,
            @Valid @RequestBody ProductoRequest request
    ) {
        try {
            ProductoResponse actualizado = productoService.actualizar(productoId, tallerId, request);
            return ResponseEntity.ok(actualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{productoId}")
    public ResponseEntity<?> eliminar(
            @PathVariable Long tallerId,
            @PathVariable Long productoId
    ) {
        try {
            productoService.eliminar(productoId, tallerId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}

