package com.tallermecanico.config;

import com.tallermecanico.entity.Role;
import com.tallermecanico.entity.Taller;
import com.tallermecanico.entity.User;
import com.tallermecanico.repository.TallerRepository;
import com.tallermecanico.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Crea talleres de prueba para listar desde el lado cliente (búsqueda / turnos).
 * Activar con {@code app.seed-demo-talleres=true} (por defecto en perfil {@code dev}).
 */
@Component
@Order(20)
@ConditionalOnProperty(prefix = "app", name = "seed-demo-talleres", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class DemoTalleresSeeder implements ApplicationRunner {

    private static final String DEMO_PASSWORD = "Demo1234";

    private final UserRepository userRepository;
    private final TallerRepository tallerRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedSiNoExiste(
                "taller_demo_norte",
                "taller.demo.norte@demo.fixmycar.local",
                "Taller Demo Norte",
                "Av. Cabildo 2800, CABA",
                "+54 11 4000-1111");
        seedSiNoExiste(
                "taller_demo_sur",
                "taller.demo.sur@demo.fixmycar.local",
                "Mecánica Sur — Demo",
                "Av. Corrientes 5100, CABA",
                "+54 11 4000-2222");
        seedSiNoExiste(
                "taller_demo_cordoba",
                "taller.demo.cordoba@demo.fixmycar.local",
                "Taller Demo Córdoba — Ezeiza",
                "Gabino Ezeiza 4300, Córdoba, Argentina",
                "+54 351 4000-3333");
    }

    private void seedSiNoExiste(String username, String email, String nombreTaller, String direccion, String telefono) {
        if (userRepository.existsByUsername(username)) {
            return;
        }
        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(DEMO_PASSWORD))
                .email(email)
                .role(Role.TALLER)
                .enabled(true)
                .build();
        user = userRepository.save(user);

        Taller taller = Taller.builder()
                .user(user)
                .nombreTaller(nombreTaller)
                .direccion(direccion)
                .telefono(telefono)
                .build();
        tallerRepository.save(taller);

        log.info("Demo taller creado: usuario=\"{}\" contraseña=\"{}\" | {}", username, DEMO_PASSWORD, nombreTaller);
    }
}
