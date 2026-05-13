(function () {
  var API_BASE = FixMyCar.API_BASE;

  function getUsuario() {
    return FixMyCar.getUsuario();
  }

  function formatearPrecio(valor) {
    if (valor == null) return '-';
    return '$ ' + valor.toFixed(2);
  }

  function escaparHtml(s) {
    if (s == null || s === '') return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  var tablaBody = document.querySelector('.inventory-table tbody');
  var btnNuevo = document.getElementById('add-item');
  var modal = document.getElementById('product-modal');
  var form = document.getElementById('product-form');
  var modalTitle = document.getElementById('modal-title');

  var inputNombre = document.getElementById('product-name');
  var inputStock = document.getElementById('product-stock');
  var inputMinStock = document.getElementById('product-min-stock');
  var inputPrecioVenta = document.getElementById('product-sale-price');
  var inputDescripcion = document.getElementById('product-description');
  var inputCategoria = document.getElementById('product-category');
  var inputBusqueda = document.getElementById('search-inventory');
  var filtroCategoria = document.getElementById('category-filter');
  var filtroStock = document.getElementById('stock-filter');

  var inventarioCache = [];

  var ETIQUETAS_CATEGORIA = {
    motor: 'Motor',
    frenos: 'Frenos',
    suspension: 'Suspensión',
    electrico: 'Eléctrico',
    lubricantes: 'Lubricantes',
    filtros: 'Filtros',
    herramientas: 'Herramientas'
  };

  function etiquetaCategoria(valor) {
    if (valor == null || String(valor).trim() === '') return '-';
    var k = String(valor).trim().toLowerCase();
    return ETIQUETAS_CATEGORIA[k] || String(valor).trim();
  }

  function sinDiacriticos(s) {
    return (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Nivel de stock para filtros y etiqueta:
   * - out: cantidad <= 0
   * - critical: hay umbral (>0) y cantidad > 0 y cantidad <= max(1, floor(umbral * 35%))
   * - low: cantidad > critical hasta umbral (inclusive)
   * - ok: por encima del umbral, o sin umbral definido y cantidad > 0
   */
  function nivelStockKey(cantidad, umbral) {
    var c = cantidad != null ? Number(cantidad) : NaN;
    if (isNaN(c)) return 'unknown';
    if (c <= 0) return 'out';
    var u = umbral != null ? Number(umbral) : NaN;
    if (isNaN(u) || u <= 0) return 'ok';
    var crit = Math.max(1, Math.floor(u * 0.35));
    if (c <= crit) return 'critical';
    if (c <= u) return 'low';
    return 'ok';
  }

  function estadoPorStock(cantidad, umbral) {
    var key = nivelStockKey(cantidad, umbral);
    if (key === 'out') return { texto: 'Sin stock', clase: 'danger', key: 'out' };
    if (key === 'critical') return { texto: 'Stock crítico', clase: 'critical', key: 'critical' };
    if (key === 'low') return { texto: 'Stock bajo', clase: 'warning', key: 'low' };
    if (key === 'ok') return { texto: 'OK', clase: 'success', key: 'ok' };
    return { texto: '-', clase: '', key: 'unknown' };
  }

  function productoPasaFiltros(p) {
    var catVal = filtroCategoria ? filtroCategoria.value : 'all';
    if (catVal !== 'all') {
      var pk = (p.categoria || '').toString().trim().toLowerCase();
      if (pk !== catVal.toLowerCase()) return false;
    }

    var stockVal = filtroStock ? filtroStock.value : 'all';
    if (stockVal !== 'all') {
      var lvl = nivelStockKey(p.cantidad, p.umbralStockBajo);
      if (stockVal === 'out' && lvl !== 'out') return false;
      if (stockVal === 'critical' && lvl !== 'critical') return false;
      if (stockVal === 'low' && lvl !== 'low') return false;
    }

    var q = inputBusqueda ? (inputBusqueda.value || '').trim() : '';
    if (q) {
      var n = sinDiacriticos(q);
      var campos = [
        p.nombre,
        p.descripcion,
        p.categoria,
        etiquetaCategoria(p.categoria)
      ];
      var match = campos.some(function (f) {
        return sinDiacriticos(f || '').indexOf(n) !== -1;
      });
      if (!match) return false;
    }
    return true;
  }

  function enlazarAccionesTabla(items) {
    if (!tablaBody) return;
    tablaBody.querySelectorAll('.btn-edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tr = this.closest('tr');
        var id = tr.getAttribute('data-id');
        var item = items.find(function (p) { return String(p.id) === String(id); });
        if (item) abrirModalEditar(item);
      });
    });

    tablaBody.querySelectorAll('.btn-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tr = this.closest('tr');
        var id = tr.getAttribute('data-id');
        eliminarProducto(id);
      });
    });
  }

  function renderInventarioFiltrado() {
    if (!tablaBody) return;
    var items = Array.isArray(inventarioCache) ? inventarioCache : [];
    if (items.length === 0) {
      tablaBody.innerHTML = '<tr><td colspan="7" style="padding:16px; text-align:center; color:#7f8c8d;">No hay productos en el inventario.</td></tr>';
      return;
    }
    var visibles = items.filter(productoPasaFiltros);
    if (visibles.length === 0) {
      tablaBody.innerHTML = '<tr><td colspan="7" style="padding:16px; text-align:center; color:#7f8c8d;">Ningún producto coincide con la búsqueda o los filtros.</td></tr>';
      return;
    }

    var html = '';
    visibles.forEach(function (p) {
      var estado = estadoPorStock(p.cantidad, p.umbralStockBajo);
      var catKey = p.categoria ? String(p.categoria).trim().toLowerCase().replace(/\s+/g, '-') : '';
      var catLabel = etiquetaCategoria(p.categoria);
      html += '<tr class="inventory-item" data-id="' + p.id + '" data-category="' + escaparHtml(catKey) + '" data-stock-level="' + estado.key + '">' +
        '<td class="checkbox-cell"><input type="checkbox" class="item-checkbox"></td>' +
        '<td class="item-col">' +
          '<div class="item-info">' +
            '<div class="item-avatar"><i class="fas fa-box"></i></div>' +
            '<div class="item-details">' +
              '<h4>' + escaparHtml(p.nombre) + '</h4>' +
              '<span class="item-sku">' + (p.descripcion ? escaparHtml(p.descripcion) : '') + '</span>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td class="category-col"><span class="badge category' + (catKey ? ' cat-' + escaparHtml(catKey) : '') + '">' + escaparHtml(catLabel) + '</span></td>' +
        '<td class="stock-col"><div class="stock-info">' +
          '<span>' + (p.cantidad != null ? p.cantidad : 0) + '</span>' +
        '</div></td>' +
        '<td class="price-col">' + formatearPrecio(p.precioUnitario || 0) + '</td>' +
        '<td class="status-col"><span class="badge ' + estado.clase + '">' + estado.texto + '</span></td>' +
        '<td class="actions-col">' +
          '<button class="btn-icon btn-edit" title="Editar"><i class="fas fa-edit"></i></button>' +
          '<button class="btn-icon btn-delete" title="Eliminar"><i class="fas fa-trash"></i></button>' +
        '</td>' +
      '</tr>';
    });
    tablaBody.innerHTML = html;
    enlazarAccionesTabla(inventarioCache);
  }

  var productoEditandoId = null;

  function abrirModalCrear() {
    productoEditandoId = null;
    if (!form) return;
    form.reset();
    modalTitle.textContent = 'Nuevo Producto';
    if (modal) modal.classList.add('show');
  }

  function abrirModalEditar(producto) {
    productoEditandoId = producto.id;
    if (!form) return;
    modalTitle.textContent = 'Editar Producto';
    inputNombre.value = producto.nombre || '';
    inputStock.value = producto.cantidad != null ? producto.cantidad : '';
    inputMinStock.value = producto.umbralStockBajo != null ? producto.umbralStockBajo : '';
    inputPrecioVenta.value = producto.precioUnitario != null ? producto.precioUnitario : '';
    inputDescripcion.value = producto.descripcion || '';
    if (inputCategoria) inputCategoria.value = producto.categoria || '';
    if (modal) modal.classList.add('show');
  }

  function cerrarModal() {
    if (modal) modal.classList.remove('show');
  }

  function cargarInventario() {
    var u = getUsuario();
    if (!u || !u.tallerId) {
      window.location.href = 'login.html';
      return;
    }
    if (!tablaBody) return;

    fetch(API_BASE + '/talleres/' + u.tallerId + '/inventario')
      .then(function (r) { return r.json(); })
      .then(function (items) {
        inventarioCache = Array.isArray(items) ? items : [];
        renderInventarioFiltrado();
      })
      .catch(function () {
        if (tablaBody) {
          tablaBody.innerHTML = '<tr><td colspan="7" style="padding:16px; text-align:center; color:#e74c3c;">Error al cargar el inventario. ¿Está el backend en marcha?</td></tr>';
        }
      });
  }

  function guardarProducto(e) {
    e.preventDefault();
    var u = getUsuario();
    if (!u || !u.tallerId) {
      window.location.href = 'login.html';
      return;
    }

    var catRaw = inputCategoria && inputCategoria.value ? inputCategoria.value.trim() : '';
    var body = {
      nombre: inputNombre.value.trim(),
      descripcion: inputDescripcion.value.trim() || null,
      categoria: catRaw || null,
      cantidad: parseInt(inputStock.value || '0', 10),
      precioUnitario: parseFloat(inputPrecioVenta.value || '0'),
      umbralStockBajo: inputMinStock.value ? parseInt(inputMinStock.value, 10) : null
    };

    var metodo;
    var url;
    if (productoEditandoId) {
      metodo = 'PUT';
      url = API_BASE + '/talleres/' + u.tallerId + '/inventario/' + productoEditandoId;
    } else {
      metodo = 'POST';
      url = API_BASE + '/talleres/' + u.tallerId + '/inventario';
    }

    var btnSubmit = form.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;

    fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(function (r) {
        return r.json().then(function (data) { return { ok: r.ok, data: data }; });
      })
      .then(function (result) {
        btnSubmit.disabled = false;
        if (result.ok) {
          cerrarModal();
          cargarInventario();
        } else {
          alert(result.data && result.data.message ? result.data.message : 'Error al guardar el producto.');
        }
      })
      .catch(function () {
        btnSubmit.disabled = false;
        alert('Error de conexión.');
      });
  }

  function eliminarProducto(id) {
    var u = getUsuario();
    if (!u || !u.tallerId) {
      window.location.href = 'login.html';
      return;
    }
    if (!confirm('¿Seguro que deseas eliminar este producto?')) return;

    fetch(API_BASE + '/talleres/' + u.tallerId + '/inventario/' + id, {
      method: 'DELETE'
    })
      .then(function (r) {
        if (r.ok) {
          cargarInventario();
        } else {
          return r.json().then(function (data) {
            alert(data.message || 'Error al eliminar el producto.');
          });
        }
      })
      .catch(function () {
        alert('Error de conexión.');
      });
  }

  var u = getUsuario();
  if (!u) {
    window.location.href = 'login.html';
    return;
  }
  if (u.role !== 'TALLER' || !u.tallerId) {
    window.location.href = 'workshop-dashboard.html';
    return;
  }

  var sn = document.getElementById('sidebarUserName');
  if (sn) sn.textContent = u.nombre || u.username || 'Taller';

  if (btnNuevo) {
    btnNuevo.addEventListener('click', abrirModalCrear);
  }

  var closeBtns = document.querySelectorAll('.close-modal');
  closeBtns.forEach(function(btn) {
    btn.addEventListener('click', cerrarModal);
  });

  if (form) {
    form.addEventListener('submit', guardarProducto);
  }

  if (inputBusqueda) {
    inputBusqueda.addEventListener('input', function () {
      renderInventarioFiltrado();
    });
  }
  if (filtroCategoria) {
    filtroCategoria.addEventListener('change', function () {
      renderInventarioFiltrado();
    });
  }
  if (filtroStock) {
    filtroStock.addEventListener('change', function () {
      renderInventarioFiltrado();
    });
  }

  cargarInventario();
})();

