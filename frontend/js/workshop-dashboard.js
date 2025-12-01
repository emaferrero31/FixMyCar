document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el menú móvil
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebar.classList.toggle('active');
            document.body.classList.toggle('sidebar-open');
        });

        // Cerrar menú al hacer clic en un enlace
        const navLinks = document.querySelectorAll('.nav-item');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 992) {
                    sidebar.classList.remove('active');
                    document.body.classList.remove('sidebar-open');
                }
            });
        });

        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 992 && 
                !sidebar.contains(e.target) && 
                !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        });
    }

    // Simular carga de datos
    loadDashboardData();
    
    // Actualizar la hora cada minuto
    updateClock();
    setInterval(updateClock, 60000);
});

// Función para cargar datos del dashboard
function loadDashboardData() {
    // Aquí iría la lógica para cargar datos reales desde el backend
    console.log('Cargando datos del dashboard...');
    
    // Simular carga de datos con un retraso
    setTimeout(() => {
        // Actualizar notificaciones
        updateNotifications();
        
        // Actualizar estadísticas
        updateStats();
    }, 1000);
}

// Función para actualizar notificaciones
function updateNotifications() {
    // Aquí iría la lógica para cargar notificaciones reales
    const notifications = [
        { type: 'new', message: 'Nuevo turno agendado para mañana', time: 'Hace 15 min' },
        { type: 'warning', message: 'Stock bajo en filtros de aceite', time: 'Hace 1 hora' },
        { type: 'success', message: 'Pago recibido por servicio #1234', time: 'Ayer' }
    ];
    
    // Actualizar el contador de notificaciones
    const badge = document.querySelector('.badge');
    if (badge) {
        badge.textContent = notifications.length;
    }
    
    // Aquí podrías actualizar la interfaz de notificaciones si hay un mené desplegable
}

// Función para actualizar estadísticas
function updateStats() {
    // Aquí iría la lógica para cargar estadísticas reales
    const stats = {
        appointmentsToday: 8,
        inProgress: 3,
        lowStock: 5,
        rating: 4.8
    };
    
    // Actualizar las tarjetas con las estadísticas
    document.querySelector('.card:nth-child(1) .card-number').textContent = stats.appointmentsToday;
    document.querySelector('.card:nth-child(2) .card-number').textContent = stats.inProgress;
    document.querySelector('.card:nth-child(3) .card-number').textContent = stats.lowStock;
    document.querySelector('.card:nth-child(4) .card-number').textContent = stats.rating;
}

// Función para actualizar el reloj
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-AR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    
    const dateString = now.toLocaleDateString('es-AR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Actualizar la hora en la interfaz si hay un elemento para mostrarla
    const clockElement = document.getElementById('current-time');
    if (clockElement) {
        clockElement.textContent = timeString;
    }
    
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        dateElement.textContent = dateString.charAt(0).toUpperCase() + dateString.slice(1);
    }
}

// Función para manejar el cierre de sesión
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.querySelector('.nav-item:last-child');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Aquí iría la lógica para cerrar sesión
            console.log('Cerrando sesión...');
            // Redirigir a la página de inicio de sesión
            window.location.href = 'login.html';
        });
    }
});

// Función para manejar la búsqueda
document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.querySelector('.search-bar');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchInput = this.querySelector('input[type="text"]');
            const searchTerm = searchInput.value.trim();
            
            if (searchTerm) {
                console.log('Buscando:', searchTerm);
                // Aquí iría la lógica de búsqueda
                // Por ejemplo, filtrar elementos en la página o hacer una petición al servidor
                
                // Mostrar mensaje de búsqueda
                alert(`Búsqueda: ${searchTerm}`);
                
                // Limpiar el campo de búsqueda
                searchInput.value = '';
            }
        });
    }
});

// Función para manejar el clic en las tarjetas
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function() {
            // Obtener el título de la tarjeta
            const cardTitle = this.querySelector('h3').textContent;
            console.log(`Hiciste clic en: ${cardTitle}`);
            
            // Aquí podrías redirigir a la sección correspondiente
            // Por ejemplo:
            switch(cardTitle.trim()) {
                case 'Turnos Hoy':
                    window.location.href = 'workshop-appointments.html';
                    break;
                case 'En Progreso':
                    window.location.href = 'workshop-appointments.html?status=in_progress';
                    break;
                case 'Stock Bajo':
                    window.location.href = 'workshop-inventory.html?filter=low_stock';
                    break;
                case 'Valoración':
                    window.location.href = 'workshop-profile.html#reviews';
                    break;
            }
        });
    });
});
