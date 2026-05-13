(function () {
  var API_BASE = FixMyCar.API_BASE;
  var params = new URLSearchParams(window.location.search);
  var vehiculoId = params.get('vehiculoId');
  var vehiculo = null;

  function getUsuario() {
    return FixMyCar.getUsuario();
  }

  function escapeHtml(s) {
    if (s == null || s === '') return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function formatoFecha(fecha) {
    if (!fecha) return '';
    var d = new Date(fecha + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function renderUsuario() {
    var u = getUsuario();
    var nameEl = document.getElementById('sidebarUserName');
    if (nameEl) nameEl.textContent = u ? u.nombre || u.username : 'Usuario';
    document.getElementById('logoutLink').addEventListener('click', function (e) {
      e.preventDefault();
      FixMyCar.logout();
      window.location.href = 'login.html';
    });
  }

  function renderFicha(v) {
    if (!v) return;
    document.getElementById('tituloVehiculo').textContent = 'Historial: ' + (v.marca || '') + ' ' + (v.modelo || '') + ' ' + (v.patente || '');
    var photoEl = document.getElementById('historialVehiclePhoto');
    if (photoEl) {
      photoEl.innerHTML = '';
      var foto = v.fotoDataUrl != null ? v.fotoDataUrl : v.foto_data_url;
      if (foto && /^data:image\//i.test(String(foto))) {
        var im = document.createElement('img');
        im.src = foto;
        im.alt = 'Foto del vehículo';
        photoEl.appendChild(im);
        photoEl.style.display = 'block';
      } else {
        photoEl.style.display = 'none';
      }
    }
    var grid = document.getElementById('fichaGrid');
    grid.innerHTML =
      '<div class="ficha-item"><strong>Marca</strong><span>' + escapeHtml(v.marca) + '</span></div>' +
      '<div class="ficha-item"><strong>Modelo</strong><span>' + escapeHtml(v.modelo) + '</span></div>' +
      '<div class="ficha-item"><strong>Año</strong><span>' + escapeHtml(v.anio) + '</span></div>' +
      '<div class="ficha-item"><strong>Patente</strong><span>' + escapeHtml(v.patente) + '</span></div>' +
      '<div class="ficha-item"><strong>Color</strong><span>' + escapeHtml(v.color || '—') + '</span></div>' +
      '<div class="ficha-item"><strong>Combustible</strong><span>' + escapeHtml(v.tipoCombustible || '—') + '</span></div>' +
      '<div class="ficha-item"><strong>Kilometraje</strong><span>' + escapeHtml(v.kilometraje || '—') + '</span></div>' +
      (v.vin ? '<div class="ficha-item"><strong>VIN</strong><span>' + escapeHtml(v.vin) + '</span></div>' : '');
  }

  function cargarVehiculo() {
    var u = getUsuario();
    if (!u || !u.id || !vehiculoId) return;
    fetch(API_BASE + '/clientes/' + u.id + '/vehiculos')
      .then(function (r) { return r.json(); })
      .then(function (lista) {
        vehiculo = (lista || []).find(function (v) { return v.id == vehiculoId; });
        if (!vehiculo) {
          document.getElementById('fichaVehiculo').innerHTML = '<p style="color:#e74c3c;">Vehículo no encontrado.</p>';
          return;
        }
        renderFicha(vehiculo);
        cargarHistorial();
      })
      .catch(function () {
        document.getElementById('fichaVehiculo').innerHTML = '<p style="color:#e74c3c;">Error al cargar el vehículo.</p>';
      });
  }

  function cargarHistorial() {
    var u = getUsuario();
    if (!u || !u.id || !vehiculoId) return;
    fetch(API_BASE + '/clientes/' + u.id + '/vehiculos/' + vehiculoId + '/historial')
      .then(function (r) { return r.json(); })
      .then(function (lista) {
        var el = document.getElementById('listaRegistros');
        if (!lista || lista.length === 0) {
          el.innerHTML = '<p style="color:#64748b;">Aún no hay registros. Se irán sumando cuando los talleres marquen los turnos como finalizados.</p>';
          return;
        }
        el.innerHTML = lista.map(function (r) {
          var meta = [];
          if (r.tallerNombre) meta.push('Taller: ' + escapeHtml(r.tallerNombre));
          if (r.kilometrajeMomento) meta.push('Km: ' + escapeHtml(r.kilometrajeMomento));
          if (r.costo != null && r.costo !== '') meta.push('Costo: $' + Number(r.costo).toLocaleString('es-AR'));
          return (
            '<div class="registro-item">' +
            '  <div class="reg-fecha">' + escapeHtml(formatoFecha(r.fecha)) + '</div>' +
            '  <div class="reg-desc">' + escapeHtml(r.descripcion) + '</div>' +
            (meta.length ? '<div class="reg-meta">' + meta.join(' · ') + '</div>' : '') +
            '</div>'
          );
        }).join('');
      })
      .catch(function () {
        document.getElementById('listaRegistros').innerHTML = '<p style="color:#e74c3c;">Error al cargar el historial.</p>';
      });
  }

  var u = getUsuario();
  if (!u) {
    window.location.href = 'login.html';
    return;
  }
  if (u.role !== 'CLIENTE') {
    window.location.href = 'dashboard.html';
    return;
  }
  if (!vehiculoId) {
    window.location.href = 'vehicles.html';
    return;
  }

  renderUsuario();
  cargarVehiculo();
})();
