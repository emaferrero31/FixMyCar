package com.tallermecanico.repository;

import com.tallermecanico.entity.Cita;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CitaRepository extends JpaRepository<Cita, Long> {

    List<Cita> findByCliente_User_IdOrderByFechaHoraDesc(Long userId);

    List<Cita> findByTaller_IdOrderByFechaHoraDesc(Long tallerId);
}
