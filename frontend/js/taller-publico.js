(function () {
  var API_BASE = FixMyCar.API_BASE;

  function setupNavLayout() {
    var u = typeof FixMyCar !== 'undefined' ? FixMyCar.getUsuario() : null;
    var esTaller = u && u.role === 'TALLER';

    var sc = document.getElementById('sidebarCliente');
    var st = document.getElementById('sidebarTaller');
    var backC = document.getElementById('pubBackLinkCliente');
    var backT = document.getElementById('pubBackLinkTaller');

    if (esTaller) {
      if (sc) sc.setAttribute('hidden', '');
      if (st) st.removeAttribute('hidden');
      if (backC) backC.setAttribute('hidden', '');
      if (backT) backT.removeAttribute('hidden');
      var nt = document.getElementById('sidebarUserNameTaller');
      if (nt) nt.textContent = u.nombre || u.username || 'Taller';
    } else {
      if (st) st.setAttribute('hidden', '');
      if (sc) sc.removeAttribute('hidden');
      if (backT) backT.setAttribute('hidden', '');
      if (backC) backC.removeAttribute('hidden');
      var nameEl = document.getElementById('sidebarUserName');
      if (nameEl) nameEl.textContent = u ? u.nombre || u.username : 'Invitado';
    }

    var tallerLogout = document.querySelector('#sidebarTaller .taller-logout-btn');
    if (tallerLogout && !tallerLogout.dataset.boundLogout) {
      tallerLogout.dataset.boundLogout = '1';
      tallerLogout.addEventListener('click', function (e) {
        e.preventDefault();
        FixMyCar.logout();
        window.location.href = 'login.html';
      });
    }
  }
  var IMG_PLACEHOLDER =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="240" viewBox="0 0 800 240"><rect fill="#ecf0f1" width="800" height="240"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#bdc3c7" font-family="sans-serif" font-size="18">Sin portada</text></svg>'
    );
  var AVATAR_PLACEHOLDER =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect fill="#dfe6e9" width="160" height="160" rx="80"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="#b2bec3" font-family="sans-serif" font-size="12">Logo</text></svg>'
    );

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

  function esc(s) {
    if (s == null || s === '') return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
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

  function estrellasHtml(promedio, classOn) {
    classOn = classOn || 'on';
    var p = Number(promedio);
    if (!p || p < 0) p = 0;
    if (p > 5) p = 5;
    var llenas = Math.round(p);
    var out = '';
    for (var i = 1; i <= 5; i++) {
      out += '<i class="fas fa-star' + (i <= llenas ? ' ' + classOn : '') + '"></i>';
    }
    return out;
  }

  function renderHorarios(el, promo) {
    if (!el) return;
    var list = promo.horarios;
    if (!Array.isArray(list) || !list.length) {
      el.innerHTML = '<p class="pub-empty">El taller no cargó horarios en su ficha.</p>';
      return;
    }
    el.innerHTML = list
      .map(function (h) {
        var line = horarioLinea(h);
        return line ? '<div class="pub-schedule-item">' + esc(line) + '</div>' : '';
      })
      .filter(Boolean)
      .join('');
    if (!el.innerHTML.trim()) {
      el.innerHTML = '<p class="pub-empty">El taller no cargó horarios en su ficha.</p>';
    }
  }

  function renderServicios(el, promo) {
    if (!el) return;
    var list = promo.servicios;
    if (!Array.isArray(list) || !list.length) {
      el.innerHTML = '<p class="pub-empty" style="width:100%;">Sin etiquetas de servicios publicadas.</p>';
      return;
    }
    var seen = {};
    var chips = [];
    list.forEach(function (item) {
      var id = servicioItemAId(item);
      if (!id || seen[id]) return;
      seen[id] = true;
      var label = ETIQUETA_SERVICIO_LABELS[id] || id.replace(/_/g, ' ');
      chips.push('<span class="pub-tag">' + esc(label) + '</span>');
    });
    el.innerHTML = chips.length ? chips.join('') : '<p class="pub-empty" style="width:100%;">Sin etiquetas de servicios publicadas.</p>';
  }

  function renderGaleria(el, promo) {
    if (!el) return;
    var urls = promo.galeriaDataUrls;
    if (!Array.isArray(urls) || !urls.length) {
      el.innerHTML = '<p class="pub-empty" style="grid-column:1/-1;">No hay fotos en la galería.</p>';
      return;
    }
    el.innerHTML = urls
      .map(function (src) {
        return '<img src="' + esc(src) + '" alt="Galería">';
      })
      .join('');
  }

  function renderRedes(el, promo) {
    if (!el) return;
    var parts = [];
    var w = (promo.whatsappNumber || '').trim();
    if (w) {
      var n = w.replace(/\D/g, '');
      if (n) {
        parts.push(
          '<p class="pub-detail"><i class="fab fa-whatsapp" style="color:#25d366;"></i> <a href="https://wa.me/' +
            esc(n) +
            '" target="_blank" rel="noopener">' +
            esc(w) +
            '</a></p>'
        );
      }
    }
    var fb = (promo.facebookUrl || '').trim();
    if (fb) {
      var fu = fb.indexOf('http') === 0 ? fb : 'https://' + fb;
      parts.push(
        '<p class="pub-detail"><i class="fab fa-facebook"></i> <a href="' +
          esc(fu) +
          '" target="_blank" rel="noopener">Facebook</a></p>'
      );
    }
    var ig = (promo.instagramUrl || '').trim();
    if (ig) {
      if (ig.indexOf('http') === 0) {
        parts.push(
          '<p class="pub-detail"><i class="fab fa-instagram"></i> <a href="' +
            esc(ig) +
            '" target="_blank" rel="noopener">Instagram</a></p>'
        );
      } else {
        var iu = 'https://www.instagram.com/' + ig.replace(/^@/, '');
        parts.push(
          '<p class="pub-detail"><i class="fab fa-instagram"></i> <a href="' +
            esc(iu) +
            '" target="_blank" rel="noopener">' +
            esc(ig) +
            '</a></p>'
        );
      }
    }
    var tw = (promo.twitterUrl || '').trim();
    if (tw) {
      if (tw.indexOf('http') === 0) {
        parts.push(
          '<p class="pub-detail"><i class="fab fa-twitter"></i> <a href="' +
            esc(tw) +
            '" target="_blank" rel="noopener">Twitter / X</a></p>'
        );
      } else {
        var tu = 'https://twitter.com/' + tw.replace(/^@/, '');
        parts.push(
          '<p class="pub-detail"><i class="fab fa-twitter"></i> <a href="' +
            esc(tu) +
            '" target="_blank" rel="noopener">' +
            esc(tw) +
            '</a></p>'
        );
      }
    }
    el.innerHTML = parts.length ? parts.join('') : '<p class="pub-empty">Sin redes publicadas.</p>';
  }

  function renderResenas(el, lista) {
    if (!el) return;
    if (!lista || !lista.length) {
      el.innerHTML = '<p class="pub-empty">Todavía no hay comentarios. ¡Sé el primero en valorar!</p>';
      return;
    }
    el.innerHTML = lista
      .map(function (r) {
        var fecha = r.fecha ? new Date(r.fecha).toLocaleString('es-AR') : '';
        var com = r.comentario ? esc(r.comentario) : '<em style="color:#95a5a6;">Sin comentario de texto</em>';
        return (
          '<div class="pub-resena">' +
          '<div class="pub-resena-header">' +
          '<span class="pub-resena-author">' +
          esc(r.autorNombre || 'Cliente') +
          '</span>' +
          '<span class="pub-resena-date">' +
          esc(fecha) +
          '</span></div>' +
          '<div class="pub-stars" style="margin-bottom:8px;">' +
          estrellasHtml(r.puntuacion, 'on') +
          '</div>' +
          '<p class="pub-resena-text">' +
          com +
          '</p></div>'
        );
      })
      .join('');
  }

  var tallerId;
  var selectedStars = 5;

  function setupStarButtons(container, onChange) {
    if (!container) return;
    container.innerHTML = '';
    for (var i = 1; i <= 5; i++) {
      (function (star) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', star + ' estrellas');
        b.innerHTML = '<i class="fas fa-star"></i>';
        b.addEventListener('click', function () {
          selectedStars = star;
          updateStarVisual(container);
          if (onChange) onChange(selectedStars);
        });
        container.appendChild(b);
      })(i);
    }
    updateStarVisual(container);
  }

  function updateStarVisual(container) {
    var buttons = container.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      if (i < selectedStars) buttons[i].classList.add('on');
      else buttons[i].classList.remove('on');
    }
  }

  function cargar() {
    var params = new URLSearchParams(window.location.search);
    var rawId = params.get('id') || params.get('tallerId');
    tallerId = parseInt(rawId, 10);
    var loading = document.getElementById('pubLoading');
    var errEl = document.getElementById('pubError');
    var content = document.getElementById('pubContent');

    if (!rawId || isNaN(tallerId)) {
      if (loading) loading.hidden = true;
      if (errEl) {
        errEl.hidden = false;
        errEl.textContent = 'Falta el identificador del taller en la URL (ej: taller-publico.html?id=1).';
      }
      return;
    }

    fetch(API_BASE + '/talleres/' + tallerId + '/publico')
      .then(function (r) {
        if (!r.ok) throw new Error('notfound');
        return r.json();
      })
      .then(function (data) {
        if (loading) loading.hidden = true;
        if (content) content.hidden = false;

        var promo = FixMyCar.parsePerfilPublicoJson(data.perfilPublicoJson);

        document.getElementById('pubNombre').textContent = data.nombreTaller || '—';
        document.getElementById('pubCoverImg').src = promo.coverDataUrl || IMG_PLACEHOLDER;
        document.getElementById('pubLogoImg').src = promo.logoDataUrl || AVATAR_PLACEHOLDER;

        var cnt = data.cantidadResenas != null ? data.cantidadResenas : 0;
        var prom = data.puntuacionPromedio != null ? data.puntuacionPromedio : 0;
        document.getElementById('pubStarsGlobal').innerHTML = estrellasHtml(prom, 'on');
        document.getElementById('pubRatingText').textContent =
          cnt > 0 ? prom.toFixed(1) + ' / 5 · ' + cnt + ' valoración' + (cnt === 1 ? '' : 'es') : 'Sin valoraciones aún';

        document.getElementById('pubDireccion').innerHTML =
          data.direccion ? '<i class="fas fa-map-marker-alt"></i> ' + esc(data.direccion) : '—';
        var tel = data.telefono || '';
        var telDigits = tel.replace(/\D/g, '');
        document.getElementById('pubTelefono').innerHTML = tel
          ? '<i class="fas fa-phone"></i> <a href="tel:' + esc(telDigits) + '">' + esc(tel) + '</a>'
          : '—';
        document.getElementById('pubEmail').innerHTML = data.email
          ? '<i class="fas fa-envelope"></i> <a href="mailto:' + esc(data.email) + '">' + esc(data.email) + '</a>'
          : '—';

        var desc = (promo.workshopDescription || '').trim();
        document.getElementById('pubDescripcion').textContent = desc || 'El taller aún no publicó una descripción.';

        var web = (promo.workshopWebsite || '').trim();
        document.getElementById('pubWeb').innerHTML = web
          ? '<i class="fas fa-globe"></i> <a href="' +
            esc(web.indexOf('http') === 0 ? web : 'https://' + web) +
            '" target="_blank" rel="noopener">Sitio web</a>'
          : '';

        var maps = (promo.googleMapsLink || '').trim();
        document.getElementById('pubMaps').innerHTML = maps
          ? '<i class="fas fa-map-marked-alt"></i> <a href="' +
            esc(maps) +
            '" target="_blank" rel="noopener">Ver en Google Maps</a>'
          : '';

        renderRedes(document.getElementById('pubRedes'), promo);
        renderHorarios(document.getElementById('pubHorarios'), promo);
        renderServicios(document.getElementById('pubServicios'), promo);
        renderGaleria(document.getElementById('pubGaleria'), promo);
        renderResenas(document.getElementById('pubResenas'), data.resenas || []);

        setupFormularioResena(data);
      })
      .catch(function () {
        if (loading) loading.hidden = true;
        if (errEl) {
          errEl.hidden = false;
          errEl.textContent = 'No se encontró el taller o el servidor no respondió.';
        }
      });
  }

  function setupFormularioResena(data) {
    var u = FixMyCar.getUsuario();
    var formWrap = document.getElementById('pubFormResena');
    var hint = document.getElementById('pubFormHint');
    if (!formWrap) return;

    if (!u || u.role !== 'CLIENTE' || !u.id) {
      formWrap.hidden = true;
      if (hint && (!u || u.role !== 'CLIENTE')) {
        var login = document.createElement('p');
        login.className = 'pub-form-hint';
        login.innerHTML =
          '<a href="login.html">Iniciá sesión como cliente</a> para dejar una valoración y un comentario.';
        document.getElementById('pubResenas').appendChild(login);
      }
      return;
    }

    formWrap.hidden = false;
    if (hint) {
      hint.textContent =
        'Solo podés tener una reseña por taller: si volvés a enviar, se actualiza la anterior.';
    }

    var miResena = null;
    (data.resenas || []).forEach(function (r) {
      if (r.usuarioId === u.id) miResena = r;
    });
    if (miResena) {
      selectedStars = miResena.puntuacion || 5;
      var tx = document.getElementById('pubComentario');
      if (tx) tx.value = miResena.comentario || '';
      var titulo = document.getElementById('pubFormTitulo');
      if (titulo) titulo.textContent = 'Actualizar tu valoración';
    } else {
      selectedStars = 5;
    }

    var starContainer = document.getElementById('pubStarButtons');
    setupStarButtons(starContainer);

    document.getElementById('pubEnviarResena').onclick = function () {
      var btn = this;
      var com = (document.getElementById('pubComentario').value || '').trim();
      btn.disabled = true;
      fetch(API_BASE + '/talleres/' + tallerId + '/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: u.id,
          puntuacion: selectedStars,
          comentario: com || null
        })
      })
        .then(function (r) {
          return r.json().then(function (body) {
            return { ok: r.ok, body: body };
          });
        })
        .then(function (res) {
          btn.disabled = false;
          if (res.ok) {
            window.location.reload();
          } else {
            alert((res.body && res.body.message) || 'No se pudo guardar la reseña.');
          }
        })
        .catch(function () {
          btn.disabled = false;
          alert('Error de conexión.');
        });
    };
  }

  setupNavLayout();
  cargar();
})();
