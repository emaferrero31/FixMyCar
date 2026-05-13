(function () {
  var API_BASE = FixMyCar.API_BASE;

  function getUsuario() {
    return FixMyCar.getUsuario();
  }

  /** Misma lógica que inventario: out / critical / low / ok / unknown */
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

  function estadoCitaActivoParaAgenda(estado) {
    var e = (estado || '').toString().toUpperCase();
    return e === 'PENDIENTE' || e === 'CONFIRMADA' || e === 'EN_CURSO';
  }

  function proximoTurnoDesdeAhora(citas) {
    var now = new Date();
    var list = (citas || []).filter(function (c) {
      if (!c.fechaHora) return false;
      if (!estadoCitaActivoParaAgenda(c.estado)) return false;
      return new Date(c.fechaHora) >= now;
    });
    list.sort(function (a, b) {
      return new Date(a.fechaHora) - new Date(b.fechaHora);
    });
    return list[0] || null;
  }

  function contarEnProgreso(citas) {
    return (citas || []).filter(function (c) {
      return (c.estado || '').toString().toUpperCase() === 'EN_CURSO';
    }).length;
  }

  function contarAlertasStock(productos) {
    return (productos || []).filter(function (p) {
      var k = nivelStockKey(p.cantidad, p.umbralStockBajo);
      return k === 'out' || k === 'critical' || k === 'low';
    }).length;
  }

  function formatoProximoTurno(cita) {
    if (!cita) return 'No hay turnos programados a futuro';
    var d = new Date(cita.fechaHora);
    var fecha = d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
    var hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    var cliente = cita.clienteNombre || 'Cliente';
    var veh = cita.vehiculoMarcaModelo ? ' · ' + cita.vehiculoMarcaModelo : '';
    return fecha + ' ' + hora + ' — ' + cliente + veh;
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function formatoFechaCita(fechaHora) {
    if (!fechaHora) return '';
    var d = new Date(fechaHora);
    return (
      d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    );
  }

  function etiquetaEstadoTablero(estado) {
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

  /** Misma lógica de columnas que el dashboard del cliente (dashboard.js). */
  function asignarColumnaTablero(estado) {
    if (!estado) return 'pendiente';
    var e = (estado + '').toUpperCase();
    if (e === 'COMPLETADA' || e === 'CANCELADA') return 'finalizado';
    if (e === 'CONFIRMADA' || e === 'EN_CURSO') return 'enProgreso';
    return 'pendiente';
  }

  function tarjetaCitaTaller(cita) {
    var estado = (cita.estado || '').toLowerCase();
    var statusClass = 'pending';
    if (estado === 'en_curso' || estado === 'confirmada') statusClass = 'in-progress';
    if (estado === 'completada' || estado === 'cancelada') statusClass = 'completed';

    return (
      '<div class="card-service" data-cita-id="' +
      cita.id +
      '">' +
      '  <div class="service-header">' +
      '    <span class="service-id">#' +
      escapeHtml(cita.id) +
      '</span>' +
      '    <span class="service-date">' +
      escapeHtml(formatoFechaCita(cita.fechaHora)) +
      '</span>' +
      '  </div>' +
      '  <h4>' +
      escapeHtml(cita.clienteNombre || 'Cliente') +
      '</h4>' +
      '  <p class="service-vehicle"><i class="fas fa-car"></i> ' +
      escapeHtml(cita.vehiculoMarcaModelo || '—') +
      '</p>' +
      (cita.descripcion ? '<p class="service-desc">' + escapeHtml(cita.descripcion) + '</p>' : '') +
      '  <div class="service-footer">' +
      '    <span class="service-status ' +
      statusClass +
      '">' +
      escapeHtml(etiquetaEstadoTablero(cita.estado)) +
      '</span>' +
      '    <a href="workshop-appointments.html" class="btn-service">Gestionar</a>' +
      '  </div>' +
      '</div>'
    );
  }

  function renderTableroTurnos(citas) {
    var colP = document.getElementById('cardsPendiente');
    var colE = document.getElementById('cardsEnProgreso');
    var colF = document.getElementById('cardsFinalizado');
    if (!colP || !colE || !colF) return;

    colP.innerHTML = '';
    colE.innerHTML = '';
    colF.innerHTML = '';

    var list = Array.isArray(citas) ? citas.slice() : [];
    list.sort(function (a, b) {
      return new Date(a.fechaHora || 0) - new Date(b.fechaHora || 0);
    });

    var countP = 0;
    var countE = 0;
    var countF = 0;

    list.forEach(function (cita) {
      var col = asignarColumnaTablero(cita.estado);
      var card = tarjetaCitaTaller(cita);
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

    var bp = document.getElementById('badgePendiente');
    var be = document.getElementById('badgeEnProgreso');
    var bf = document.getElementById('badgeFinalizado');
    if (bp) bp.textContent = String(countP);
    if (be) be.textContent = String(countE);
    if (bf) bf.textContent = String(countF);
  }

  function cargarResumen() {
    var u = getUsuario();
    if (!u || !u.tallerId) return;

    var elProx = document.getElementById('dashboard-proximo-turno');
    var elProg = document.getElementById('dashboard-en-progreso');
    var elStock = document.getElementById('dashboard-stock-alertas');

    var urlCitas = API_BASE + '/talleres/' + u.tallerId + '/citas';
    var urlInv = API_BASE + '/talleres/' + u.tallerId + '/inventario';

    Promise.all([
      fetch(urlCitas).then(function (r) {
        return r.ok ? r.json() : Promise.reject(new Error('citas'));
      }),
      fetch(urlInv).then(function (r) {
        return r.ok ? r.json() : Promise.reject(new Error('inv'));
      })
    ])
      .then(function (pair) {
        var citas = Array.isArray(pair[0]) ? pair[0] : [];
        var productos = Array.isArray(pair[1]) ? pair[1] : [];

        var next = proximoTurnoDesdeAhora(citas);
        if (elProx) elProx.textContent = formatoProximoTurno(next);

        var nProg = contarEnProgreso(citas);
        if (elProg) elProg.textContent = String(nProg);

        var nStock = contarAlertasStock(productos);
        if (elStock) elStock.textContent = String(nStock);

        renderTableroTurnos(citas);
      })
      .catch(function () {
        if (elProx) elProx.textContent = 'No se pudo cargar';
        if (elProg) elProg.textContent = '—';
        if (elStock) elStock.textContent = '—';
        var colP = document.getElementById('cardsPendiente');
        var colE = document.getElementById('cardsEnProgreso');
        var colF = document.getElementById('cardsFinalizado');
        if (colP) {
          colP.innerHTML =
            '<p style="color:#e74c3c;font-size:0.85rem;padding:8px;margin:0;">Error al cargar citas.</p>';
        }
        if (colE) colE.innerHTML = '';
        if (colF) colF.innerHTML = '';
        var bp = document.getElementById('badgePendiente');
        var be = document.getElementById('badgeEnProgreso');
        var bf = document.getElementById('badgeFinalizado');
        if (bp) bp.textContent = '0';
        if (be) be.textContent = '0';
        if (bf) bf.textContent = '0';
      });
  }

  var u = getUsuario();
  if (!u) {
    window.location.href = 'login.html';
    return;
  }
  if (u.role === 'CLIENTE') {
    window.location.href = 'dashboard.html';
    return;
  }

  var name = u.nombre || u.username;
  var elSidebarName = document.getElementById('sidebarUserName');
  if (elSidebarName) elSidebarName.textContent = name;
  var title = document.getElementById('workshopWelcomeTitle');
  if (title) title.textContent = 'Bienvenido, ' + name;

  cargarResumen();
})();
