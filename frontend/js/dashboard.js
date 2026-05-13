(function () {
  var API_BASE = FixMyCar.API_BASE;

  function getUsuario() {
    return FixMyCar.getUsuario();
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function formatoFecha(fechaHora) {
    if (!fechaHora) return '';
    var d = new Date(fechaHora);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
      d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  function etiquetaEstado(estado) {
    var e = (estado || '').toUpperCase();
    var map = {
      PENDIENTE: 'Pendiente',
      CONFIRMADA: 'Confirmada',
      EN_CURSO: 'En curso',
      COMPLETADA: 'Completada',
      CANCELADA: 'Cancelada'
    };
    return map[e] || (estado || '');
  }

  function tarjetaCita(cita) {
    var estado = (cita.estado || '').toLowerCase();
    var statusClass = 'pending';
    if (estado === 'en_curso' || estado === 'confirmada') statusClass = 'in-progress';
    if (estado === 'completada' || estado === 'cancelada') statusClass = 'completed';

    var html =
      '<div class="card-service" data-cita-id="' + cita.id + '">' +
      '  <div class="service-header">' +
      '    <span class="service-id">#' + escapeHtml(cita.id) + '</span>' +
      '    <span class="service-date">' + escapeHtml(formatoFecha(cita.fechaHora)) + '</span>' +
      '  </div>' +
      '  <h4>' + escapeHtml(cita.tallerNombre || 'Taller') + '</h4>' +
      '  <p class="service-vehicle"><i class="fas fa-car"></i> ' + escapeHtml(cita.vehiculoMarcaModelo || '') + '</p>' +
      (cita.descripcion ? '<p class="service-desc">' + escapeHtml(cita.descripcion) + '</p>' : '') +
      '  <div class="service-footer">' +
      '    <span class="service-status ' + statusClass + '">' + escapeHtml(etiquetaEstado(cita.estado)) + '</span>' +
      '    <a href="appointments.html" class="btn-service">Ver</a>' +
      '  </div>' +
      '</div>';
    return html;
  }

  function asignarColumna(estado) {
    if (!estado) return 'pendiente';
    var e = (estado + '').toUpperCase();
    if (e === 'COMPLETADA' || e === 'CANCELADA') return 'finalizado';
    if (e === 'CONFIRMADA' || e === 'EN_CURSO') return 'enProgreso';
    return 'pendiente'; // PENDIENTE (esperando respuesta del taller)
  }

  function cargarDashboard() {
    var u = getUsuario();
    if (!u || !u.id) return;

    document.getElementById('welcomeTitle').textContent = 'Bienvenido de vuelta, ' + (u.nombre || u.username);

    fetch(API_BASE + '/clientes/' + u.id + '/vehiculos')
      .then(function (r) { return r.json(); })
      .then(function (vehiculos) {
        var n = (vehiculos && vehiculos.length) || 0;
        document.getElementById('cardVehiculos').textContent = n;
      })
      .catch(function () { document.getElementById('cardVehiculos').textContent = '—'; });

    fetch(API_BASE + '/clientes/' + u.id + '/citas')
      .then(function (r) { return r.json(); })
      .then(function (citas) {
        citas = citas || [];
        var ahora = new Date();
        var proximas = citas.filter(function (c) {
          var e = (c.estado || '').toUpperCase();
          return e !== 'COMPLETADA' && e !== 'CANCELADA' && new Date(c.fechaHora) >= ahora;
        }).sort(function (a, b) { return new Date(a.fechaHora) - new Date(b.fechaHora); });
        var proxima = proximas[0];
        document.getElementById('cardProximaCita').textContent = proxima
          ? formatoFecha(proxima.fechaHora)
          : '—';
        var activas = citas.filter(function (c) {
          var e = (c.estado || '').toUpperCase();
          return e !== 'COMPLETADA' && e !== 'CANCELADA';
        }).length;
        document.getElementById('cardCitasActivas').textContent = activas;

        var colP = document.getElementById('cardsPendiente');
        var colE = document.getElementById('cardsEnProgreso');
        var colF = document.getElementById('cardsFinalizado');
        colP.innerHTML = '';
        colE.innerHTML = '';
        colF.innerHTML = '';
        var countP = 0, countE = 0, countF = 0;

        citas.forEach(function (cita) {
          var col = asignarColumna(cita.estado);
          var card = tarjetaCita(cita);
          if (col === 'pendiente') {
            colP.insertAdjacentHTML('beforeend', card);
            countP++;
          } else if (col === 'enProgreso') {
            colE.insertAdjacentHTML('beforeend', card);
            countE++;
          } else {
            colF.insertAdjacentHTML('beforeend', card);
            countF++;
          }
        });

        document.getElementById('badgePendiente').textContent = countP;
        document.getElementById('badgeEnProgreso').textContent = countE;
        document.getElementById('badgeFinalizado').textContent = countF;
      })
      .catch(function () {
        document.getElementById('cardProximaCita').textContent = '—';
        document.getElementById('cardCitasActivas').textContent = '0';
        document.getElementById('cardsPendiente').innerHTML = '<p style="color:#7f8c8d;font-size:0.85rem;padding:8px;">Error al cargar citas.</p>';
      });
  }

  var u = getUsuario();
  if (!u) return;
  if (u.role !== 'CLIENTE') return;

  cargarDashboard();
})();
