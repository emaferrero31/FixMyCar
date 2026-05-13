package com.tallermecanico.controller;

import com.tallermecanico.dto.resena.CrearResenaRequest;
import com.tallermecanico.dto.taller.TallerPerfilPublicoRequest;
import com.tallermecanico.dto.taller.TallerResponse;
import com.tallermecanico.dto.taller.TallerUpdateRequest;
import com.tallermecanico.service.TallerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/talleres")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TallerController {

    private final TallerService tallerService;

    @GetMapping
    public ResponseEntity<List<TallerResponse>> listar(
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) String direccion,
            @RequestParam(required = false, defaultValue = "nombre") String orden) {
        List<TallerResponse> lista = tallerService.listar(nombre, direccion, orden);
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/{tallerId}/publico")
    public ResponseEntity<?> obtenerPublico(@PathVariable Long tallerId) {
        try {
            return ResponseEntity.ok(tallerService.obtenerPublico(tallerId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{tallerId}/resenas")
    public ResponseEntity<?> crearResena(
            @PathVariable Long tallerId,
            @Valid @RequestBody CrearResenaRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(tallerService.crearOActualizarResena(tallerId, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{tallerId}/perfil-publico")
    public ResponseEntity<?> actualizarPerfilPublico(
            @PathVariable Long tallerId,
            @Valid @RequestBody TallerPerfilPublicoRequest request) {
        try {
            tallerService.actualizarPerfilPublico(tallerId, request);
            return ResponseEntity.ok(Map.of("message", "Perfil público actualizado"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{tallerId}")
    public ResponseEntity<?> obtener(@PathVariable Long tallerId) {
        try {
            return ResponseEntity.ok(tallerService.obtenerPorId(tallerId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{tallerId}")
    public ResponseEntity<?> actualizar(
            @PathVariable Long tallerId,
            @Valid @RequestBody TallerUpdateRequest request) {
        try {
            return ResponseEntity.ok(tallerService.actualizar(tallerId, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
