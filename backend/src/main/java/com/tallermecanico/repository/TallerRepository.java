package com.tallermecanico.repository;

import com.tallermecanico.entity.Taller;
import com.tallermecanico.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TallerRepository extends JpaRepository<Taller, Long> {

    Optional<Taller> findByUser(User user);

    Optional<Taller> findByUser_Id(Long userId);
}
