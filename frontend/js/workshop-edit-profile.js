(function () {
  var API_BASE = FixMyCar.API_BASE;

  function getUsuario() {
    return FixMyCar.getUsuario();
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

  var PROMO_KEY = 'fixmycar_taller_promo_' + u.tallerId;

  var ETIQUETAS_SERVICIO = [
    { id: 'motor', label: 'Motor' },
    { id: 'suspension', label: 'Suspensión' },
    { id: 'gomas', label: 'Gomas y neumáticos' },
    { id: 'frenos', label: 'Frenos' },
    { id: 'lubricacion', label: 'Lubricación y filtros' },
    { id: 'electricidad', label: 'Electricidad' },
    { id: 'climatizacion', label: 'Climatización / Aire acondicionado' },
    { id: 'chapa_pintura', label: 'Chapa y pintura' },
    { id: 'diagnostico', label: 'Diagnóstico computarizado' },
    { id: 'transmision', label: 'Transmisión / Caja de cambios' },
    { id: 'alineacion', label: 'Alineación y balanceo' },
    { id: 'bateria', label: 'Batería' },
    { id: 'escape', label: 'Escape' },
    { id: 'tren_delantero', label: 'Tren delantero y dirección' },
    { id: 'embrague', label: 'Embrague' },
    { id: 'inyeccion', label: 'Inyección' }
  ];

  var IDS_PROMO_TEXTO = [
    'workshopWebsite',
    'googleMapsLink',
    'workshopDescription',
    'whatsappNumber',
    'facebookUrl',
    'instagramUrl',
    'twitterUrl'
  ];

  function leerPromoLocal() {
    try {
      var raw = localStorage.getItem(PROMO_KEY);
      if (!raw) return {};
      var o = JSON.parse(raw);
      return typeof o === 'object' && o ? o : {};
    } catch (ignore) {
      return {};
    }
  }

  var DIAS_SEMANA = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo'
  ];

  function limpiarHorariosUI() {
    var sc = document.getElementById('scheduleContainer');
    if (sc) sc.innerHTML = '';
  }

  function opcionesDiasSelect(valorSeleccionado) {
    return DIAS_SEMANA.map(function (dia) {
      var sel = valorSeleccionado === dia ? ' selected' : '';
      return '<option value="' + dia + '"' + sel + '>' + dia + '</option>';
    }).join('');
  }

  /** Formato anterior: un solo día y un tramo horario. */
  function crearFilaHorarioLegacy(d) {
    d = d || {};
    var wrap = document.createElement('div');
    wrap.className = 'schedule-item schedule-item-legacy';
    var opts = opcionesDiasSelect(d.dia || 'Lunes');
    wrap.innerHTML =
      '<button type="button" class="btn-remove-schedule" aria-label="Quitar horario">&times;</button>' +
      '<div class="time-range">' +
      '<div class="form-group"><label>Día</label><select class="form-control schedule-day">' +
      opts +
      '</select></div>' +
      '<div class="form-group"><label>Desde</label><input type="time" class="form-control schedule-from" value="' +
      (d.desde || d.apertura || '') +
      '"></div>' +
      '<div class="form-group"><label>Hasta</label><input type="time" class="form-control schedule-to" value="' +
      (d.hasta || d.cierre || '') +
      '"></div></div>';
    return wrap;
  }

  /**
   * Rango de días (ej. Lunes–Viernes) + una o dos franjas (siesta opcional).
   */
  function crearFilaHorario(datos) {
    var d = datos || {};
    if (d.dia && !d.diaDesde && !(Array.isArray(d.tramos) && d.tramos.length)) {
      return crearFilaHorarioLegacy(d);
    }

    var dd = d.diaDesde || 'Lunes';
    var dh = d.diaHasta != null && d.diaHasta !== '' ? d.diaHasta : 'Viernes';
    var tr = Array.isArray(d.tramos) && d.tramos.length ? d.tramos.slice() : [];
    if (!tr.length) {
      tr.push({
        desde: d.desde || d.apertura || '09:00',
        hasta: d.hasta || d.cierre || '18:00'
      });
    }
    var t1 = tr[0] || { desde: '09:00', hasta: '13:00' };
    var t2 = tr[1] || { desde: '15:00', hasta: '18:00' };
    var dosTramos = tr.length > 1;

    var wrap = document.createElement('div');
    wrap.className = 'schedule-item schedule-item-rango';
    wrap.innerHTML =
      '<button type="button" class="btn-remove-schedule" aria-label="Quitar horario">&times;</button>' +
      '<p class="schedule-range-title">Días de atención</p>' +
      '<div class="schedule-days-range">' +
      '<div class="form-group"><label>Desde el</label><select class="form-control schedule-dia-desde">' +
      opcionesDiasSelect(dd) +
      '</select></div>' +
      '<div class="form-group"><label>hasta el</label><select class="form-control schedule-dia-hasta">' +
      opcionesDiasSelect(dh) +
      '</select></div></div>' +
      '<div class="schedule-tramos">' +
      '<div class="form-group schedule-tramo-line"><label>1.ª franja</label>' +
      '<div class="schedule-time-pair">' +
      '<input type="time" class="form-control schedule-t1-from" value="' +
      (t1.desde || '') +
      '">' +
      '<span class="schedule-time-sep">a</span>' +
      '<input type="time" class="form-control schedule-t1-to" value="' +
      (t1.hasta || '') +
      '">' +
      '</div></div>' +
      '<label class="schedule-split-label">' +
      '<input type="checkbox" class="schedule-split"' +
      (dosTramos ? ' checked' : '') +
      '> Cierre al mediodía: agregar 2.ª franja por la tarde</label>' +
      '<div class="form-group schedule-tramo-line schedule-tramo-t2"' +
      (dosTramos ? '' : ' style="display:none;"') +
      '><label>2.ª franja</label>' +
      '<div class="schedule-time-pair">' +
      '<input type="time" class="form-control schedule-t2-from" value="' +
      (dosTramos ? (t2.desde || '') : '') +
      '">' +
      '<span class="schedule-time-sep">a</span>' +
      '<input type="time" class="form-control schedule-t2-to" value="' +
      (dosTramos ? (t2.hasta || '') : '') +
      '">' +
      '</div></div></div>';

    var cb = wrap.querySelector('.schedule-split');
    var t2block = wrap.querySelector('.schedule-tramo-t2');
    if (cb && t2block) {
      cb.addEventListener('change', function () {
        t2block.style.display = cb.checked ? '' : 'none';
        if (!cb.checked) {
          var a = t2block.querySelector('.schedule-t2-from');
          var b = t2block.querySelector('.schedule-t2-to');
          if (a) a.value = '';
          if (b) b.value = '';
        }
      });
    }
    return wrap;
  }

  function aplicarHorariosDesdePromo(o) {
    limpiarHorariosUI();
    var sc = document.getElementById('scheduleContainer');
    if (!sc) return;
    var list = o.horarios;
    if (!Array.isArray(list) || !list.length) return;
    list.forEach(function (h) {
      if (typeof h === 'string') {
        var wrap = document.createElement('div');
        wrap.className = 'schedule-item';
        wrap.innerHTML =
          '<button type="button" class="btn-remove-schedule" aria-label="Quitar horario">&times;</button>' +
          '<div class="form-group"><label>Horario</label>' +
          '<input type="text" class="form-control schedule-free-text" placeholder="Ej: Lun a Vie 9–18"></div>';
        var inp = wrap.querySelector('.schedule-free-text');
        if (inp) inp.value = h;
        sc.appendChild(wrap);
        return;
      }
      sc.appendChild(crearFilaHorario(h));
    });
  }

  function recolectarHorarios() {
    var out = [];
    document.querySelectorAll('#scheduleContainer .schedule-item').forEach(function (row) {
      var free = row.querySelector('.schedule-free-text');
      if (free) {
        var t = free.value.trim();
        if (t) out.push(t);
        return;
      }
      var diaDesde = row.querySelector('.schedule-dia-desde');
      if (diaDesde) {
        var diaHasta = row.querySelector('.schedule-dia-hasta');
        var t1f = row.querySelector('.schedule-t1-from');
        var t1t = row.querySelector('.schedule-t1-to');
        var splitCb = row.querySelector('.schedule-split');
        var t2f = row.querySelector('.schedule-t2-from');
        var t2t = row.querySelector('.schedule-t2-to');
        var dd = diaDesde.value.trim();
        var dh = diaHasta ? diaHasta.value.trim() : dd;
        var a1 = t1f ? t1f.value : '';
        var b1 = t1t ? t1t.value : '';
        if (!dd || !dh || !a1 || !b1) return;
        var tramos = [{ desde: a1, hasta: b1 }];
        if (splitCb && splitCb.checked && t2f && t2t) {
          var a2 = t2f.value;
          var b2 = t2t.value;
          if (a2 && b2) tramos.push({ desde: a2, hasta: b2 });
        }
        out.push({ diaDesde: dd, diaHasta: dh, tramos: tramos });
        return;
      }
      var dia = row.querySelector('.schedule-day');
      var desde = row.querySelector('.schedule-from');
      var hasta = row.querySelector('.schedule-to');
      if (!dia || !desde || !hasta) return;
      var d = dia.value.trim();
      var ds = desde.value;
      var hs = hasta.value;
      if (!d && !ds && !hs) return;
      out.push({ dia: d || '—', desde: ds || '', hasta: hs || '' });
    });
    return out;
  }

  function etiquetaIdValida(id) {
    return ETIQUETAS_SERVICIO.some(function (t) {
      return t.id === id;
    });
  }

  function normalizarEntradaServicio(s) {
    if (typeof s === 'string') {
      var t = s.trim();
      return etiquetaIdValida(t) ? t : null;
    }
    if (s && typeof s.etiqueta === 'string' && etiquetaIdValida(s.etiqueta.trim())) {
      return s.etiqueta.trim();
    }
    if (s && (s.nombre || s.name)) {
      var n = String(s.nombre || s.name)
        .trim()
        .toLowerCase();
      for (var i = 0; i < ETIQUETAS_SERVICIO.length; i++) {
        var e = ETIQUETAS_SERVICIO[i];
        if (e.id === n || e.label.toLowerCase() === n) return e.id;
      }
    }
    return null;
  }

  function normalizarListaServicios(list) {
    if (!Array.isArray(list)) return [];
    var out = [];
    var seen = {};
    list.forEach(function (item) {
      var id = normalizarEntradaServicio(item);
      if (id && !seen[id]) {
        seen[id] = true;
        out.push(id);
      }
    });
    return out;
  }

  function recolectarServicios() {
    var wrap = document.getElementById('serviceTagsPicker');
    if (!wrap) return [];
    var out = [];
    wrap.querySelectorAll('.service-tag-btn.selected').forEach(function (b) {
      var id = b.getAttribute('data-tag-id');
      if (id && etiquetaIdValida(id)) out.push(id);
    });
    return out;
  }

  function recolectarGaleriaDataUrls() {
    var urls = [];
    document.querySelectorAll('#galleryContainer .gallery-item img').forEach(function (img) {
      if (img.src && img.src.indexOf('data:image') === 0) urls.push(img.src);
    });
    return urls;
  }

  function recolectarPromoDelFormulario() {
    var o = {};
    IDS_PROMO_TEXTO.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) o[id] = el.value.trim();
    });
    var c = document.getElementById('coverPreview');
    if (c && c.src && c.src.indexOf('data:image') === 0) o.coverDataUrl = c.src;
    var a = document.getElementById('avatarPreview');
    if (a && a.src && a.src.indexOf('data:image') === 0) o.logoDataUrl = a.src;
    o.horarios = recolectarHorarios();
    o.servicios = recolectarServicios();
    o.galeriaDataUrls = recolectarGaleriaDataUrls();
    return o;
  }

  function aplicarPromoAlFormulario(o) {
    IDS_PROMO_TEXTO.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && o[id] != null && o[id] !== '') el.value = String(o[id]);
    });
    if (o.coverDataUrl) {
      var c = document.getElementById('coverPreview');
      if (c) c.src = o.coverDataUrl;
    }
    if (o.logoDataUrl) {
      var a = document.getElementById('avatarPreview');
      if (a) a.src = o.logoDataUrl;
    }
    aplicarHorariosDesdePromo(o);
    aplicarServiciosDesdePromo(o);
    aplicarGaleriaDesdePromo(o);
  }

  function getGalleryUploadAnchor() {
    return document.querySelector('#galleryContainer .gallery-upload');
  }

  function buildServiceTagsPicker() {
    var wrap = document.getElementById('serviceTagsPicker');
    if (!wrap || wrap.getAttribute('data-built') === '1') return;
    wrap.setAttribute('data-built', '1');
    ETIQUETAS_SERVICIO.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'service-tag-btn';
      b.setAttribute('data-tag-id', t.id);
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute(
        'title',
        'Tocá para marcar o quitar: ' + t.label
      );
      b.textContent = t.label;
      wrap.appendChild(b);
    });
    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.service-tag-btn');
      if (!btn) return;
      btn.classList.toggle('selected');
      btn.setAttribute('aria-pressed', btn.classList.contains('selected') ? 'true' : 'false');
    });
  }

  function aplicarServiciosDesdePromo(o) {
    buildServiceTagsPicker();
    var wrap = document.getElementById('serviceTagsPicker');
    if (!wrap) return;
    wrap.querySelectorAll('.service-tag-btn').forEach(function (b) {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed', 'false');
    });
    var ids = normalizarListaServicios(o.servicios);
    ids.forEach(function (id) {
      var btn = wrap.querySelector('.service-tag-btn[data-tag-id="' + id + '"]');
      if (btn) {
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
      }
    });
  }

  function limpiarGaleriaItems() {
    document.querySelectorAll('#galleryContainer .gallery-item').forEach(function (n) {
      n.remove();
    });
  }

  function crearGalleryItem(dataUrl) {
    var item = document.createElement('div');
    item.className = 'gallery-item';
    item.innerHTML =
      '<img alt="Galería">' +
      '<div class="gallery-item-actions">' +
      '<button type="button" class="btn btn-delete btn-remove-gallery" aria-label="Quitar foto"><i class="fas fa-trash"></i></button>' +
      '</div>';
    var img = item.querySelector('img');
    if (img) img.src = dataUrl;
    return item;
  }

  function aplicarGaleriaDesdePromo(o) {
    limpiarGaleriaItems();
    var anchor = getGalleryUploadAnchor();
    var gc = document.getElementById('galleryContainer');
    if (!gc || !anchor) return;
    var urls = o.galeriaDataUrls;
    if (!Array.isArray(urls)) return;
    urls.forEach(function (src) {
      if (src && String(src).indexOf('data:image') === 0) {
        gc.insertBefore(crearGalleryItem(src), anchor);
      }
    });
  }

  function guardarPromoLocal() {
    try {
      localStorage.setItem(PROMO_KEY, JSON.stringify(recolectarPromoDelFormulario()));
    } catch (e) {
      if (e && e.name === 'QuotaExceededError') {
        alert('Las imágenes ocupan demasiado espacio en el navegador. Probá con fotos más chicas o quitá la portada/logo.');
      }
    }
  }

  function previewArchivoEnImg(input, imgEl) {
    if (!input || !input.files || !input.files[0] || !imgEl) return;
    var reader = new FileReader();
    reader.onload = function () {
      imgEl.src = reader.result;
    };
    reader.readAsDataURL(input.files[0]);
  }

  var form = document.getElementById('editProfileForm');
  var inputName = document.getElementById('workshopName');
  var inputEmail = document.getElementById('workshopEmail');
  var inputPhone = document.getElementById('workshopPhone');
  var inputAddress = document.getElementById('workshopAddress');

  var changeCoverBtn = document.getElementById('changeCoverBtn');
  var coverUpload = document.getElementById('coverUpload');
  var coverPreview = document.getElementById('coverPreview');
  if (changeCoverBtn && coverUpload) {
    changeCoverBtn.addEventListener('click', function () {
      coverUpload.click();
    });
    coverUpload.addEventListener('change', function () {
      previewArchivoEnImg(coverUpload, coverPreview);
    });
  }

  var changeAvatarBtn = document.getElementById('changeAvatarBtn');
  var avatarUpload = document.getElementById('avatarUpload');
  var avatarPreview = document.getElementById('avatarPreview');
  if (changeAvatarBtn && avatarUpload) {
    changeAvatarBtn.addEventListener('click', function () {
      avatarUpload.click();
    });
    avatarUpload.addEventListener('change', function () {
      previewArchivoEnImg(avatarUpload, avatarPreview);
    });
  }

  var btnCancelar = document.getElementById('editProfileCancelar');
  if (btnCancelar) {
    btnCancelar.addEventListener('click', function () {
      window.location.href = 'workshop-mi-taller.html';
    });
  }

  var addScheduleBtn = document.getElementById('addScheduleBtn');
  var scheduleContainer = document.getElementById('scheduleContainer');
  if (addScheduleBtn && scheduleContainer) {
    addScheduleBtn.addEventListener('click', function () {
      scheduleContainer.appendChild(
        crearFilaHorario({
          diaDesde: 'Lunes',
          diaHasta: 'Viernes',
          tramos: [
            { desde: '09:00', hasta: '13:00' },
            { desde: '15:00', hasta: '18:00' }
          ]
        })
      );
    });
    scheduleContainer.addEventListener('click', function (e) {
      var btn = e.target.closest('.btn-remove-schedule');
      if (!btn) return;
      var row = btn.closest('.schedule-item');
      if (row) row.remove();
    });
  }

  var clearAllServiceTags = document.getElementById('clearAllServiceTags');
  if (clearAllServiceTags) {
    clearAllServiceTags.addEventListener('click', function () {
      buildServiceTagsPicker();
      var wrap = document.getElementById('serviceTagsPicker');
      if (!wrap) return;
      wrap.querySelectorAll('.service-tag-btn.selected').forEach(function (b) {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
    });
  }

  var uploadImageBtn = document.getElementById('uploadImageBtn');
  var imageUpload = document.getElementById('imageUpload');
  var galleryContainer = document.getElementById('galleryContainer');
  if (uploadImageBtn && imageUpload && galleryContainer) {
    uploadImageBtn.addEventListener('click', function () {
      imageUpload.click();
    });
    imageUpload.addEventListener('change', function () {
      var files = imageUpload.files;
      if (!files || !files.length) return;
      var anchor = getGalleryUploadAnchor();
      Array.prototype.forEach.call(files, function (file) {
        if (!file.type || file.type.indexOf('image') !== 0) return;
        var reader = new FileReader();
        reader.onload = function () {
          var item = crearGalleryItem(reader.result);
          if (anchor) galleryContainer.insertBefore(item, anchor);
        };
        reader.readAsDataURL(file);
      });
      imageUpload.value = '';
    });
    galleryContainer.addEventListener('click', function (e) {
      var del = e.target.closest('.btn-remove-gallery');
      if (!del) return;
      var item = del.closest('.gallery-item');
      if (item) item.remove();
    });
  }

  function cargarPerfil() {
    var promoLocal = leerPromoLocal();

    fetch(API_BASE + '/talleres/' + u.tallerId)
      .then(function (r) {
        if (!r.ok) return Promise.reject();
        return r.json();
      })
      .then(function (t) {
        if (inputName) inputName.value = t.nombreTaller || '';
        if (inputEmail) inputEmail.value = t.email || '';
        if (inputPhone) inputPhone.value = t.telefono || '';
        if (inputAddress) inputAddress.value = t.direccion || '';
        var merged = Object.assign({}, promoLocal, FixMyCar.parsePerfilPublicoJson(t.perfilPublicoJson));
        aplicarPromoAlFormulario(merged);
      })
      .catch(function () {
        aplicarPromoAlFormulario(promoLocal);
        alert('No se pudo cargar la información del taller.');
      });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var body = {
        nombreTaller: inputName ? inputName.value.trim() : '',
        email: inputEmail ? inputEmail.value.trim() : '',
        telefono: inputPhone ? inputPhone.value.trim() : '',
        direccion: inputAddress ? inputAddress.value.trim() : ''
      };

      var btnSubmit = form.querySelector('button[type="submit"]');
      if (btnSubmit) btnSubmit.disabled = true;

      fetch(API_BASE + '/talleres/' + u.tallerId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
        .then(function (r) {
          return r.json().then(function (data) {
            return { ok: r.ok, data: data };
          });
        })
        .then(function (res) {
          if (!res.ok) {
            if (btnSubmit) btnSubmit.disabled = false;
            alert(
              res.data && res.data.message
                ? res.data.message
                : 'No se pudieron guardar los cambios.'
            );
            return;
          }
          var promo = recolectarPromoDelFormulario();
          return fetch(API_BASE + '/talleres/' + u.tallerId + '/perfil-publico', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ perfilJson: JSON.stringify(promo) })
          }).then(function (r2) {
            return { first: res, perfilOk: r2.ok };
          });
        })
        .then(function (pack) {
          if (!pack || !pack.first) return;
          if (btnSubmit) btnSubmit.disabled = false;
          var res = pack.first;
          var usr = getUsuario();
          if (usr) {
            usr.email = res.data.email;
            usr.nombre = res.data.nombreTaller;
            FixMyCar.setUsuario(usr);
          }
          guardarPromoLocal();
          if (!pack.perfilOk) {
            alert(
              'Los datos básicos se guardaron, pero no se pudo guardar la ficha pública (fotos, descripción, etiquetas) en el servidor. Reintentá guardar o revisá el tamaño de las imágenes.'
            );
          }
          window.location.href = 'workshop-mi-taller.html';
        })
        .catch(function () {
          if (btnSubmit) btnSubmit.disabled = false;
          alert('Error de conexión.');
        });
    });
  }

  cargarPerfil();
})();
