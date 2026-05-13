package com.tallermecanico.repository;

import com.tallermecanico.entity.Cliente;
import com.tallermecanico.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Optional<Cliente> findByUser(User user);

    Optional<Cliente> findByUser_Id(Long userId);
}
