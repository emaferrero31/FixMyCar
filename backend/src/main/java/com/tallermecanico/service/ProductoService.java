package com.tallermecanico.service;

import com.tallermecanico.dto.producto.ProductoRequest;
import com.tallermecanico.dto.producto.ProductoResponse;
import com.tallermecanico.entity.Producto;
import com.tallermecanico.entity.Taller;
import com.tallermecanico.repository.ProductoRepository;
import com.tallermecanico.repository.TallerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final TallerRepository tallerRepository;

    public ProductoService(ProductoRepository productoRepository, TallerRepository tallerRepository) {
        this.productoRepository = productoRepository;
        this.tallerRepository = tallerRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductoResponse> listarPorTaller(Long tallerId) {
        List<Producto> productos = productoRepository.findByTaller_Id(tallerId);
        return productos.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public ProductoResponse crearParaTaller(Long tallerId, ProductoRequest request) {
        Taller taller = tallerRepository.findById(tallerId)
                .orElseThrow(() -> new IllegalArgumentException("No se encontró el taller indicado"));

        Producto producto = new Producto();
        producto.setTaller(taller);
        aplicarDatos(producto, request);

        Producto guardado = productoRepository.save(producto);
        return toResponse(guardado);
    }

    @Transactional
    public ProductoResponse actualizar(Long productoId, Long tallerId, ProductoRequest request) {
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));

        if (!producto.getTaller().getId().equals(tallerId)) {
            throw new IllegalArgumentException("El producto no pertenece al taller indicado");
        }

        aplicarDatos(producto, request);
        Producto guardado = productoRepository.save(producto);
        return toResponse(guardado);
    }

    @Transactional
    public void eliminar(Long productoId, Long tallerId) {
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));

        if (!producto.getTaller().getId().equals(tallerId)) {
            throw new IllegalArgumentException("El producto no pertenece al taller indicado");
        }

        productoRepository.delete(producto);
    }

    private void aplicarDatos(Producto producto, ProductoRequest request) {
        producto.setNombre(request.getNombre().trim());
        producto.setDescripcion(request.getDescripcion() != null ? request.getDescripcion().trim() : null);
        producto.setCategoria(request.getCategoria() != null && !request.getCategoria().isBlank()
                ? request.getCategoria().trim()
                : null);
        producto.setCantidad(request.getCantidad());
        producto.setPrecioUnitario(request.getPrecioUnitario());
        producto.setUmbralStockBajo(request.getUmbralStockBajo());
    }

    private ProductoResponse toResponse(Producto p) {
        return ProductoResponse.builder()
                .id(p.getId())
                .tallerId(p.getTaller().getId())
                .nombre(p.getNombre())
                .descripcion(p.getDescripcion())
                .categoria(p.getCategoria())
                .cantidad(p.getCantidad())
                .precioUnitario(p.getPrecioUnitario())
                .umbralStockBajo(p.getUmbralStockBajo())
                .build();
    }
}

