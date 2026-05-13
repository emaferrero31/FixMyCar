(function () {
  var API_BASE = FixMyCar.API_BASE;
  var listEl = document.getElementById('vehiclesList');
  var modal = document.getElementById('vehicleModal');
  var form = document.getElementById('vehicleForm');
  var modalTitle = document.getElementById('modalTitle');
  var editingId = null;
  /** Data URL JPEG de la foto (vacío = sin foto en API) */
  var vehicleFotoDataUrl = '';

  function getUsuario() {
    return FixMyCar.getUsuario();
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

  function resetVehiclePhoto() {
    vehicleFotoDataUrl = '';
    var inp = document.getElementById('vehiclePhoto');
    if (inp) inp.value = '';
    var prev = document.getElementById('vehiclePhotoPreview');
    var prevImg = document.getElementById('vehiclePhotoPreviewImg');
    if (prevImg) {
      prevImg.removeAttribute('src');
    }
    if (prev) prev.hidden = true;
  }

  function setVehiclePhotoPreview(dataUrl) {
    var prev = document.getElementById('vehiclePhotoPreview');
    var prevImg = document.getElementById('vehiclePhotoPreviewImg');
    if (!prev || !prevImg) return;
    if (!dataUrl || String(dataUrl).indexOf('data:image') !== 0) {
      prev.hidden = true;
      prevImg.removeAttribute('src');
      return;
    }
    prevImg.src = dataUrl;
    prev.hidden = false;
  }

  function fileToScaledJpegDataUrl(file, maxSide, quality, done) {
    if (!file || !/^image\//.test(file.type)) {
      done(null);
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Elegí una imagen de menos de 12 MB.');
      done(null);
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        var scale = Math.min(1, maxSide / Math.max(w, h));
        var tw = Math.max(1, Math.round(w * scale));
        var th = Math.max(1, Math.round(h * scale));
        var canvas = document.createElement('canvas');
        canvas.width = tw;
        canvas.height = th;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, tw, th);
        var out;
        try {
          out = canvas.toDataURL('image/jpeg', quality);
        } catch (e) {
          done(null);
          return;
        }
        if (out.length > 700000) {
          tw = Math.max(1, Math.round(tw * 0.85));
          th = Math.max(1, Math.round(th * 0.85));
          canvas.width = tw;
          canvas.height = th;
          ctx.drawImage(img, 0, 0, tw, th);
          try {
            out = canvas.toDataURL('image/jpeg', 0.65);
          } catch (e2) {
            done(null);
            return;
          }
        }
        if (out.length > 700000) {
          alert('La imagen sigue siendo muy grande. Probá otra foto más chica.');
          done(null);
          return;
        }
        done(out);
      };
      img.onerror = function () {
        done(null);
      };
      img.src = reader.result;
    };
    reader.onerror = function () {
      done(null);
    };
    reader.readAsDataURL(file);
  }

  /** API en camelCase; por si acaso aceptamos snake_case */
  function fotoVehiculoDesdeApi(v) {
    if (!v) return '';
    var f = v.fotoDataUrl != null ? v.fotoDataUrl : v.foto_data_url;
    return f != null ? String(f) : '';
  }

  function renderVehicleImageCell(host, v) {
    host.innerHTML = '';
    var foto = fotoVehiculoDesdeApi(v);
    if (foto && /^data:image\//i.test(foto)) {
      var im = document.createElement('img');
      im.src = foto;
      im.alt = (v.marca || '') + ' ' + (v.modelo || '');
      im.referrerPolicy = 'no-referrer';
      host.appendChild(im);
    } else {
      host.innerHTML =
        '<i class="fas fa-car" style="font-size:48px; color:#4f46e5;" aria-hidden="true"></i>';
    }
  }

  function cargarVehiculos() {
    var u = getUsuario();
    if (!u || !u.id) {
      window.location.href = 'login.html';
      return;
    }
    if (u.role !== 'CLIENTE') {
      window.location.href = 'dashboard.html';
      return;
    }

    fetch(API_BASE + '/clientes/' + u.id + '/vehiculos?_=' + Date.now(), {
      cache: 'no-store',
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' }
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        listEl.innerHTML = '';
        if (!data || data.length === 0) {
          listEl.innerHTML =
            '<p style="color:#7f8c8d; padding:20px;">No tenés vehículos cargados. Agregá uno con el botón de arriba.</p>';
          return;
        }
        data.forEach(function (v) {
          var card = document.createElement('div');
          card.className = 'vehicle-card';
          card.innerHTML =
            '<div class="vehicle-image"></div>' +
            '<div class="vehicle-details">' +
            '  <div class="vehicle-title"><h4>' +
            escapeHtml(v.marca + ' ' + v.modelo) +
            '</h4><span class="vehicle-year">' +
            (v.anio || '') +
            '</span></div>' +
            '  <div class="vehicle-info">' +
            '    <span><i class="fas fa-id-card"></i> ' +
            escapeHtml(v.patente || '') +
            '</span>' +
            '    <span><i class="fas fa-palette"></i> ' +
            escapeHtml(v.color || '') +
            '</span>' +
            '    <span><i class="fas fa-gas-pump"></i> ' +
            escapeHtml(v.tipoCombustible || '') +
            '</span>' +
            '    <span><i class="fas fa-tachometer-alt"></i> ' +
            escapeHtml(v.kilometraje || '') +
            '</span>' +
            '  </div>' +
            '  <div class="vehicle-actions">' +
            '    <a href="vehiculo-historial.html?vehiculoId=' +
            v.id +
            '" class="btn-historial"><i class="fas fa-folder-open"></i> Historial</a>' +
            '    <button type="button" class="btn-edit" data-id="' +
            v.id +
            '"><i class="fas fa-edit"></i> Editar</button>' +
            '    <button type="button" class="btn-delete" data-id="' +
            v.id +
            '"><i class="fas fa-trash"></i> Eliminar</button>' +
            '  </div>' +
            '</div>';
          listEl.appendChild(card);

          renderVehicleImageCell(card.querySelector('.vehicle-image'), v);

          card.querySelector('.btn-edit').addEventListener('click', function () {
            editingId = v.id;
            modalTitle.textContent = 'Editar Vehículo';
            document.getElementById('brand').value = v.marca || '';
            document.getElementById('model').value = v.modelo || '';
            document.getElementById('year').value = v.anio || '';
            document.getElementById('licensePlate').value = v.patente || '';
            document.getElementById('color').value = v.color || '';
            document.getElementById('fuelType').value = v.tipoCombustible || '';
            document.getElementById('mileage').value = v.kilometraje || '';
            document.getElementById('vin').value = v.vin || '';
            var inp = document.getElementById('vehiclePhoto');
            if (inp) inp.value = '';
            var fv = fotoVehiculoDesdeApi(v);
            vehicleFotoDataUrl = /^data:image\//i.test(fv) ? fv : '';
            setVehiclePhotoPreview(vehicleFotoDataUrl);
            modal.classList.add('active');
          });

          card.querySelector('.btn-delete').addEventListener('click', function () {
            if (!confirm('¿Eliminar este vehículo?')) return;
            fetch(API_BASE + '/vehiculos/' + v.id, { method: 'DELETE' })
              .then(function (res) {
                if (res.status === 204 || res.ok) cargarVehiculos();
                else res.json().then(function (d) {
                  alert(d.message || 'Error');
                });
              })
              .catch(function () {
                alert('Error de conexión');
              });
          });
        });
      })
      .catch(function () {
        listEl.innerHTML =
          '<p style="color:#e74c3c; padding:20px;">Error al cargar vehículos. ¿Está el backend en marcha?</p>';
      });
  }

  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function mensajeErrorGuardado(status, data) {
    if (!data || typeof data !== 'object') {
      return status === 413 || status === 400
        ? 'El servidor rechazó la petición (código ' +
            status +
            '). Si agregaste foto, probá una imagen más chica o reiniciá el backend.'
        : 'Error (código ' + status + ').';
    }
    if (data.message) return String(data.message);
    if (Array.isArray(data.errors)) {
      return data.errors
        .map(function (e) {
          return e.field || e.defaultMessage || JSON.stringify(e);
        })
        .join('. ');
    }
    return 'Error al guardar.';
  }

  function leerRespuestaJson(r) {
    return r.text().then(function (text) {
      if (!text) return {};
      try {
        return JSON.parse(text);
      } catch (e) {
        return { message: text.slice(0, 200) };
      }
    });
  }

  function bodyFromForm() {
    return {
      marca: document.getElementById('brand').value.trim(),
      modelo: document.getElementById('model').value.trim(),
      anio: parseInt(document.getElementById('year').value, 10),
      patente: document.getElementById('licensePlate').value.trim(),
      color: document.getElementById('color').value.trim(),
      tipoCombustible: document.getElementById('fuelType').value.trim(),
      kilometraje: document.getElementById('mileage').value.trim(),
      vin: document.getElementById('vin').value.trim() || null,
      fotoDataUrl: vehicleFotoDataUrl || ''
    };
  }

  document.getElementById('addVehicleBtn').addEventListener('click', function () {
    editingId = null;
    modalTitle.textContent = 'Agregar Vehículo';
    form.reset();
    resetVehiclePhoto();
    modal.classList.add('active');
  });

  document.getElementById('vehiclePhoto').addEventListener('change', function () {
    var f = this.files && this.files[0];
    if (!f) return;
    fileToScaledJpegDataUrl(f, 960, 0.74, function (dataUrl) {
      if (!dataUrl) {
        alert('No se pudo procesar la imagen. Probá con JPG o PNG.');
        return;
      }
      vehicleFotoDataUrl = dataUrl;
      setVehiclePhotoPreview(dataUrl);
    });
  });

  document.getElementById('vehiclePhotoClear').addEventListener('click', function () {
    resetVehiclePhoto();
  });

  document.getElementById('closeModal').addEventListener('click', function () {
    modal.classList.remove('active');
  });
  document.getElementById('cancelBtn').addEventListener('click', function () {
    modal.classList.remove('active');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var u = getUsuario();
    if (!u || !u.id) return;

    var body = bodyFromForm();
    var submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    if (editingId) {
      fetch(API_BASE + '/vehiculos/' + editingId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
        .then(function (r) {
          return leerRespuestaJson(r).then(function (data) {
            return { ok: r.ok, status: r.status, data: data };
          });
        })
        .then(function (result) {
          submitBtn.disabled = false;
          if (result.ok) {
            modal.classList.remove('active');
            cargarVehiculos();
          } else {
            alert(mensajeErrorGuardado(result.status, result.data));
          }
        })
        .catch(function () {
          submitBtn.disabled = false;
          alert('Error de conexión');
        });
    } else {
      fetch(API_BASE + '/clientes/' + u.id + '/vehiculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
        .then(function (r) {
          return leerRespuestaJson(r).then(function (data) {
            return { ok: r.ok, status: r.status, data: data };
          });
        })
        .then(function (result) {
          submitBtn.disabled = false;
          if (result.ok) {
            modal.classList.remove('active');
            cargarVehiculos();
          } else {
            alert(mensajeErrorGuardado(result.status, result.data));
          }
        })
        .catch(function () {
          submitBtn.disabled = false;
          alert('Error de conexión');
        });
    }
  });

  renderUsuario();
  cargarVehiculos();
})();
