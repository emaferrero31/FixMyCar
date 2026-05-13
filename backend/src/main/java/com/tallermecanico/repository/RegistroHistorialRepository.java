package com.tallermecanico.repository;

import com.tallermecanico.entity.RegistroHistorial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RegistroHistorialRepository extends JpaRepository<RegistroHistorial, Long> {

    List<RegistroHistorial> findByVehiculo_IdOrderByFechaDesc(Long vehiculoId);
}
