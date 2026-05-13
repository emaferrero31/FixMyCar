(function () {
  var API_BASE = FixMyCar.API_BASE;
  var listEl = document.getElementById('workshopsList');
  var searchInput = document.getElementById('searchInput');
  var locationInput = document.getElementById('location');
  var applyBtn = document.getElementById('applyFilters');
  var distanceSelect = document.getElementById('distance');
  var GEO_CACHE_KEY = 'fixmycar_geo_cache_v1';
  /** Nominatim public instance: ~1 petición/s; el paralelismo masivo rompe el filtro por distancia */
  var NOMINATIM_MIN_INTERVAL_MS = 1150;
  var nominatimNextAllowedAt = 0;

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  /** Espera hasta poder iniciar la próxima petición a Nominatim (cola global). */
  function beforeNominatimRequest() {
    var now = Date.now();
    var wait = Math.max(0, nominatimNextAllowedAt - now);
    return delay(wait);
  }

  function releaseNominatimSlot() {
    nominatimNextAllowedAt = Date.now() + NOMINATIM_MIN_INTERVAL_MS;
  }

  function nominatimHeaders() {
    return {
      Accept: 'application/json',
      'Accept-Language': 'es-AR,es;q=0.9'
    };
  }

  function setLocationReferenceHint(text) {
    var row = document.getElementById('locationReferenceRow');
    var chip = document.getElementById('locationReferenceChip');
    if (!row) return;
    if (!text) {
      row.hidden = true;
      if (chip) {
        chip.removeAttribute('title');
        chip.removeAttribute('aria-label');
      }
      return;
    }
    row.hidden = false;
    if (chip) {
      chip.setAttribute('title', text);
      chip.setAttribute('aria-label', text);
    }
  }

  function closeAllInfoPopovers() {
    document.querySelectorAll('.info-popover-panel').forEach(function (panel) {
      panel.hidden = true;
      panel.classList.remove('is-open');
      var anchor = panel.closest('.info-popover-anchor');
      if (anchor) {
        var btn = anchor.querySelector('.info-popover-trigger');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initInfoPopovers() {
    document.querySelectorAll('.info-popover-anchor').forEach(function (anchor) {
      var btn = anchor.querySelector('.info-popover-trigger');
      var panel = anchor.querySelector('.info-popover-panel');
      if (!btn || !panel) return;

      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var willOpen = panel.hidden;
        closeAllInfoPopovers();
        if (willOpen) {
          panel.hidden = false;
          panel.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });

      panel.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    });

    document.addEventListener('click', closeAllInfoPopovers);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllInfoPopovers();
    });
  }

  function getUsuario() {
    return FixMyCar.getUsuario();
  }

  function saveRecentTallerForAppointments(tallerId, tallerNombre) {
    var KEY = 'fixmycar_recent_talleres_v1';
    var MAX = 6;
    var idNum = parseInt(tallerId, 10);
    if (isNaN(idNum)) return;
    try {
      var raw = localStorage.getItem(KEY);
      var prev = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(prev)) prev = [];
      prev = prev.filter(function (x) {
        return x && x.id !== idNum;
      });
      var next = [{ id: idNum, nombre: tallerNombre || 'Taller' }].concat(prev).slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch (ignore) {}
  }

  function renderUsuario() {
    var u = getUsuario();
    var nameEl = document.getElementById('sidebarUserName');
    if (nameEl) nameEl.textContent = u ? u.nombre || u.username : 'Usuario';
    var logoutEl = document.getElementById('logoutLink');
    if (logoutEl) {
      logoutEl.addEventListener('click', function (e) {
        e.preventDefault();
        FixMyCar.logout();
        window.location.href = 'login.html';
      });
    }
  }

  function estrellasHtml(promedio) {
    var p = Number(promedio);
    if (!p || p < 0) p = 0;
    if (p > 5) p = 5;
    var llenas = Math.round(p);
    var out = '';
    for (var i = 1; i <= 5; i++) {
      out +=
        '<i class="fas fa-star workshop-star' +
        (i <= llenas ? ' workshop-star-on' : '') +
        '"></i>';
    }
    return out;
  }

  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function parseDistanceKm() {
    if (!distanceSelect) return null;
    var n = parseFloat(distanceSelect.value);
    if (isNaN(n) || n <= 0) return null;
    return n;
  }

  function getGeoCache() {
    try {
      var raw = localStorage.getItem(GEO_CACHE_KEY);
      if (!raw) return {};
      var o = JSON.parse(raw);
      return typeof o === 'object' && o ? o : {};
    } catch (ignore) {
      return {};
    }
  }

  function setGeoCache(cache) {
    try {
      localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache || {}));
    } catch (ignore) {}
  }

  function normalizeAddressKey(addr) {
    return (addr || '').trim().toLowerCase();
  }

  function geocodeAddress(address) {
    var key = normalizeAddressKey(address);
    if (!key) return Promise.resolve(null);

    var cache = getGeoCache();
    if (cache[key] && typeof cache[key].lat === 'number' && typeof cache[key].lon === 'number') {
      return Promise.resolve({
        lat: cache[key].lat,
        lon: cache[key].lon,
        displayName: cache[key].displayName || null,
        cached: true
      });
    }

    // Nominatim (OpenStreetMap) — devuelve dirección humana (ciudad, calle, etc.)
    // Bias Argentina (mejor para direcciones locales). Sigue siendo Nominatim/OSM.
    var url =
      'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ar&q=' +
      encodeURIComponent(address);
    return beforeNominatimRequest()
      .then(function () {
        return fetch(url, {
          headers: nominatimHeaders()
        });
      })
      .then(function (r) {
        if (!r.ok) return null;
        return r.json();
      })
      .then(function (arr) {
        if (!arr || !arr.length) {
          releaseNominatimSlot();
          return null;
        }
        var lat = parseFloat(arr[0].lat);
        var lon = parseFloat(arr[0].lon);
        if (isNaN(lat) || isNaN(lon)) {
          releaseNominatimSlot();
          return null;
        }
        var displayName = arr[0].display_name || null;
        cache[key] = { lat: lat, lon: lon, displayName: displayName, ts: Date.now() };
        setGeoCache(cache);
        releaseNominatimSlot();
        return { lat: lat, lon: lon, displayName: displayName, cached: false };
      })
      .catch(function () {
        releaseNominatimSlot();
        return null;
      });
  }

  function reverseGeocodeCoords(lat, lon) {
    if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
      return Promise.resolve(null);
    }
    var url =
      'https://nominatim.openstreetmap.org/reverse?format=json&lat=' +
      encodeURIComponent(lat) +
      '&lon=' +
      encodeURIComponent(lon);
    return beforeNominatimRequest()
      .then(function () {
        return fetch(url, { headers: nominatimHeaders() });
      })
      .then(function (r) {
        return r.ok ? r.json() : Promise.resolve(null);
      })
      .then(function (data) {
        releaseNominatimSlot();
        return data && data.display_name ? data.display_name : null;
      })
      .catch(function () {
        releaseNominatimSlot();
        return null;
      });
  }

  function getCurrentPosition() {
    return new Promise(function (resolve) {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          var lat = pos.coords.latitude;
          var lon = pos.coords.longitude;
          reverseGeocodeCoords(lat, lon).then(function (displayName) {
            resolve({
              lat: lat,
              lon: lon,
              displayName: displayName,
              fromGps: true
            });
          });
        },
        function () {
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 }
      );
    });
  }

  function haversineKm(a, b) {
    var R = 6371;
    var dLat = ((b.lat - a.lat) * Math.PI) / 180;
    var dLon = ((b.lon - a.lon) * Math.PI) / 180;
    var la1 = (a.lat * Math.PI) / 180;
    var la2 = (b.lat * Math.PI) / 180;
    var h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function enrichWithDistance(data, origin) {
    if (!origin || !Array.isArray(data) || !data.length) {
      return Promise.resolve(data || []);
    }
    /** Una geocodificación tras otra (respeta límite Nominatim); sin esto la mayoría falla y el radio queda vacío */
    return data.reduce(function (chain, t) {
      return chain.then(function () {
        var raw = t.direccion != null ? String(t.direccion).trim() : '';
        var addr = raw;
        if (!addr && t.nombreTaller) {
          addr = String(t.nombreTaller).trim() + ', Argentina';
        }
        if (!addr) {
          return Promise.resolve();
        }
        return geocodeAddress(addr).then(function (geo) {
          if (geo && typeof geo.lat === 'number' && typeof geo.lon === 'number') {
            t.distanciaKm = haversineKm(origin, { lat: geo.lat, lon: geo.lon });
          }
        });
      });
    }, Promise.resolve()).then(function () {
      return data;
    });
  }

  function renderCards(data, originApplied) {
    listEl.innerHTML = '';
    if (!data || data.length === 0) {
      listEl.innerHTML = '<p style="padding:20px;color:#7f8c8d;">No se encontraron talleres con esos filtros.</p>';
      return;
    }
    data.forEach(function (t) {
      var card = document.createElement('div');
      card.className = 'workshop-card';
      var cnt = t.cantidadResenas != null ? t.cantidadResenas : 0;
      var prom = t.puntuacionPromedio != null ? t.puntuacionPromedio : 0;
      var ratingLine =
        '<div class="workshop-rating" title="' +
        cnt +
        ' valoración(es)">' +
        estrellasHtml(prom) +
        '<span class="workshop-rating-text">' +
        (cnt > 0 ? prom.toFixed(1) + ' · ' + cnt + ' reseña' + (cnt === 1 ? '' : 's') : 'Sin reseñas aún') +
        '</span></div>';

      var distanciaLine = '';
      if (originApplied && typeof t.distanciaKm === 'number') {
        distanciaLine =
          '<p><i class="fas fa-location-arrow"></i> A ' +
          t.distanciaKm.toFixed(1) +
          ' km de tu punto de partida (línea recta)</p>';
      }

      card.innerHTML =
        '<div class="workshop-image"></div>' +
        '<div class="workshop-info">' +
        '  <div class="workshop-header"><h3>' + escapeHtml(t.nombreTaller || '') + '</h3></div>' +
        ratingLine +
        '  <div class="workshop-details">' +
        (t.direccion ? '<p><i class="fas fa-map-marker-alt"></i> ' + escapeHtml(t.direccion) + '</p>' : '') +
        distanciaLine +
        (t.telefono ? '<p><i class="fas fa-phone"></i> ' + escapeHtml(t.telefono) + '</p>' : '') +
        (t.email ? '<p><i class="fas fa-envelope"></i> ' + escapeHtml(t.email) + '</p>' : '') +
        '  </div>' +
        '  <div class="workshop-actions workshop-actions-row">' +
        '    <a href="taller-publico.html?id=' +
        t.id +
        '" class="btn-outline btn-ver-perfil"><i class="fas fa-store"></i> Ver perfil</a>' +
        '    <button type="button" class="btn-primary btn-solicitar-turno" data-taller-id="' +
        t.id +
        '" data-taller-nombre="' +
        escapeHtml(t.nombreTaller || '') +
        '"><i class="fas fa-calendar-plus"></i> Solicitar turno</button>' +
        '  </div>' +
        '</div>';
      listEl.appendChild(card);

      var imgHost = card.querySelector('.workshop-image');
      if (
        imgHost &&
        t.logoDataUrl &&
        String(t.logoDataUrl).indexOf('data:image') === 0
      ) {
        var im = document.createElement('img');
        im.className = 'workshop-card-logo-img';
        im.alt = 'Logo de ' + (t.nombreTaller || 'taller');
        im.src = t.logoDataUrl;
        imgHost.appendChild(im);
      } else if (imgHost) {
        imgHost.innerHTML =
          '<i class="fas fa-tools" style="font-size:64px;color:#e9ecef;display:flex;align-items:center;justify-content:center;height:100%;"></i>';
      }

      card.querySelector('.btn-solicitar-turno').addEventListener('click', function () {
        var id = this.getAttribute('data-taller-id');
        var nombreT = this.getAttribute('data-taller-nombre');
        saveRecentTallerForAppointments(id, nombreT);
        if (window.solicitarTurnoModal) {
          window.solicitarTurnoModal(parseInt(id, 10), nombreT);
        } else {
          window.location.href =
            'appointments.html?tallerId=' + id + '&tallerNombre=' + encodeURIComponent(nombreT || '');
        }
      });
    });
  }

  function buscar() {
    setLocationReferenceHint(null);

    var nombre = (searchInput && searchInput.value.trim()) || '';
    var direccionTexto = (locationInput && locationInput.value.trim()) || '';
    var distMaxKm = parseDistanceKm();
    var needsDistance = distMaxKm != null;

    var params = new URLSearchParams();
    if (nombre) params.set('nombre', nombre);
    // Con radio activo, el texto del campo es solo "punto de partida" (geocodificar), no filtro servidor.
    if (direccionTexto && !needsDistance) {
      params.set('direccion', direccionTexto);
    }

    var sortBy = document.getElementById('sortBy');
    var orden = 'nombre';
    if (sortBy) {
      if (sortBy.value === 'direccion') orden = 'direccion';
      else if (sortBy.value === 'puntuacion') orden = 'puntuacion';
    }
    params.set('orden', orden);
    var url = API_BASE + '/talleres' + (params.toString() ? '?' + params.toString() : '');

    listEl.innerHTML = '<p style="padding:20px;color:#7f8c8d;">Cargando...</p>';

    fetch(url)
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (!needsDistance) {
          renderCards(data || [], false);
          return;
        }

        var originPromise = direccionTexto ? geocodeAddress(direccionTexto) : getCurrentPosition();

        originPromise.then(function (origin) {
          if (!origin) {
            renderCards(data || [], false);
            var msg = direccionTexto
              ? 'No encontramos esa dirección en el mapa. Probá con calle, número y ciudad (ej. Av. Siempre Viva 742, Springfield). Se muestra el listado sin filtrar por distancia.'
              : 'No se pudo obtener tu ubicación (GPS). Escribí tu dirección arriba o permití la ubicación en el navegador.';
            listEl.insertAdjacentHTML(
              'afterbegin',
              '<p style="padding:12px 20px;color:#b9770e;background:#fff8e1;border:1px solid #f9e79f;border-radius:8px;margin-bottom:14px;">' +
                msg +
                '</p>'
            );
            return;
          }

          var hint =
            'Punto de partida reconocido: ' +
            (origin.displayName ||
              (origin.fromGps ? 'coordenadas GPS (sin dirección legible)' : 'sin detalle')) +
            '. Radio: hasta ' +
            distMaxKm +
            ' km en línea recta (no por rutas).';
          setLocationReferenceHint(hint);

          listEl.innerHTML =
            '<p style="padding:20px;color:#7f8c8d;">Calculando distancias desde tu punto de partida… Puede tardar unos segundos (un taller a la vez en el mapa).</p>';

          enrichWithDistance(data || [], origin).then(function (enriched) {
            var filtrados = enriched
              .filter(function (t) {
                return typeof t.distanciaKm === 'number' && t.distanciaKm <= distMaxKm;
              })
              .sort(function (a, b) {
                return (a.distanciaKm || 99999) - (b.distanciaKm || 99999);
              });

            renderCards(filtrados, true);
            if (!filtrados.length) {
              listEl.insertAdjacentHTML(
                'afterbegin',
                '<p style="padding:12px 20px;color:#7f8c8d;background:#f8f9fa;border:1px solid #ecf0f1;border-radius:8px;margin-bottom:14px;">No encontramos talleres dentro de ' +
                  distMaxKm +
                  ' km desde ese punto. Probá ampliar la distancia o verificá la dirección de partida.</p>'
              );
            }
          });
        });
      })
      .catch(function () {
        listEl.innerHTML = '<p style="padding:20px;color:#e74c3c;">Error al cargar talleres. ¿Está el backend en marcha?</p>';
      });
  }

  if (applyBtn) applyBtn.addEventListener('click', buscar);
  if (searchInput)
    searchInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') buscar();
    });
  if (locationInput)
    locationInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') buscar();
    });
  var sortByEl = document.getElementById('sortBy');
  if (sortByEl) sortByEl.addEventListener('change', buscar);
  if (distanceSelect) distanceSelect.addEventListener('change', buscar);

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
  initInfoPopovers();
  buscar();
})();
