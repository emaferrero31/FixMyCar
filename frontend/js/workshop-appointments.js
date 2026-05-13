(function () {
  var API_BASE = FixMyCar.API_BASE;
  var listEl = document.getElementById('turnosLista');
  var calendarGrid = document.getElementById('calendar-grid');
  var calendarWeekTitle = document.getElementById('calendar-week-title');
  var calendarMonthTitle = document.getElementById('calendar-month-title');
  var detailContent = document.getElementById('detailContent');
  var modalCompletar = document.getElementById('modalCompletar');
  var formCompletar = document.getElementById('formCompletar');

  var citasCache = [];
  var weekStart = null;
  var selectedCitaId = null;
  var filtros = { texto: '', date: 'all', status: 'all' };

  function getUsuario() {
    return FixMyCar.getUsuario();
  }

  function formatoFechaHora(d) {
    if (!d) return '';
    var date = new Date(d);
    return date.toLocaleDateString('es-AR') + ' ' + date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  function formatoSoloHora(d) {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(s) {
    if (s == null || s === '') return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
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

  function estadoADataStatus(estado) {
    var e = (estado || '').toUpperCase();
    if (e === 'PENDIENTE') return 'pending';
    if (e === 'CONFIRMADA') return 'confirmed';
    if (e === 'EN_CURSO') return 'in-progress';
    if (e === 'COMPLETADA') return 'completed';
    if (e === 'CANCELADA') return 'cancelled';
    return 'pending';
  }

  function putSinBody(url) {
    return fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' } })
      .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); });
  }

  /** Primer día de la semana = domingo (como calendarios tipo date picker). */
  function inicioSemanaDomingo(d) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var day = x.getDay();
    x.setDate(x.getDate() - day);
    return x;
  }

  function addDays(d, n) {
    var x = new Date(d.getTime());
    x.setDate(x.getDate() + n);
    return x;
  }

  function mismoDia(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function hoySinHora() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  function sinDiacriticos(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function pasaFiltroTexto(c, t) {
    if (!t) return true;
    var n = sinDiacriticos(t);
    return [c.clienteNombre, c.vehiculoMarcaModelo, c.descripcion].some(function (f) {
      return sinDiacriticos(f || '').indexOf(n) !== -1;
    });
  }

  function mismoMes(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  }

  function pasaFiltroFecha(c, mode) {
    if (mode === 'all' || mode === 'custom') return true;
    if (!c.fechaHora) return false;
    var fd = new Date(c.fechaHora);
    var today = hoySinHora();
    if (mode === 'today') return mismoDia(fd, today);
    if (mode === 'tomorrow') return mismoDia(fd, addDays(today, 1));
    if (mode === 'week') {
      var rStart = inicioSemanaDomingo(today);
      var rEnd = addDays(rStart, 6);
      var cf = new Date(fd.getFullYear(), fd.getMonth(), fd.getDate());
      var d0 = new Date(rStart.getFullYear(), rStart.getMonth(), rStart.getDate());
      var d1 = new Date(rEnd.getFullYear(), rEnd.getMonth(), rEnd.getDate());
      return cf >= d0 && cf <= d1;
    }
    if (mode === 'calendar-week') {
      if (!weekStart) return true;
      var cStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
      var cEnd = addDays(cStart, 6);
      var cf2 = new Date(fd.getFullYear(), fd.getMonth(), fd.getDate());
      var z0 = new Date(cStart.getFullYear(), cStart.getMonth(), cStart.getDate());
      var z1 = new Date(cEnd.getFullYear(), cEnd.getMonth(), cEnd.getDate());
      return cf2 >= z0 && cf2 <= z1;
    }
    if (mode === 'month') return mismoMes(fd, today);
    return true;
  }

  function pasaFiltroEstado(c, statusKey) {
    if (statusKey === 'all') return true;
    var e = (c.estado || '').toUpperCase();
    if (statusKey === 'pending') return e === 'PENDIENTE';
    if (statusKey === 'confirmed') return e === 'CONFIRMADA';
    if (statusKey === 'in-progress') return e === 'EN_CURSO';
    if (statusKey === 'completed') return e === 'COMPLETADA';
    if (statusKey === 'cancelled') return e === 'CANCELADA';
    return true;
  }

  function filtrarCitas(citas) {
    if (!Array.isArray(citas)) return [];
    return citas.filter(function (c) {
      return pasaFiltroTexto(c, filtros.texto) && pasaFiltroFecha(c, filtros.date) && pasaFiltroEstado(c, filtros.status);
    });
  }

  function tituloRangoSemana(inicio) {
    var fin = addDays(inicio, 6);
    var opts = { day: 'numeric', month: 'short' };
    var a = inicio.toLocaleDateString('es-AR', opts);
    var b = fin.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
    return a + ' – ' + b;
  }

  function parseYmd(s) {
    var p = String(s).split('-');
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  }

  function semanasQueTocanMes(year, month0) {
    var first = new Date(year, month0, 1);
    var last = new Date(year, month0 + 1, 0);
    var sunday = inicioSemanaDomingo(first);
    var weeks = [];
    for (var n = 0; n < 14; n++) {
      var weekEnd = addDays(sunday, 6);
      var s0 = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate());
      var w6 = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate());
      var f0 = new Date(first.getFullYear(), first.getMonth(), first.getDate());
      var l0 = new Date(last.getFullYear(), last.getMonth(), last.getDate());
      if (w6 >= f0 && s0 <= l0) {
        weeks.push(new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate()));
      }
      sunday = addDays(sunday, 7);
      if (s0 > l0) break;
    }
    return weeks;
  }

  function mesAnclaSemana(ws) {
    var mid = addDays(ws, 3);
    return { y: mid.getFullYear(), m: mid.getMonth() };
  }

  function primeraSemanaDelMes(year, month0) {
    var weeks = semanasQueTocanMes(year, month0);
    if (weeks.length) return weeks[0];
    return inicioSemanaDomingo(new Date(year, month0, 1));
  }

  function encontrarCitaPorId(id) {
    if (id == null) return null;
    var list = Array.isArray(citasCache) ? citasCache : [];
    return list.find(function (c) { return String(c.id) === String(id); }) || null;
  }

  function tituloMesCalendario(ws) {
    if (!ws) return '';
    var end = addDays(ws, 6);
    if (ws.getMonth() !== end.getMonth() || ws.getFullYear() !== end.getFullYear()) {
      var a = ws.toLocaleDateString('es-AR', { month: 'short' });
      var b = end.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
      return a.charAt(0).toUpperCase() + a.slice(1) + ' – ' + b;
    }
    var mid = addDays(ws, 3);
    var s = mid.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function renderTitulosCalendario() {
    if (weekStart) {
      if (calendarWeekTitle) calendarWeekTitle.textContent = tituloRangoSemana(weekStart);
      if (calendarMonthTitle) calendarMonthTitle.textContent = tituloMesCalendario(weekStart);
    }
  }

  function renderCalendario(citas) {
    if (!calendarGrid) return;
    if (!weekStart) weekStart = inicioSemanaDomingo(hoySinHora());
    renderTitulosCalendario();

    var hoy = hoySinHora();
    var html = '';

    for (var i = 0; i < 7; i++) {
      var dia = addDays(weekStart, i);
      var esHoy = mismoDia(dia, hoy);
      var delMes = dia.getDate();

      var citasDia = (citas || []).filter(function (c) {
        if (!c.fechaHora) return false;
        var fd = new Date(c.fechaHora);
        return mismoDia(fd, dia);
      });
      citasDia.sort(function (a, b) { return new Date(a.fechaHora) - new Date(b.fechaHora); });

      var cardsHtml = '';
      citasDia.forEach(function (c) {
        var st = estadoADataStatus(c.estado);
        cardsHtml +=
          '<div class="appointment-card" data-status="' + st + '" data-cita-id="' + c.id + '" tabindex="0" role="button">' +
          '<div class="appointment-time">' + escapeHtml(formatoSoloHora(c.fechaHora)) + '</div>' +
          '<div class="appointment-details">' +
          '<h4>' + escapeHtml(c.clienteNombre || 'Cliente') + '</h4>' +
          '<p>' + escapeHtml(c.vehiculoMarcaModelo || '') + '</p>' +
          '</div></div>';
      });

      html +=
        '<div class="calendar-day' + (esHoy ? ' today' : '') + '">' +
        '<div class="day-header">' +
        '<span class="day-number' + (esHoy ? ' today' : '') + '">' + delMes + '</span>' +
        '</div>' +
        '<div class="day-appointments">' + (cardsHtml || '<span style="font-size:0.75rem;color:#bdc3c7;">Sin turnos</span>') + '</div>' +
        '</div>';
    }

    calendarGrid.innerHTML = html;

    calendarGrid.querySelectorAll('.appointment-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var id = this.getAttribute('data-cita-id');
        seleccionarCita(id);
      });
    });
  }

  function htmlAccionesDetalle(cita) {
    var estado = (cita.estado || '').toString();
    var id = cita.id;
    var o = '<div class="detail-actions-panel">';
    var cl = '</div>';
    if (estado === 'PENDIENTE') {
      return (
        o +
        '<button type="button" class="btn-aceptar" data-detalle-action="1" data-accion="aceptar" data-cita-id="' + id + '"><i class="fas fa-check"></i> Aceptar</button>' +
        '<button type="button" class="btn-rechazar" data-detalle-action="1" data-accion="rechazar" data-cita-id="' + id + '"><i class="fas fa-times"></i> Rechazar</button>' +
        cl
      );
    }
    if (estado === 'CONFIRMADA') {
      return (
        o +
        '<button type="button" class="btn-en-curso" data-detalle-action="1" data-cita-id="' + id + '"><i class="fas fa-play"></i> Iniciar</button>' +
        '<button type="button" class="btn-completar" data-detalle-action="1" data-cita-id="' + id + '"><i class="fas fa-wrench"></i> Completar</button>' +
        cl
      );
    }
    if (estado === 'EN_CURSO') {
      return o + '<button type="button" class="btn-completar" data-detalle-action="1" data-cita-id="' + id + '"><i class="fas fa-wrench"></i> Completar</button>' + cl;
    }
    return '<p class="detail-sin-acciones" style="margin-top:16px;color:#95a5a6;font-size:0.85rem;">No hay acciones disponibles para este estado.</p>';
  }

  function enlazarDetalleAcciones() {
    if (!detailContent) return;
    var u = getUsuario();
    if (!u || !u.tallerId) return;

    detailContent.querySelectorAll('[data-detalle-action]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var citaId = btn.getAttribute('data-cita-id');
        if (!citaId) return;

        if (btn.classList.contains('btn-completar')) {
          var elId = document.getElementById('completarCitaId');
          if (elId) elId.value = citaId;
          if (document.getElementById('completarDescripcion')) document.getElementById('completarDescripcion').value = '';
          if (document.getElementById('completarKilometraje')) document.getElementById('completarKilometraje').value = '';
          if (document.getElementById('completarCosto')) document.getElementById('completarCosto').value = '';
          if (modalCompletar) modalCompletar.classList.add('show');
          return;
        }

        if (btn.classList.contains('btn-en-curso')) {
          if (!confirm('¿Iniciar este turno? Quedará en curso y el cliente lo verá en su tablero en "En progreso".')) return;
          btn.disabled = true;
          putSinBody(API_BASE + '/talleres/' + u.tallerId + '/citas/' + citaId + '/en-curso')
            .then(function (result) {
              btn.disabled = false;
              if (result.ok) cargarTurnos();
              else alert(result.data && result.data.message ? result.data.message : 'Error al actualizar.');
            })
            .catch(function () {
              btn.disabled = false;
              alert('Error de conexión.');
            });
          return;
        }

        var accion = btn.getAttribute('data-accion');
        if (!accion) return;
        var endpoint = accion === 'aceptar' ? 'aceptar' : 'rechazar';
        var confirmMsg =
          accion === 'rechazar'
            ? '¿Rechazar este turno? El cliente verá la cita como cancelada.'
            : '¿Aceptar este turno?';
        if (!confirm(confirmMsg)) return;
        btn.disabled = true;
        putSinBody(API_BASE + '/talleres/' + u.tallerId + '/citas/' + citaId + '/' + endpoint)
          .then(function (result) {
            btn.disabled = false;
            if (result.ok) cargarTurnos();
            else alert(result.data && result.data.message ? result.data.message : 'Error al guardar.');
          })
          .catch(function () {
            btn.disabled = false;
            alert('Error de conexión.');
          });
      });
    });
  }

  function renderDetalle(cita) {
    if (!detailContent) return;
    document.querySelectorAll('.appointment-card').forEach(function (el) {
      el.classList.remove('appointment-card-selected');
    });
    if (!cita) {
      detailContent.innerHTML =
        '<div class="detail-placeholder">' +
        '<i class="far fa-calendar-alt"></i>' +
        '<p>Seleccioná un turno en la tabla o en el calendario para ver los detalles</p>' +
        '</div>';
      return;
    }

    var estado = (cita.estado || '').toString();
    var estClass = estado.toLowerCase().replace('_', '-');
    var tallerRow = cita.tallerNombre
      ? '<dt>Taller</dt><dd>' + escapeHtml(cita.tallerNombre) + '</dd>'
      : '';

    detailContent.innerHTML =
      '<div class="detail-panel-inner">' +
      '<div class="detail-id">Turno #' + escapeHtml(cita.id) + '</div>' +
      '<div class="detail-estado-wrap"><span class="badge-estado ' + estClass + '">' + escapeHtml(etiquetaEstado(estado)) + '</span></div>' +
      '<dl class="detail-dl">' +
      tallerRow +
      '<dt>Fecha y hora</dt><dd>' + escapeHtml(formatoFechaHora(cita.fechaHora)) + '</dd>' +
      '<dt>Cliente</dt><dd>' + escapeHtml(cita.clienteNombre || '—') + '</dd>' +
      '<dt>Vehículo</dt><dd>' + escapeHtml(cita.vehiculoMarcaModelo || '—') + '</dd>' +
      '<dt>Motivo / notas</dt><dd>' + escapeHtml(cita.descripcion || '—') + '</dd>' +
      '</dl>' +
      htmlAccionesDetalle(cita) +
      '</div>';

    enlazarDetalleAcciones();

    document.querySelectorAll('.appointment-card[data-cita-id="' + String(cita.id) + '"]').forEach(function (el) {
      el.classList.add('appointment-card-selected');
    });
  }

  function seleccionarCita(id) {
    selectedCitaId = id;
    var cita = encontrarCitaPorId(id);
    renderDetalle(cita);
    document.querySelectorAll('.turno-fila').forEach(function (tr) {
      tr.classList.toggle('turno-fila-seleccionada', String(tr.getAttribute('data-cita-id')) === String(id));
    });
  }

  function renderTabla(titulo, badgeCount, filasHtml) {
    return (
      '<div class="turnos-bloque">' +
      '<h3 class="turnos-bloque-titulo">' + escapeHtml(titulo) +
      (badgeCount != null ? '<span class="badge-count">' + badgeCount + '</span>' : '') +
      '</h3>' +
      '<div class="turnos-tabla-wrap">' +
      '<table class="turnos-tabla">' +
      '<thead><tr>' +
      '<th>Fecha / hora</th>' +
      '<th>Cliente</th>' +
      '<th>Vehículo</th>' +
      '<th>Motivo</th>' +
      '<th>Estado</th>' +
      '<th style="min-width:200px;">Acciones</th>' +
      '</tr></thead><tbody>' +
      filasHtml +
      '</tbody></table></div></div>'
    );
  }

  function filaVacia(msg) {
    return '<tr><td colspan="6" style="padding:16px;color:#7f8c8d;">' + escapeHtml(msg) + '</td></tr>';
  }

  function enlazarAccionesTabla(u) {
    if (!listEl) return;

    listEl.querySelectorAll('.btn-aceptar, .btn-rechazar').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var citaId = this.getAttribute('data-cita-id');
        var accion = this.getAttribute('data-accion');
        if (!citaId || !accion) return;
        var endpoint = accion === 'aceptar' ? 'aceptar' : 'rechazar';
        var confirmMsg = accion === 'rechazar'
          ? '¿Rechazar este turno? El cliente verá la cita como cancelada.'
          : '¿Aceptar este turno?';
        if (!confirm(confirmMsg)) return;
        this.disabled = true;
        putSinBody(API_BASE + '/talleres/' + u.tallerId + '/citas/' + citaId + '/' + endpoint)
          .then(function (result) {
            this.disabled = false;
            if (result.ok) {
              cargarTurnos();
            } else {
              alert(result.data && result.data.message ? result.data.message : 'Error al guardar.');
            }
          }.bind(this))
          .catch(function () {
            this.disabled = false;
            alert('Error de conexión.');
          }.bind(this));
      });
    });

    listEl.querySelectorAll('.btn-en-curso').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var citaId = this.getAttribute('data-cita-id');
        if (!citaId) return;
        if (!confirm('¿Iniciar este turno? Quedará en curso y el cliente lo verá en su tablero en "En progreso".')) return;
        this.disabled = true;
        putSinBody(API_BASE + '/talleres/' + u.tallerId + '/citas/' + citaId + '/en-curso')
          .then(function (result) {
            this.disabled = false;
            if (result.ok) {
              cargarTurnos();
            } else {
              alert(result.data && result.data.message ? result.data.message : 'Error al actualizar.');
            }
          }.bind(this))
          .catch(function () {
            this.disabled = false;
            alert('Error de conexión.');
          }.bind(this));
      });
    });

    listEl.querySelectorAll('.btn-completar').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var citaId = this.getAttribute('data-cita-id');
        document.getElementById('completarCitaId').value = citaId;
        document.getElementById('completarDescripcion').value = '';
        document.getElementById('completarKilometraje').value = '';
        document.getElementById('completarCosto').value = '';
        modalCompletar.classList.add('show');
      });
    });

    listEl.querySelectorAll('tr.turno-fila').forEach(function (tr) {
      tr.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        var id = tr.getAttribute('data-cita-id');
        if (id) seleccionarCita(id);
      });
    });
  }

  function construirListadoHtml(citas) {
    var pendientes = citas.filter(function (c) { return (c.estado || '') === 'PENDIENTE'; });
    pendientes.sort(function (a, b) { return new Date(a.fechaHora) - new Date(b.fechaHora); });

    var otros = citas.filter(function (c) { return (c.estado || '') !== 'PENDIENTE'; });

    var htmlPend = '';
    if (pendientes.length === 0) {
      htmlPend = filaVacia('No hay solicitudes pendientes en este filtro.');
    } else {
      pendientes.forEach(function (c) {
        var estado = (c.estado || '').toString();
        htmlPend +=
          '<tr class="turno-fila" data-cita-id="' + c.id + '">' +
          '<td>' + escapeHtml(formatoFechaHora(c.fechaHora)) + '</td>' +
          '<td>' + escapeHtml(c.clienteNombre || '—') + '</td>' +
          '<td>' + escapeHtml(c.vehiculoMarcaModelo || '') + '</td>' +
          '<td>' + escapeHtml(c.descripcion || '—') + '</td>' +
          '<td><span class="badge-estado ' + estado.toLowerCase().replace('_', '-') + '">' + escapeHtml(etiquetaEstado(estado)) + '</span></td>' +
          '<td><div class="turnos-acciones">' +
          '<button type="button" class="btn-aceptar" data-accion="aceptar" data-cita-id="' + c.id + '"><i class="fas fa-check"></i> Aceptar</button>' +
          '<button type="button" class="btn-rechazar" data-accion="rechazar" data-cita-id="' + c.id + '"><i class="fas fa-times"></i> Rechazar</button>' +
          '</div></td></tr>';
      });
    }

    var htmlOtros = '';
    if (otros.length === 0) {
      htmlOtros = filaVacia('No hay otros turnos en este filtro.');
    } else {
      otros.forEach(function (c) {
        var estado = (c.estado || '').toString();
        var acciones = '';
        if (estado === 'CONFIRMADA') {
          acciones =
            '<button type="button" class="btn-en-curso" data-cita-id="' + c.id + '">' +
            '<i class="fas fa-play"></i> Iniciar</button>' +
            '<button type="button" class="btn-completar" data-cita-id="' + c.id + '">' +
            '<i class="fas fa-wrench"></i> Completar</button>';
        } else if (estado === 'EN_CURSO') {
          acciones =
            '<button type="button" class="btn-completar" data-cita-id="' + c.id + '">' +
            '<i class="fas fa-wrench"></i> Completar</button>';
        } else {
          acciones = '<span style="color:#95a5a6;font-size:0.85rem;">—</span>';
        }
        htmlOtros +=
          '<tr class="turno-fila" data-cita-id="' + c.id + '">' +
          '<td>' + escapeHtml(formatoFechaHora(c.fechaHora)) + '</td>' +
          '<td>' + escapeHtml(c.clienteNombre || '—') + '</td>' +
          '<td>' + escapeHtml(c.vehiculoMarcaModelo || '') + '</td>' +
          '<td>' + escapeHtml(c.descripcion || '—') + '</td>' +
          '<td><span class="badge-estado ' + estado.toLowerCase().replace('_', '-') + '">' + escapeHtml(etiquetaEstado(estado)) + '</span></td>' +
          '<td><div class="turnos-acciones">' + acciones + '</div></td>' +
          '</tr>';
      });
    }

    return (
      renderTabla('Solicitudes pendientes', pendientes.length, htmlPend) +
      renderTabla('Demás turnos', otros.length, htmlOtros)
    );
  }

  function actualizarVista() {
    var u = getUsuario();
    if (!u || !u.tallerId) return;
    if (!weekStart) weekStart = inicioSemanaDomingo(hoySinHora());

    var cache = Array.isArray(citasCache) ? citasCache : [];
    var visibles = filtrarCitas(cache);
    renderCalendario(visibles);

    if (!listEl) return;

    if (cache.length === 0) {
      listEl.innerHTML = '<p style="color:#7f8c8d;">No hay turnos registrados.</p>';
      selectedCitaId = null;
      renderDetalle(null);
      return;
    }

    if (visibles.length === 0) {
      listEl.innerHTML = '<p style="color:#7f8c8d;">Ningún turno coincide con la búsqueda o los filtros.</p>';
      selectedCitaId = null;
      renderDetalle(null);
      return;
    }

    var selStill = visibles.some(function (c) { return String(c.id) === String(selectedCitaId); });
    if (!selStill) selectedCitaId = null;

    listEl.innerHTML = construirListadoHtml(visibles);
    enlazarAccionesTabla(u);
    renderDetalle(encontrarCitaPorId(selectedCitaId));
    if (selectedCitaId) {
      document.querySelectorAll('.turno-fila').forEach(function (tr) {
        tr.classList.toggle('turno-fila-seleccionada', String(tr.getAttribute('data-cita-id')) === String(selectedCitaId));
      });
    }
  }

  function mensajeDesdeRespuestaApi(data) {
    if (!data || typeof data !== 'object') return null;
    if (typeof data.message === 'string' && data.message) return data.message;
    if (typeof data.detail === 'string' && data.detail) return data.detail;
    if (typeof data.error === 'string' && data.error) return data.error;
    if (Array.isArray(data.errors) && data.errors.length) {
      var parts = data.errors.map(function (e) {
        return (e && (e.defaultMessage || e.message)) ? (e.defaultMessage || e.message) : '';
      }).filter(Boolean);
      if (parts.length) return parts.join(' ');
    }
    return null;
  }

  function cargarTurnos() {
    var u = getUsuario();
    if (!u || !u.tallerId) return;
    if (!weekStart) weekStart = inicioSemanaDomingo(hoySinHora());

    var url = API_BASE + '/talleres/' + u.tallerId + '/citas';
    fetch(url)
      .then(function (r) {
        return r.text().then(function (text) {
          var data = null;
          try {
            data = text ? JSON.parse(text) : null;
          } catch (ignore) {
            data = null;
          }
          return { ok: r.ok, data: data, status: r.status };
        });
      })
      .then(function (res) {
        if (res.ok && Array.isArray(res.data)) {
          citasCache = res.data;
          actualizarVista();
          return;
        }
        var msg = mensajeDesdeRespuestaApi(res.data) || ('Error al cargar turnos (HTTP ' + res.status + ').');
        var teniaLista = Array.isArray(citasCache) && citasCache.length > 0;
        if (teniaLista) {
          actualizarVista();
          console.warn('cargarTurnos:', msg);
        } else {
          if (listEl) listEl.innerHTML = '<p style="color:#e74c3c;">' + escapeHtml(msg) + '</p>';
          if (calendarGrid) calendarGrid.innerHTML = '';
          renderDetalle(null);
        }
      })
      .catch(function () {
        var teniaLista = Array.isArray(citasCache) && citasCache.length > 0;
        if (teniaLista) {
          actualizarVista();
          console.warn('cargarTurnos: error de red');
        } else {
          if (listEl) listEl.innerHTML = '<p style="color:#e74c3c;">Error de red al cargar turnos.</p>';
          if (calendarGrid) calendarGrid.innerHTML = '';
          renderDetalle(null);
        }
      });
  }

  if (formCompletar) {
    formCompletar.addEventListener('submit', function (e) {
      e.preventDefault();
      var u = getUsuario();
      if (!u || !u.tallerId) return;
      var citaId = document.getElementById('completarCitaId').value;
      if (!citaId) return;
      var body = {
        descripcion: document.getElementById('completarDescripcion').value.trim(),
        kilometrajeMomento: document.getElementById('completarKilometraje').value.trim() || null,
        costo: document.getElementById('completarCosto').value ? parseFloat(document.getElementById('completarCosto').value) : null
      };
      var btn = formCompletar.querySelector('button[type="submit"]');
      btn.disabled = true;
      fetch(API_BASE + '/talleres/' + u.tallerId + '/citas/' + citaId + '/completar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
        .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
        .then(function (result) {
          btn.disabled = false;
          if (result.ok) {
            modalCompletar.classList.remove('show');
            cargarTurnos();
          } else {
            alert(result.data.message || 'Error al completar el turno.');
          }
        })
        .catch(function () {
          btn.disabled = false;
          alert('Error de conexión.');
        });
    });
  }

  if (document.getElementById('closeModalCompletar') && modalCompletar) {
    document.getElementById('closeModalCompletar').addEventListener('click', function () {
      modalCompletar.classList.remove('show');
    });
  }
  if (document.getElementById('btnCancelarCompletar') && modalCompletar) {
    document.getElementById('btnCancelarCompletar').addEventListener('click', function () {
      modalCompletar.classList.remove('show');
    });
  }

  var btnNuevoTurno = document.getElementById('new-appointment');
  var modalNuevoTurno = document.getElementById('appointment-modal');
  var formNuevoTurno = document.getElementById('appointment-form');

  function abrirModalNuevoTurno() {
    if (!modalNuevoTurno) return;
    if (formNuevoTurno) formNuevoTurno.reset();
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    var dateIn = document.getElementById('appointment-date-input');
    var timeIn = document.getElementById('appointment-time-input');
    if (dateIn) dateIn.value = y + '-' + m + '-' + day;
    if (timeIn) timeIn.value = '09:00';
    modalNuevoTurno.classList.add('show');
  }

  function cerrarModalNuevoTurno() {
    if (modalNuevoTurno) modalNuevoTurno.classList.remove('show');
  }

  if (btnNuevoTurno && modalNuevoTurno) {
    btnNuevoTurno.addEventListener('click', abrirModalNuevoTurno);
  }

  var btnCloseNuevoTurno = document.getElementById('close-modal');
  if (btnCloseNuevoTurno && modalNuevoTurno) {
    btnCloseNuevoTurno.addEventListener('click', cerrarModalNuevoTurno);
  }

  var btnCancelarNuevoTurno = document.getElementById('btn-cancelar-nuevo-turno');
  if (btnCancelarNuevoTurno) {
    btnCancelarNuevoTurno.addEventListener('click', cerrarModalNuevoTurno);
  }

  if (formNuevoTurno) {
    formNuevoTurno.addEventListener('submit', function (e) {
      e.preventDefault();
      var u = getUsuario();
      if (!u || !u.tallerId) return;
      var nombre = document.getElementById('manual-client-name').value.trim();
      var tel = document.getElementById('manual-client-phone').value.trim();
      var veh = document.getElementById('manual-vehicle-text').value.trim();
      var fecha = document.getElementById('appointment-date-input').value;
      var hora = document.getElementById('appointment-time-input').value;
      var notas = document.getElementById('appointment-notes-input').value.trim();
      if (!fecha || !hora) {
        alert('Completá fecha y hora.');
        return;
      }
      var horaNorm = hora.length === 5 ? hora + ':00' : hora;
      var body = {
        nombreCliente: nombre,
        telefono: tel || null,
        vehiculoTexto: veh,
        fechaHora: fecha + 'T' + horaNorm,
        descripcion: notas || null
      };
      var submitBtn = formNuevoTurno.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      fetch(API_BASE + '/talleres/' + u.tallerId + '/citas/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
        .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
        .then(function (result) {
          if (submitBtn) submitBtn.disabled = false;
          if (result.ok) {
            cerrarModalNuevoTurno();
            cargarTurnos();
          } else {
            alert(mensajeDesdeRespuestaApi(result.data) || 'No se pudo guardar el turno.');
          }
        })
        .catch(function () {
          if (submitBtn) submitBtn.disabled = false;
          alert('Error de conexión o respuesta inválida del servidor.');
        });
    });
  }

  var busquedaTurnos = document.getElementById('busquedaTurnos');
  if (busquedaTurnos) {
    busquedaTurnos.addEventListener('input', function () {
      filtros.texto = (busquedaTurnos.value || '').trim();
      actualizarVista();
    });
  }

  var dateFilterEl = document.getElementById('date-filter');
  if (dateFilterEl) {
    filtros.date = dateFilterEl.value;
    dateFilterEl.addEventListener('change', function () {
      filtros.date = dateFilterEl.value;
      actualizarVista();
    });
  }

  var statusFilterEl = document.getElementById('status-filter');
  if (statusFilterEl) {
    filtros.status = statusFilterEl.value;
    statusFilterEl.addEventListener('change', function () {
      filtros.status = statusFilterEl.value;
      actualizarVista();
    });
  }

  var prevWeek = document.getElementById('prev-week');
  var nextWeek = document.getElementById('next-week');
  if (prevWeek) {
    prevWeek.addEventListener('click', function () {
      if (!weekStart) weekStart = inicioSemanaDomingo(hoySinHora());
      weekStart = addDays(weekStart, -7);
      actualizarVista();
    });
  }
  if (nextWeek) {
    nextWeek.addEventListener('click', function () {
      if (!weekStart) weekStart = inicioSemanaDomingo(hoySinHora());
      weekStart = addDays(weekStart, 7);
      actualizarVista();
    });
  }

  var prevMonth = document.getElementById('prev-month');
  var nextMonth = document.getElementById('next-month');
  if (prevMonth) {
    prevMonth.addEventListener('click', function () {
      if (!weekStart) weekStart = inicioSemanaDomingo(hoySinHora());
      var a = mesAnclaSemana(weekStart);
      var nm = a.m - 1;
      var ny = a.y;
      if (nm < 0) {
        nm = 11;
        ny -= 1;
      }
      var w = primeraSemanaDelMes(ny, nm);
      weekStart = new Date(w.getFullYear(), w.getMonth(), w.getDate());
      actualizarVista();
    });
  }
  if (nextMonth) {
    nextMonth.addEventListener('click', function () {
      if (!weekStart) weekStart = inicioSemanaDomingo(hoySinHora());
      var a = mesAnclaSemana(weekStart);
      var nm = a.m + 1;
      var ny = a.y;
      if (nm > 11) {
        nm = 0;
        ny += 1;
      }
      var w = primeraSemanaDelMes(ny, nm);
      weekStart = new Date(w.getFullYear(), w.getMonth(), w.getDate());
      actualizarVista();
    });
  }

  var calBtnHoy = document.getElementById('cal-btn-hoy');
  if (calBtnHoy) {
    calBtnHoy.addEventListener('click', function () {
      weekStart = inicioSemanaDomingo(hoySinHora());
      actualizarVista();
    });
  }

  var calGoDate = document.getElementById('cal-go-date');
  if (calGoDate) {
    calGoDate.addEventListener('change', function () {
      var v = calGoDate.value;
      if (!v) return;
      var d = parseYmd(v);
      weekStart = inicioSemanaDomingo(d);
      calGoDate.value = '';
      actualizarVista();
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

  weekStart = inicioSemanaDomingo(hoySinHora());
  renderDetalle(null);
  cargarTurnos();
})();
