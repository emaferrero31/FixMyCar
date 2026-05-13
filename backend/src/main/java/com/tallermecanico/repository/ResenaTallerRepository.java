package com.tallermecanico.repository;

import com.tallermecanico.entity.ResenaTaller;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ResenaTallerRepository extends JpaRepository<ResenaTaller, Long> {

    Optional<ResenaTaller> findByTaller_IdAndUser_Id(Long tallerId, Long userId);

    List<ResenaTaller> findByTaller_IdOrderByUpdatedAtDesc(Long tallerId, Pageable pageable);

    @Query("SELECT r.taller.id, AVG(r.puntuacion), COUNT(r) FROM ResenaTaller r WHERE r.taller.id IN :ids GROUP BY r.taller.id")
    List<Object[]> aggregateByTallerIds(@Param("ids") Collection<Long> ids);
}
