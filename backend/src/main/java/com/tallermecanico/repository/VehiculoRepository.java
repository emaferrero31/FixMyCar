package com.tallermecanico.repository;

import com.tallermecanico.entity.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {

    List<Vehiculo> findByCliente_Id(Long clienteId);

    List<Vehiculo> findByCliente_User_Id(Long userId);
}

