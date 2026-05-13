package com.tallermecanico.service;

import com.tallermecanico.dto.cita.CitaManualTallerRequest;
import com.tallermecanico.dto.cita.CitaRequest;
import com.tallermecanico.dto.cita.CitaResponse;
import com.tallermecanico.dto.cita.CompletarCitaRequest;
import com.tallermecanico.entity.Cita;
import com.tallermecanico.entity.Cliente;
import com.tallermecanico.entity.EstadoCita;
import com.tallermecanico.entity.RegistroHistorial;
import com.tallermecanico.entity.Taller;
import com.tallermecanico.entity.Vehiculo;
import com.tallermecanico.repository.ClienteRepository;
import com.tallermecanico.repository.CitaRepository;
import com.tallermecanico.repository.RegistroHistorialRepository;
import com.tallermecanico.repository.TallerRepository;
import com.tallermecanico.repository.VehiculoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CitaService {

    private final CitaRepository citaRepository;
    private final ClienteRepository clienteRepository;
    private final VehiculoRepository vehiculoRepository;
    private final TallerRepository tallerRepository;
    private final RegistroHistorialRepository registroHistorialRepository;

    @Transactional(readOnly = true)
    public List<CitaResponse> listarPorCliente(Long userId) {
        List<Cita> citas = citaRepository.findByCliente_User_IdOrderByFechaHoraDesc(userId);
        return citas.stream().map(this::toResponse).toList();
    }

    @Transactional
    public CitaResponse crear(Long userId, CitaRequest request) {
        Cliente cliente = clienteRepository.findByUser_Id(userId)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));

        Vehiculo vehiculo = vehiculoRepository.findById(request.getVehiculoId())
                .orElseThrow(() -> new IllegalArgumentException("Vehículo no encontrado"));
        if (!vehiculo.getCliente().getId().equals(cliente.getId())) {
            throw new IllegalArgumentException("El vehículo no pertenece al cliente");
        }

        Taller taller = tallerRepository.findById(request.getTallerId())
                .orElseThrow(() -> new IllegalArgumentException("Taller no encontrado"));

        Cita cita = Cita.builder()
                .cliente(cliente)
                .vehiculo(vehiculo)
                .taller(taller)
                .fechaHora(request.getFechaHora())
                .estado(EstadoCita.PENDIENTE)
                .descripcion(request.getDescripcion() != null ? request.getDescripcion().trim() : null)
                .build();
        cita = citaRepository.save(cita);
        return toResponse(cita);
    }

    @Transactional
    public CitaResponse aceptar(Long citaId, Long tallerId) {
        Cita cita = citaRepository.findById(citaId)
                .orElseThrow(() -> new IllegalArgumentException("Cita no encontrada"));
        if (!cita.getTaller().getId().equals(tallerId)) {
            throw new IllegalArgumentException("La cita no pertenece a este taller");
        }
        if (cita.getEstado() != EstadoCita.PENDIENTE) {
            throw new IllegalArgumentException("Solo se pueden aceptar citas pendientes");
        }
        cita.setEstado(EstadoCita.CONFIRMADA);
        cita = citaRepository.save(cita);
        return toResponse(cita);
    }

    @Transactional
    public CitaResponse rechazar(Long citaId, Long tallerId) {
        Cita cita = citaRepository.findById(citaId)
                .orElseThrow(() -> new IllegalArgumentException("Cita no encontrada"));
        if (!cita.getTaller().getId().equals(tallerId)) {
            throw new IllegalArgumentException("La cita no pertenece a este taller");
        }
        if (cita.getEstado() != EstadoCita.PENDIENTE) {
            throw new IllegalArgumentException("Solo se pueden rechazar citas pendientes");
        }
        cita.setEstado(EstadoCita.CANCELADA);
        cita = citaRepository.save(cita);
        return toResponse(cita);
    }

    /**
     * El taller marca que el vehículo está en el taller / trabajo iniciado.
     * Solo desde CONFIRMADA → EN_CURSO (visible en el tablero del cliente).
     */
    @Transactional
    public CitaResponse marcarEnCurso(Long citaId, Long tallerId) {
        Cita cita = citaRepository.findById(citaId)
                .orElseThrow(() -> new IllegalArgumentException("Cita no encontrada"));
        if (!cita.getTaller().getId().equals(tallerId)) {
            throw new IllegalArgumentException("La cita no pertenece a este taller");
        }
        if (cita.getEstado() != EstadoCita.CONFIRMADA) {
            throw new IllegalArgumentException("Solo se puede pasar a en curso una cita confirmada");
        }
        cita.setEstado(EstadoCita.EN_CURSO);
        cita = citaRepository.save(cita);
        return toResponse(cita);
    }

    @Transactional(readOnly = true)
    public List<CitaResponse> listarPorTaller(Long tallerId) {
        List<Cita> citas = citaRepository.findByTaller_IdOrderByFechaHoraDesc(tallerId);
        return citas.stream().map(this::toResponse).toList();
    }

    @Transactional
    public CitaResponse completar(Long citaId, Long tallerId, CompletarCitaRequest request) {
        Cita cita = citaRepository.findById(citaId)
                .orElseThrow(() -> new IllegalArgumentException("Cita no encontrada"));
        if (!cita.getTaller().getId().equals(tallerId)) {
            throw new IllegalArgumentException("La cita no pertenece a este taller");
        }
        if (cita.getEstado() == EstadoCita.COMPLETADA) {
            throw new IllegalArgumentException("Esta cita ya está completada");
        }
        if (cita.getEstado() == EstadoCita.PENDIENTE) {
            throw new IllegalArgumentException("Debe aceptar la cita antes de completarla");
        }
        if (cita.getEstado() == EstadoCita.CANCELADA) {
            throw new IllegalArgumentException("No se puede completar una cita cancelada");
        }

        cita.setEstado(EstadoCita.COMPLETADA);
        citaRepository.save(cita);

        if (cita.getVehiculo() != null) {
            RegistroHistorial reg = RegistroHistorial.builder()
                    .vehiculo(cita.getVehiculo())
                    .fecha(LocalDate.now())
                    .descripcion(request.getDescripcion().trim())
                    .taller(cita.getTaller())
                    .costo(request.getCosto())
                    .kilometrajeMomento(request.getKilometrajeMomento() != null ? request.getKilometrajeMomento().trim() : null)
                    .build();
            registroHistorialRepository.save(reg);
        }

        return toResponse(cita);
    }

    /**
     * Turno cargado solo desde el taller (cliente sin cuenta en la app).
     * Queda confirmado para poder usar En curso / Completar sin pasar por aceptar.
     */
    @Transactional
    public CitaResponse crearManualDesdeTaller(Long tallerId, CitaManualTallerRequest request) {
        Taller taller = tallerRepository.findById(tallerId)
                .orElseThrow(() -> new IllegalArgumentException("Taller no encontrado"));

        Cita cita = Cita.builder()
                .taller(taller)
                .fechaHora(request.getFechaHora())
                .estado(EstadoCita.CONFIRMADA)
                .descripcion(request.getDescripcion() != null ? request.getDescripcion().trim() : null)
                .externoNombre(request.getNombreCliente().trim())
                .externoTelefono(request.getTelefono() != null ? request.getTelefono().trim() : null)
                .externoVehiculo(request.getVehiculoTexto().trim())
                .build();
        cita = citaRepository.save(cita);
        return toResponse(cita);
    }

    private CitaResponse toResponse(Cita c) {
        Long clienteId = null;
        String clienteNombre;
        Long vehiculoId = null;
        String vehiculoMarcaModelo;

        if (c.getCliente() != null) {
            clienteId = c.getCliente().getId();
            clienteNombre = c.getCliente().getNombre() + " " + c.getCliente().getApellido();
        } else {
            clienteNombre = c.getExternoNombre() != null ? c.getExternoNombre() : "";
        }

        if (c.getVehiculo() != null) {
            vehiculoId = c.getVehiculo().getId();
            vehiculoMarcaModelo = c.getVehiculo().getMarca() + " " + c.getVehiculo().getModelo();
        } else {
            vehiculoMarcaModelo = c.getExternoVehiculo() != null ? c.getExternoVehiculo() : "";
        }

        return CitaResponse.builder()
                .id(c.getId())
                .clienteId(clienteId)
                .clienteNombre(clienteNombre)
                .vehiculoId(vehiculoId)
                .vehiculoMarcaModelo(vehiculoMarcaModelo)
                .tallerId(c.getTaller().getId())
                .tallerNombre(c.getTaller().getNombreTaller())
                .fechaHora(c.getFechaHora())
                .estado(c.getEstado())
                .descripcion(c.getDescripcion())
                .build();
    }
}
