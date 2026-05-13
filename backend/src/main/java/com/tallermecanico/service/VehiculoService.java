package com.tallermecanico.service;

import com.tallermecanico.dto.vehiculo.VehiculoRequest;
import com.tallermecanico.dto.vehiculo.VehiculoResponse;
import com.tallermecanico.entity.Cliente;
import com.tallermecanico.entity.Vehiculo;
import com.tallermecanico.repository.ClienteRepository;
import com.tallermecanico.repository.VehiculoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VehiculoService {

    private final VehiculoRepository vehiculoRepository;
    private final ClienteRepository clienteRepository;

    public VehiculoService(VehiculoRepository vehiculoRepository, ClienteRepository clienteRepository) {
        this.vehiculoRepository = vehiculoRepository;
        this.clienteRepository = clienteRepository;
    }

    @Transactional(readOnly = true)
    public List<VehiculoResponse> listarPorUserId(Long userId) {
        List<Vehiculo> vehiculos = vehiculoRepository.findByCliente_User_Id(userId);
        return vehiculos.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public VehiculoResponse crearParaUser(Long userId, VehiculoRequest request) {
        Cliente cliente = clienteRepository.findByUser_Id(userId)
                .orElseThrow(() -> new IllegalArgumentException("No se encontró el cliente para el usuario indicado"));

        Vehiculo vehiculo = new Vehiculo();
        vehiculo.setCliente(cliente);
        aplicarDatos(vehiculo, request);

        Vehiculo guardado = vehiculoRepository.save(vehiculo);
        return toResponse(guardado);
    }

    @Transactional
    public VehiculoResponse actualizar(Long vehiculoId, VehiculoRequest request) {
        Vehiculo vehiculo = vehiculoRepository.findById(vehiculoId)
                .orElseThrow(() -> new IllegalArgumentException("Vehículo no encontrado"));

        aplicarDatos(vehiculo, request);
        Vehiculo guardado = vehiculoRepository.save(vehiculo);
        return toResponse(guardado);
    }

    @Transactional
    public void eliminar(Long vehiculoId) {
        if (!vehiculoRepository.existsById(vehiculoId)) {
            throw new IllegalArgumentException("Vehículo no encontrado");
        }
        vehiculoRepository.deleteById(vehiculoId);
    }

    private void aplicarDatos(Vehiculo vehiculo, VehiculoRequest request) {
        vehiculo.setMarca(request.getMarca().trim());
        vehiculo.setModelo(request.getModelo().trim());
        vehiculo.setAnio(request.getAnio());
        vehiculo.setPatente(request.getPatente().trim());
        vehiculo.setColor(request.getColor().trim());
        vehiculo.setTipoCombustible(request.getTipoCombustible().trim());
        vehiculo.setKilometraje(request.getKilometraje().trim());
        vehiculo.setVin(request.getVin() != null ? request.getVin().trim() : null);
        if (request.getFotoDataUrl() != null) {
            String f = request.getFotoDataUrl().trim();
            vehiculo.setFotoDataUrl(f.isEmpty() ? null : f);
        }
        /* Si fotoDataUrl no viene en el JSON (null), no se modifica la foto guardada (compat. clientes viejos) */
    }

    private VehiculoResponse toResponse(Vehiculo v) {
        return VehiculoResponse.builder()
                .id(v.getId())
                .clienteId(v.getCliente().getId())
                .userId(v.getCliente().getUser().getId())
                .marca(v.getMarca())
                .modelo(v.getModelo())
                .anio(v.getAnio())
                .patente(v.getPatente())
                .color(v.getColor())
                .tipoCombustible(v.getTipoCombustible())
                .kilometraje(v.getKilometraje())
                .vin(v.getVin())
                .fotoDataUrl(v.getFotoDataUrl())
                .build();
    }
}

