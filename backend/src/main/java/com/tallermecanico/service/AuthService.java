package com.tallermecanico.service;

import com.tallermecanico.dto.auth.*;
import com.tallermecanico.entity.Cliente;
import com.tallermecanico.entity.Role;
import com.tallermecanico.entity.Taller;
import com.tallermecanico.entity.User;
import com.tallermecanico.repository.ClienteRepository;
import com.tallermecanico.repository.TallerRepository;
import com.tallermecanico.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

@Service
@Slf4j
public class AuthService {

    private static final int RESET_TOKEN_VALIDITY_HOURS = 24;
    private static final int RESET_TOKEN_BYTES = 32;

    private final UserRepository userRepository;
    private final ClienteRepository clienteRepository;
    private final TallerRepository tallerRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public AuthService(UserRepository userRepository, ClienteRepository clienteRepository,
                       TallerRepository tallerRepository, org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.clienteRepository = clienteRepository;
        this.tallerRepository = tallerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Value("${app.frontend-url:http://localhost:5500}")
    private String frontendUrl;

    @Value("${app.mail.from:noreply@fixmycar.com}")
    private String mailFrom;

    @Transactional
    public AuthResponse registerCliente(RegisterClienteRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new IllegalArgumentException("El nombre de usuario ya está en uso");
        }
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("El correo ya está registrado");
        }

        User user = User.builder()
                .username(req.getUsername())
                .password(passwordEncoder.encode(req.getPassword()))
                .email(req.getEmail().trim().toLowerCase())
                .role(Role.CLIENTE)
                .enabled(true)
                .build();

        user = userRepository.save(user);

        Cliente cliente = Cliente.builder()
                .user(user)
                .nombre(req.getNombre().trim())
                .apellido(req.getApellido().trim())
                .telefono(req.getTelefono() != null ? req.getTelefono().trim() : null)
                .build();

        clienteRepository.save(cliente);

        String nombre = req.getNombre() + " " + req.getApellido();
        return AuthResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .nombre(nombre)
                .build();
    }

    @Transactional
    public AuthResponse registerTaller(RegisterTallerRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new IllegalArgumentException("El nombre de usuario ya está en uso");
        }
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("El correo ya está registrado");
        }

        User user = User.builder()
                .username(req.getUsername())
                .password(passwordEncoder.encode(req.getPassword()))
                .email(req.getEmail().trim().toLowerCase())
                .role(Role.TALLER)
                .enabled(true)
                .build();

        user = userRepository.save(user);

        Taller taller = Taller.builder()
                .user(user)
                .nombreTaller(req.getNombreTaller().trim())
                .direccion(req.getDireccion().trim())
                .telefono(req.getTelefono().trim())
                .build();

        taller = tallerRepository.save(taller);

        return AuthResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .nombre(req.getNombreTaller())
                .tallerId(taller.getId())
                .build();
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Usuario o contraseña incorrectos"));

        if (!user.getEnabled()) {
            throw new IllegalArgumentException("La cuenta está deshabilitada");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Usuario o contraseña incorrectos");
        }

        String nombre;
        Long tallerId = null;
        if (user.getRole() == Role.CLIENTE) {
            nombre = clienteRepository.findByUser_Id(user.getId()).map(c -> c.getNombre() + " " + c.getApellido()).orElse(user.getUsername());
        } else {
            var optTaller = tallerRepository.findByUser_Id(user.getId());
            nombre = optTaller.map(Taller::getNombreTaller).orElse(user.getUsername());
            tallerId = optTaller.map(Taller::getId).orElse(null);
        }

        return AuthResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .nombre(nombre)
                .tallerId(tallerId)
                .build();
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        Optional<User> optUser = userRepository.findByEmail(email);

        if (optUser.isEmpty()) {
            log.warn("Recuperación de contraseña solicitada para email no registrado: {}", email);
            return;
        }

        User user = optUser.get();
        String token = generateResetToken();
        user.setResetToken(token);
        user.setResetTokenExpiry(Instant.now().plusSeconds(RESET_TOKEN_VALIDITY_HOURS * 3600L));
        userRepository.save(user);

        String link = frontendUrl + "/reset-password.html?token=" + token;
        String subject = "FixMyCar - Recuperar contraseña";
        String body = "Hola,\n\nSolicitaste recuperar tu contraseña. Hacé clic en el siguiente enlace (válido por " + RESET_TOKEN_VALIDITY_HOURS + " horas):\n\n" + link + "\n\nSi no solicitaste este correo, ignoralo.";

        sendEmail(user.getEmail(), subject, body);
        log.info("Email de recuperación enviado a {}", email);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        User user = userRepository.findByResetToken(req.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Enlace inválido o expirado"));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(Instant.now())) {
            user.setResetToken(null);
            user.setResetTokenExpiry(null);
            userRepository.save(user);
            throw new IllegalArgumentException("El enlace ha expirado. Solicitá uno nuevo.");
        }

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
        log.info("Contraseña restablecida para usuario id={}", user.getId());
    }

    private String generateResetToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[RESET_TOKEN_BYTES];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private void sendEmail(String to, String subject, String text) {
        if (mailSender == null) {
            log.warn("Mail no configurado: no se envió el correo a {}", to);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Error al enviar email de recuperación a {}: {}", to, e.getMessage());
        }
    }
}
