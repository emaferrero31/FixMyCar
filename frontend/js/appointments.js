(function () {
  var API_BASE = FixMyCar.API_BASE;
  var RECENT_TALLERES_KEY = 'fixmycar_recent_talleres_v1';
  var MAX_RECENT_TALLERES = 6;
  var form = document.getElementById('formCita');
  var citasList = document.getElementById('citasList');
  var selectTaller = document.getElementById('citaTaller');
  var selectVehiculo = document.getElementById('citaVehiculo');
  var inputFecha = document.getElementById('citaFecha');
  var inputDesc = document.getElementById('citaDescripcion');

  function getUsuario() {
    return FixMyCar.getUsuario();
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

  function getRecentTalleres() {
    try {
      var raw = localStorage.getItem(RECENT_TALLERES_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (ignore) {
      return [];
    }
  }

  function saveRecentTalleres(arr) {
    try {
      localStorage.setItem(RECENT_TALLERES_KEY, JSON.stringify(arr || []));
    } catch (ignore) {}
  }

  function addRecentTaller(tallerId, tallerNombre) {
    if (!tallerId) return;
    var idNum = parseInt(tallerId, 10);
    if (isNaN(idNum)) return;
    var prev = getRecentTalleres().filter(function (x) {
      return x && x.id !== idNum;
    });
    var next = [{ id: idNum, nombre: tallerNombre || 'Taller' }].concat(prev).slice(0, MAX_RECENT_TALLERES);
    saveRecentTalleres(next);
  }

  function parsePrefillFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var rawId = params.get('tallerId');
    var id = rawId ? parseInt(rawId, 10) : null;
    if (!id || isNaN(id)) return null;
    return {
      id: id,
      nombre: params.get('tallerNombre') || ''
    };
  }

  function renderOptionsTalleres(data, prefill) {
    selectTaller.innerHTML = '<option value="">Seleccionar taller...</option>';
    var all = Array.isArray(data) ? data : [];
    if (!all.length) return;

    var byId = {};
    all.forEach(function (t) {
      byId[t.id] = t;
    });

    var recents = getRecentTalleres();
    if (prefill && prefill.id) {
      addRecentTaller(prefill.id, prefill.nombre || (byId[prefill.id] && byId[prefill.id].nombreTaller) || 'Taller');
      recents = getRecentTalleres();
    }

    var recentIds = {};
    recents.forEach(function (r) {
      if (r && r.id) recentIds[r.id] = true;
    });

    var recentItems = recents
      .map(function (r) {
        return byId[r.id];
      })
      .filter(Boolean);
    if (recentItems.length) {
      var grpRecent = document.createElement('optgroup');
      grpRecent.label = 'Talleres recientes';
      recentItems.forEach(function (t) {
        var opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.nombreTaller || 'Taller';
        grpRecent.appendChild(opt);
      });
      selectTaller.appendChild(grpRecent);
    }

    var rest = all.filter(function (t) {
      return !recentIds[t.id];
    });
    if (rest.length) {
      var grpAll = document.createElement('optgroup');
      grpAll.label = 'Todos los talleres';
      rest.forEach(function (t) {
        var opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.nombreTaller || 'Taller';
        grpAll.appendChild(opt);
      });
      selectTaller.appendChild(grpAll);
    }

    if (prefill && prefill.id) {
      selectTaller.value = String(prefill.id);
    }
  }

  function cargarTalleres() {
    var prefill = parsePrefillFromUrl();
    fetch(API_BASE + '/talleres')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        renderOptionsTalleres(data || [], prefill);
        // Si llegamos desde "Buscar taller", abrimos el formulario listo para completar.
        if (prefill && prefill.id) {
          form.style.display = 'block';
          var minDate = new Date();
          minDate.setDate(minDate.getDate() + 1);
          inputFecha.min = minDate.toISOString().slice(0, 16);
          if (!inputFecha.value) inputFecha.focus();
        }
      })
      .catch(function () { selectTaller.innerHTML = '<option value="">Error al cargar talleres</option>'; });
  }

  function cargarVehiculos() {
    var u = getUsuario();
    if (!u || !u.id) return;
    fetch(API_BASE + '/clientes/' + u.id + '/vehiculos')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        selectVehiculo.innerHTML = '<option value="">Seleccionar vehículo...</option>';
        (data || []).forEach(function (v) {
          var opt = document.createElement('option');
          opt.value = v.id;
          opt.textContent = (v.marca || '') + ' ' + (v.modelo || '') + ' - ' + (v.patente || '');
          selectVehiculo.appendChild(opt);
        });
      })
      .catch(function () { selectVehiculo.innerHTML = '<option value="">Error al cargar vehículos</option>'; });
  }

  function cargarCitas() {
    var u = getUsuario();
    if (!u || !u.id) return;
    fetch(API_BASE + '/clientes/' + u.id + '/citas')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        citasList.innerHTML = '';
        if (!data || data.length === 0) {
          citasList.innerHTML = '<p style="color:#7f8c8d; padding:16px;">No tenés citas cargadas.</p>';
          return;
        }
        data.forEach(function (c) {
          var fecha = c.fechaHora ? new Date(c.fechaHora).toLocaleString('es-AR') : '';
          var card = document.createElement('div');
          card.className = 'vehicle-card';
          card.innerHTML =
            '<div class="vehicle-details">' +
            '  <div class="vehicle-title"><h4>' + escapeHtml(c.tallerNombre || '') + '</h4><span class="vehicle-year">' + escapeHtml(etiquetaEstado(c.estado)) + '</span></div>' +
            '  <div class="vehicle-info">' +
            '    <span><i class="fas fa-car"></i> ' + escapeHtml(c.vehiculoMarcaModelo || '') + '</span>' +
            '    <span><i class="fas fa-calendar"></i> ' + fecha + '</span>' +
            (c.descripcion ? '<span><i class="fas fa-comment"></i> ' + escapeHtml(c.descripcion) + '</span>' : '') +
            '  </div>' +
            '</div>';
          citasList.appendChild(card);
        });
      })
      .catch(function () {
        citasList.innerHTML = '<p style="color:#e74c3c;">Error al cargar citas.</p>';
      });
  }

  function escapeHtml(s) {
    if (!s) return '';
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

  document.getElementById('btnNuevaCita').addEventListener('click', function () {
    form.style.display = 'block';
    inputFecha.value = '';
    inputDesc.value = '';
    var minDate = new Date();
    minDate.setDate(minDate.getDate() + 1);
    inputFecha.min = minDate.toISOString().slice(0, 16);
  });

  document.getElementById('btnCancelarCita').addEventListener('click', function () {
    form.style.display = 'none';
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var u = getUsuario();
    if (!u || !u.id) return;
    var fechaVal = inputFecha.value;
    if (!fechaVal) return;
    var fechaHora = fechaVal.length === 16 ? fechaVal + ':00' : fechaVal;
    var body = {
      vehiculoId: parseInt(selectVehiculo.value, 10),
      tallerId: parseInt(selectTaller.value, 10),
      fechaHora: fechaHora,
      descripcion: inputDesc.value.trim() || null
    };
    var tallerNombreSel = '';
    if (selectTaller && selectTaller.selectedOptions && selectTaller.selectedOptions[0]) {
      tallerNombreSel = selectTaller.selectedOptions[0].textContent || '';
    }
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    fetch(API_BASE + '/clientes/' + u.id + '/citas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
      .then(function (result) {
        btn.disabled = false;
        if (result.ok) {
          addRecentTaller(body.tallerId, tallerNombreSel);
          form.style.display = 'none';
          cargarTalleres();
          cargarCitas();
        } else {
          alert(result.data.message || 'Error al solicitar turno');
        }
      })
      .catch(function () {
        btn.disabled = false;
        alert('Error de conexión');
      });
  });

  var u = getUsuario();
  if (!u) {
    window.location.href = 'login.html';
    return;
  }
  if (u.role !== 'CLIENTE') {
    window.location.href = 'dashboard.html';
    return;
  }

  renderUsuario();
  cargarTalleres();
  cargarVehiculos();
  cargarCitas();
})();
