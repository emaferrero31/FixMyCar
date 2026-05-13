package com.tallermecanico.service;

import com.tallermecanico.dto.resena.CrearResenaRequest;
import com.tallermecanico.dto.resena.ResenaResponse;
import com.tallermecanico.dto.taller.*;
import com.tallermecanico.entity.ResenaTaller;
import com.tallermecanico.entity.Role;
import com.tallermecanico.entity.Taller;
import com.tallermecanico.entity.User;
import com.tallermecanico.repository.ClienteRepository;
import com.tallermecanico.repository.ResenaTallerRepository;
import com.tallermecanico.repository.TallerRepository;
import com.tallermecanico.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class TallerService {

    private static final int MAX_RESENAS_PUBLICO = 50;

    private final TallerRepository tallerRepository;
    private final UserRepository userRepository;
    private final ResenaTallerRepository resenaTallerRepository;
    private final ClienteRepository clienteRepository;
    private final ObjectMapper objectMapper;

    private record RatingStats(double promedio, long cantidad) {
        static final RatingStats EMPTY = new RatingStats(0.0, 0);
    }

    private static double round2(double v) {
        return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private String extraerLogoDataUrl(String perfilPublicoJson) {
        if (perfilPublicoJson == null || perfilPublicoJson.isBlank()) {
            return null;
        }
        try {
            JsonNode root = objectMapper.readTree(perfilPublicoJson);
            JsonNode node = root.get("logoDataUrl");
            if (node != null && node.isTextual()) {
                String v = node.asText();
                if (v != null && v.startsWith("data:image")) {
                    return v;
                }
            }
        } catch (Exception ignored) {
            // Si el JSON es inválido o no tiene logo, devolvemos null.
        }
        return null;
    }

    private Map<Long, RatingStats> loadStatsMap(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        List<Object[]> rows = resenaTallerRepository.aggregateByTallerIds(ids);
        Map<Long, RatingStats> map = new HashMap<>();
        for (Object[] row : rows) {
            long tid = ((Number) row[0]).longValue();
            double avg = ((Number) row[1]).doubleValue();
            long cnt = ((Number) row[2]).longValue();
            map.put(tid, new RatingStats(round2(avg), cnt));
        }
        return map;
    }

    private RatingStats statsForTaller(Long tallerId, Map<Long, RatingStats> map) {
        return map.getOrDefault(tallerId, RatingStats.EMPTY);
    }

    @Transactional(readOnly = true)
    public TallerResponse obtenerPorId(Long tallerId) {
        Taller t = tallerRepository.findById(tallerId)
                .orElseThrow(() -> new IllegalArgumentException("Taller no encontrado"));
        Map<Long, RatingStats> map = loadStatsMap(List.of(tallerId));
        return toResponse(t, statsForTaller(tallerId, map));
    }

    @Transactional
    public TallerResponse actualizar(Long tallerId, TallerUpdateRequest request) {
        Taller t = tallerRepository.findById(tallerId)
                .orElseThrow(() -> new IllegalArgumentException("Taller no encontrado"));
        User u = t.getUser();

        String newEmail = request.getEmail().trim().toLowerCase();
        if (!newEmail.equalsIgnoreCase(u.getEmail())) {
            userRepository.findByEmail(newEmail).ifPresent(other -> {
                if (!other.getId().equals(u.getId())) {
                    throw new IllegalArgumentException("El correo ya está en uso");
                }
            });
            u.setEmail(newEmail);
            userRepository.save(u);
        }

        t.setNombreTaller(request.getNombreTaller().trim());
        t.setDireccion(request.getDireccion().trim());
        t.setTelefono(request.getTelefono().trim());
        tallerRepository.save(t);
        Map<Long, RatingStats> map = loadStatsMap(List.of(tallerId));
        return toResponse(t, statsForTaller(tallerId, map));
    }

    @Transactional
    public void actualizarPerfilPublico(Long tallerId, TallerPerfilPublicoRequest request) {
        Taller t = tallerRepository.findById(tallerId)
                .orElseThrow(() -> new IllegalArgumentException("Taller no encontrado"));
        String json = request.getPerfilJson();
        t.setPerfilPublicoJson(json != null && !json.isBlank() ? json : null);
        tallerRepository.save(t);
    }

    @Transactional(readOnly = true)
    public List<TallerResponse> listar(String nombre, String direccion, String orden) {
        Stream<Taller> stream = tallerRepository.findAll().stream();
        if (nombre != null && !nombre.isBlank()) {
            String n = nombre.trim().toLowerCase();
            stream = stream.filter(t -> t.getNombreTaller().toLowerCase().contains(n));
        }
        if (direccion != null && !direccion.isBlank()) {
            String d = direccion.trim().toLowerCase();
            stream = stream.filter(t -> t.getDireccion().toLowerCase().contains(d));
        }
        List<Taller> list = stream.toList();
        Map<Long, RatingStats> statsMap = loadStatsMap(list.stream().map(Taller::getId).toList());

        List<TallerResponse> responses = list.stream()
                .map(t -> toResponseListItem(t, statsForTaller(t.getId(), statsMap)))
                .collect(Collectors.toCollection(ArrayList::new));

        String ord = orden != null ? orden.trim().toLowerCase() : "nombre";
        Comparator<TallerResponse> cmp = switch (ord) {
            case "puntuacion" -> Comparator
                    .comparing(TallerResponse::getPuntuacionPromedio, Comparator.reverseOrder())
                    .thenComparing(TallerResponse::getCantidadResenas, Comparator.reverseOrder())
                    .thenComparing(t -> t.getNombreTaller() != null ? t.getNombreTaller() : "");
            case "direccion" -> Comparator.comparing(t -> t.getDireccion() != null ? t.getDireccion() : "");
            default -> Comparator.comparing(t -> t.getNombreTaller() != null ? t.getNombreTaller() : "");
        };
        responses.sort(cmp);
        return responses;
    }

    @Transactional(readOnly = true)
    public TallerPublicoResponse obtenerPublico(Long tallerId) {
        Taller t = tallerRepository.findById(tallerId)
                .orElseThrow(() -> new IllegalArgumentException("Taller no encontrado"));
        Map<Long, RatingStats> map = loadStatsMap(List.of(tallerId));
        RatingStats st = statsForTaller(tallerId, map);

        var page = PageRequest.of(0, MAX_RESENAS_PUBLICO);
        List<ResenaTaller> resenas = resenaTallerRepository.findByTaller_IdOrderByUpdatedAtDesc(tallerId, page);

        return TallerPublicoResponse.builder()
                .id(t.getId())
                .nombreTaller(t.getNombreTaller())
                .direccion(t.getDireccion())
                .telefono(t.getTelefono())
                .email(t.getUser().getEmail())
                .puntuacionPromedio(st.promedio())
                .cantidadResenas((int) st.cantidad())
                .perfilPublicoJson(t.getPerfilPublicoJson())
                .resenas(resenas.stream().map(this::toResenaResponse).toList())
                .build();
    }

    @Transactional
    public ResenaResponse crearOActualizarResena(Long tallerId, CrearResenaRequest req) {
        User user = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        if (user.getRole() != Role.CLIENTE) {
            throw new IllegalArgumentException("Solo los clientes pueden valorar talleres");
        }
        clienteRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Perfil de cliente no encontrado"));

        Taller taller = tallerRepository.findById(tallerId)
                .orElseThrow(() -> new IllegalArgumentException("Taller no encontrado"));

        ResenaTaller r = resenaTallerRepository.findByTaller_IdAndUser_Id(tallerId, user.getId())
                .orElse(ResenaTaller.builder()
                        .taller(taller)
                        .user(user)
                        .build());
        r.setPuntuacion(req.getPuntuacion());
        String c = req.getComentario();
        r.setComentario(c != null && !c.isBlank() ? c.trim() : null);
        r = resenaTallerRepository.save(r);
        return toResenaResponse(r);
    }

    private ResenaResponse toResenaResponse(ResenaTaller r) {
        String nombre = clienteRepository.findByUser_Id(r.getUser().getId())
                .map(c -> c.getNombre() + " " + c.getApellido())
                .orElse(r.getUser().getUsername());
        return ResenaResponse.builder()
                .id(r.getId())
                .puntuacion(r.getPuntuacion())
                .comentario(r.getComentario())
                .fecha(r.getUpdatedAt())
                .autorNombre(nombre)
                .usuarioId(r.getUser().getId())
                .build();
    }

    private TallerResponse toResponse(Taller t, RatingStats st) {
        return TallerResponse.builder()
                .id(t.getId())
                .nombreTaller(t.getNombreTaller())
                .direccion(t.getDireccion())
                .telefono(t.getTelefono())
                .email(t.getUser().getEmail())
                .username(t.getUser().getUsername())
                .puntuacionPromedio(st.promedio())
                .cantidadResenas((int) st.cantidad())
                .perfilPublicoJson(t.getPerfilPublicoJson())
                .logoDataUrl(extraerLogoDataUrl(t.getPerfilPublicoJson()))
                .build();
    }

    /** Listado: sin JSON de perfil (puede ser muy pesado por imágenes base64). */
    private TallerResponse toResponseListItem(Taller t, RatingStats st) {
        return TallerResponse.builder()
                .id(t.getId())
                .nombreTaller(t.getNombreTaller())
                .direccion(t.getDireccion())
                .telefono(t.getTelefono())
                .email(t.getUser().getEmail())
                .username(t.getUser().getUsername())
                .puntuacionPromedio(st.promedio())
                .cantidadResenas((int) st.cantidad())
                .perfilPublicoJson(null)
                .logoDataUrl(extraerLogoDataUrl(t.getPerfilPublicoJson()))
                .build();
    }
}
