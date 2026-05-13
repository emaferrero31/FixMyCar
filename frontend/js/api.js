// FixMyCar - Configuración API y helpers de sesión
var FixMyCar = FixMyCar || {};
FixMyCar.API_BASE = 'http://localhost:8080/api';

FixMyCar.getUsuario = function () {
  var json = localStorage.getItem('fixmycar_usuario');
  return json ? JSON.parse(json) : null;
};

FixMyCar.setUsuario = function (usuario) {
  localStorage.setItem('fixmycar_usuario', JSON.stringify(usuario));
};

FixMyCar.logout = function () {
  localStorage.removeItem('fixmycar_usuario');
};

FixMyCar.redirectPorRol = function (usuario) {
  if (usuario.role === 'TALLER') {
    window.location.href = 'workshop-dashboard.html';
  } else {
    window.location.href = 'dashboard.html';
  }
};

/** Parsea el JSON de ficha pública guardado en el taller (servidor). */
FixMyCar.parsePerfilPublicoJson = function (raw) {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return {};
  try {
    var o = JSON.parse(raw);
    return typeof o === 'object' && o ? o : {};
  } catch (ignore) {
    return {};
  }
};

// Unifica el comportamiento del botón "Cerrar sesión" entre Cliente/Taller.
// Busca por id/clase que usamos en distintas pantallas y hace logout real.
FixMyCar.initLogout = function () {
  var logoutEl =
    document.getElementById('logoutLink') ||
    document.getElementById('workshopLogout') ||
    document.querySelector('a.logout-link') ||
    document.querySelector('[data-logout="true"]');

  if (!logoutEl) return;

  logoutEl.addEventListener('click', function (e) {
    e.preventDefault();
    FixMyCar.logout();
    window.location.href = 'login.html';
  });
};

document.addEventListener('DOMContentLoaded', function () {
  if (typeof FixMyCar !== 'undefined' && FixMyCar.initLogout) {
    FixMyCar.initLogout();
  }
});
