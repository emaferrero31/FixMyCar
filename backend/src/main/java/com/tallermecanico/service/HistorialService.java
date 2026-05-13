package com.tallermecanico.service;

import com.tallermecanico.dto.historial.RegistroHistorialRequest;
import com.tallermecanico.dto.historial.RegistroHistorialResponse;
import com.tallermecanico.entity.RegistroHistorial;
import com.tallermecanico.entity.Taller;
import com.tallermecanico.entity.Vehiculo;
import com.tallermecanico.repository.RegistroHistorialRepository;
import com.tallermecanico.repository.VehiculoRepository;
import com.tallermecanico.repository.TallerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HistorialService {

    private final RegistroHistorialRepository registroHistorialRepository;
    private final VehiculoRepository vehiculoRepository;
    private final TallerRepository tallerRepository;

    @Transactional(readOnly = true)
    public List<RegistroHistorialResponse> listarPorVehiculo(Long vehiculoId, Long userId) {
        Vehiculo v = vehiculoRepository.findById(vehiculoId)
                .orElseThrow(() -> new IllegalArgumentException("Vehículo no encontrado"));
        if (!v.getCliente().getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("No tenés acceso a este vehículo");
        }
        return registroHistorialRepository.findByVehiculo_IdOrderByFechaDesc(vehiculoId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public RegistroHistorialResponse crear(Long vehiculoId, Long userId, RegistroHistorialRequest request) {
        Vehiculo v = vehiculoRepository.findById(vehiculoId)
                .orElseThrow(() -> new IllegalArgumentException("Vehículo no encontrado"));
        if (!v.getCliente().getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("No tenés acceso a este vehículo");
        }

        Taller taller = null;
        if (request.getTallerId() != null) {
            taller = tallerRepository.findById(request.getTallerId()).orElse(null);
        }

        RegistroHistorial reg = RegistroHistorial.builder()
                .vehiculo(v)
                .fecha(request.getFecha())
                .descripcion(request.getDescripcion().trim())
                .taller(taller)
                .costo(request.getCosto())
                .kilometrajeMomento(request.getKilometrajeMomento() != null ? request.getKilometrajeMomento().trim() : null)
                .build();
        reg = registroHistorialRepository.save(reg);
        return toResponse(reg);
    }

    private RegistroHistorialResponse toResponse(RegistroHistorial r) {
        return RegistroHistorialResponse.builder()
                .id(r.getId())
                .vehiculoId(r.getVehiculo().getId())
                .fecha(r.getFecha())
                .descripcion(r.getDescripcion())
                .tallerId(r.getTaller() != null ? r.getTaller().getId() : null)
                .tallerNombre(r.getTaller() != null ? r.getTaller().getNombreTaller() : null)
                .costo(r.getCosto())
                .kilometrajeMomento(r.getKilometrajeMomento())
                .build();
    }
}
