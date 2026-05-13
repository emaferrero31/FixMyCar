(function () {
  var API_BASE = FixMyCar.API_BASE;
  var PROMO_PREFIX = 'fixmycar_taller_promo_';
  var IMG_PLACEHOLDER =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="240" viewBox="0 0 800 240"><rect fill="#ecf0f1" width="800" height="240"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#bdc3c7" font-family="sans-serif" font-size="18">Sin imagen</text></svg>'
    );
  var AVATAR_PLACEHOLDER =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect fill="#dfe6e9" width="160" height="160" rx="80"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="#b2bec3" font-family="sans-serif" font-size="12">Logo</text></svg>'
    );

  function getUsuario() {
    return FixMyCar.getUsuario();
  }

  function esc(s) {
    if (s == null || s === '') return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function leerPromo(tallerId) {
    try {
      var raw = localStorage.getItem(PROMO_PREFIX + tallerId);
      if (!raw) return {};
      var o = JSON.parse(raw);
      return typeof o === 'object' && o ? o : {};
    } catch (ignore) {
      return {};
    }
  }

  function setBlockText(id, text) {
    var el = document.getElementById(id);
    if (!el) return;
    var s = text != null && String(text).trim() !== '' ? String(text).trim() : '';
    el.textContent = s || '—';
  }

  function setOptionalLink(id, url, label) {
    var el = document.getElementById(id);
    if (!el) return;
    var u = (url || '').trim();
    var t = (label || '').trim() || u;
    if (!u) {
      el.removeAttribute('href');
      el.textContent = '—';
      el.classList.add('view-link-empty');
      return;
    }
    el.href = u.indexOf('http') === 0 || u.indexOf('mailto:') === 0 || u.indexOf('tel:') === 0 ? u : 'https://' + u.replace(/^\/\//, '');
    el.textContent = t;
    el.classList.remove('view-link-empty');
  }

  function setWhatsappLink(id, num) {
    var el = document.getElementById(id);
    if (!el) return;
    var n = (num || '').replace(/\D/g, '');
    if (!n) {
      el.removeAttribute('href');
      el.textContent = '—';
      return;
    }
    el.href = 'https://wa.me/' + n;
    el.textContent = num.trim();
  }

  function setSocialTextOrLink(id, raw, profileBase) {
    var el = document.getElementById(id);
    if (!el) return;
    var v = (raw || '').trim();
    if (!v) {
      el.textContent = '—';
      return;
    }
    if (/^https?:\/\//i.test(v)) {
      el.innerHTML =
        '<a href="' +
        esc(v) +
        '" target="_blank" rel="noopener">' +
        esc(v) +
        '</a>';
      return;
    }
    var user = v.replace(/^@/, '');
    if (user && profileBase) {
      el.innerHTML =
        '<a href="' +
        esc(profileBase + user) +
        '" target="_blank" rel="noopener">' +
        esc(v) +
        '</a>';
      return;
    }
    el.textContent = v;
  }

  function horarioLinea(h) {
    if (typeof h === 'string') return h;
    if (h && h.diaDesde && h.diaHasta && Array.isArray(h.tramos) && h.tramos.length) {
      var partDias =
        h.diaDesde === h.diaHasta ? h.diaDesde : h.diaDesde + ' a ' + h.diaHasta;
      var partesT = h.tramos
        .filter(function (t) {
          return t && t.desde && t.hasta;
        })
        .map(function (t) {
          return t.desde + ' – ' + t.hasta;
        });
      if (partesT.length) return partDias + ': ' + partesT.join(' y ');
    }
    if (h && (h.dia || h.desde || h.hasta)) {
      var d = h.dia || '';
      var a = h.desde || h.apertura || '';
      var c = h.hasta || h.cierre || '';
      if (d && a && c) return d + ': ' + a + ' – ' + c;
      if (d) return d;
    }
    return (h && (h.texto || h.label)) || '';
  }

  function renderHorarios(container, promo) {
    if (!container) return;
    var list = promo.horarios;
    if (!Array.isArray(list) || !list.length) {
      container.innerHTML =
        '<p class="view-empty">No hay horarios cargados. Editá el perfil para agregarlos.</p>';
      return;
    }
    container.innerHTML = list
      .map(function (h) {
        var line = horarioLinea(h);
        return line
          ? '<div class="view-schedule-item">' + esc(line) + '</div>'
          : '';
      })
      .filter(Boolean)
      .join('');
    if (!container.innerHTML.trim()) {
      container.innerHTML =
        '<p class="view-empty">No hay horarios cargados. Editá el perfil para agregarlos.</p>';
    }
  }

  var ETIQUETA_SERVICIO_LABELS = {
    motor: 'Motor',
    suspension: 'Suspensión',
    gomas: 'Gomas y neumáticos',
    frenos: 'Frenos',
    lubricacion: 'Lubricación y filtros',
    electricidad: 'Electricidad',
    climatizacion: 'Climatización / Aire acondicionado',
    chapa_pintura: 'Chapa y pintura',
    diagnostico: 'Diagnóstico computarizado',
    transmision: 'Transmisión / Caja de cambios',
    alineacion: 'Alineación y balanceo',
    bateria: 'Batería',
    escape: 'Escape',
    tren_delantero: 'Tren delantero y dirección',
    embrague: 'Embrague',
    inyeccion: 'Inyección'
  };

  function servicioItemAId(item) {
    if (typeof item === 'string') return item.trim();
    if (item && typeof item.etiqueta === 'string') return item.etiqueta.trim();
    if (item && (item.nombre || item.name)) {
      var n = String(item.nombre || item.name)
        .trim()
        .toLowerCase();
      for (var k in ETIQUETA_SERVICIO_LABELS) {
        if (k === n || ETIQUETA_SERVICIO_LABELS[k].toLowerCase() === n) return k;
      }
    }
    return '';
  }

  function renderServicios(container, promo) {
    if (!container) return;
    var list = promo.servicios;
    if (!Array.isArray(list) || !list.length) {
      container.innerHTML =
        '<p class="view-empty">No hay etiquetas seleccionadas. Editá el perfil para marcar los servicios.</p>';
      return;
    }
    var seen = {};
    var chips = [];
    list.forEach(function (item) {
      var id = servicioItemAId(item);
      if (!id || seen[id]) return;
      seen[id] = true;
      var label = ETIQUETA_SERVICIO_LABELS[id] || id.replace(/_/g, ' ');
      chips.push('<span class="view-service-tag">' + esc(label) + '</span>');
    });
    if (!chips.length) {
      container.innerHTML =
        '<p class="view-empty">No hay etiquetas seleccionadas. Editá el perfil para marcar los servicios.</p>';
      return;
    }
    container.innerHTML = chips.join('');
  }

  function renderGaleria(container, promo) {
    if (!container) return;
    var urls = promo.galeriaDataUrls;
    if (!Array.isArray(urls) || !urls.length) {
      container.innerHTML =
        '<p class="view-empty">No hay fotos en la galería. Editá el perfil para agregarlas.</p>';
      return;
    }
    container.innerHTML = urls
      .map(function (src) {
        return '<img class="view-gallery-img" src="' + esc(src) + '" alt="Galería">';
      })
      .join('');
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

  var nameEl = document.getElementById('sidebarUserName');
  if (nameEl) nameEl.textContent = u.nombre || u.username;

  var loading = document.getElementById('miTallerLoading');
  var content = document.getElementById('miTallerContent');
  var errEl = document.getElementById('miTallerError');

  var promoLocal = leerPromo(u.tallerId);

  fetch(API_BASE + '/talleres/' + u.tallerId)
    .then(function (r) {
      if (!r.ok) throw new Error('api');
      return r.json();
    })
    .then(function (t) {
      if (loading) loading.hidden = true;
      if (content) content.hidden = false;

      var promo = Object.assign({}, promoLocal, FixMyCar.parsePerfilPublicoJson(t.perfilPublicoJson));

      var cover = document.getElementById('vCoverPreview');
      var avatar = document.getElementById('vAvatarPreview');
      if (cover) cover.src = promo.coverDataUrl || IMG_PLACEHOLDER;
      if (avatar) avatar.src = promo.logoDataUrl || AVATAR_PLACEHOLDER;

      setBlockText('vNombre', t.nombreTaller);
      setOptionalLink('vEmail', t.email ? 'mailto:' + t.email : '', t.email);
      var tel = t.telefono || '';
      var telDigits = tel.replace(/\D/g, '');
      setOptionalLink('vTelefono', telDigits ? 'tel:' + telDigits : '', tel);
      setBlockText('vDireccion', t.direccion);
      setBlockText('vUsername', t.username);

      var web = (promo.workshopWebsite || '').trim();
      setOptionalLink('vWeb', web, web);

      var maps = (promo.googleMapsLink || '').trim();
      setOptionalLink('vMaps', maps, maps ? 'Abrir en Google Maps' : '');

      var desc = (promo.workshopDescription || '').trim();
      var descEl = document.getElementById('vDescripcion');
      if (descEl) descEl.textContent = desc || '—';

      setWhatsappLink('vWhatsapp', promo.whatsappNumber || '');
      var fb = (promo.facebookUrl || '').trim();
      setOptionalLink('vFacebook', fb, fb);
      setSocialTextOrLink(
        'vInstagram',
        promo.instagramUrl,
        'https://www.instagram.com/'
      );
      setSocialTextOrLink('vTwitter', promo.twitterUrl, 'https://twitter.com/');

      renderHorarios(document.getElementById('vScheduleContainer'), promo);
      renderServicios(document.getElementById('vServicesContainer'), promo);
      renderGaleria(document.getElementById('vGalleryContainer'), promo);
    })
    .catch(function () {
      if (loading) loading.hidden = true;
      if (errEl) {
        errEl.hidden = false;
        errEl.textContent =
          'No se pudieron cargar los datos del servidor. Revisá que el backend esté en marcha.';
      }
    });
})();
