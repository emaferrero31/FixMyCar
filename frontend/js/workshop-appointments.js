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
    }

    // Inicializar la vista de calendario
    initCalendar();
    
    // Inicializar eventos de la interfaz
    initEventListeners();
    
    // Cargar datos iniciales
    loadAppointments();
});

// Variables globales
let currentDate = new Date();
let selectedAppointment = null;

// Inicializar el calendario
function initCalendar() {
    updateWeekDisplay();
    setupNavigation();
    setupViewToggles();
}

// Actualizar la visualización de la semana actual
function updateWeekDisplay() {
    const weekStart = getWeekStart(currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4); // Mostrar solo días laborables (lunes a viernes)
    
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    document.getElementById('current-week').textContent = 
        `Semana del ${weekStart.toLocaleDateString('es-AR', { day: 'numeric' })} al ${weekEnd.toLocaleDateString('es-AR', options)}`;
    
    updateDayHeaders(weekStart);
}

// Obtener el inicio de la semana (lunes)
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que la semana empiece el lunes
    return new Date(d.setDate(diff));
}

// Actualizar los encabezados de los días
function updateDayHeaders(startDate) {
    const dayElements = document.querySelectorAll('.week-day');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    dayElements.forEach((dayEl, index) => {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + index);
        
        const dayName = currentDate.toLocaleDateString('es-AR', { weekday: 'short' });
        const dayNumber = currentDate.getDate();
        
        const dayHeader = dayEl.querySelector('.day-header');
        const dayNameEl = dayHeader.querySelector('.day-name');
        const dayNumberEl = dayHeader.querySelector('.day-number');
        
        dayNameEl.textContent = dayName.charAt(0).toUpperCase() + dayName.slice(1, 3);
        dayNumberEl.textContent = dayNumber;
        
        // Resaltar el día actual
        dayNumberEl.classList.remove('today');
        if (currentDate.toDateString() === today.toDateString()) {
            dayNumberEl.classList.add('today');
        }
        
        // Actualizar la fecha en el atributo de datos para referencia
        dayEl.dataset.date = currentDate.toISOString().split('T')[0];
    });
}

// Configurar la navegación del calendario
function setupNavigation() {
    document.getElementById('prev-week').addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() - 7);
        updateWeekDisplay();
        loadAppointments();
    });
    
    document.getElementById('next-week').addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() + 7);
        updateWeekDisplay();
        loadAppointments();
    });
    
    document.getElementById('today-btn').addEventListener('click', function() {
        currentDate = new Date();
        updateWeekDisplay();
        loadAppointments();
    });
}

// Configurar los botones de cambio de vista
function setupViewToggles() {
    const weekViewBtn = document.getElementById('week-view');
    const dayViewBtn = document.getElementById('day-view');
    const listViewBtn = document.getElementById('list-view');
    
    weekViewBtn.addEventListener('click', function() {
        // Cambiar a vista semanal
        document.querySelector('.appointments-container').classList.remove('day-view', 'list-view');
        document.querySelectorAll('.view-toggle .btn-icon').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
    });
    
    dayViewBtn.addEventListener('click', function() {
        // Cambiar a vista diaria
        document.querySelector('.appointments-container').classList.remove('list-view');
        document.querySelector('.appointments-container').classList.add('day-view');
        document.querySelectorAll('.view-toggle .btn-icon').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
    });
    
    listViewBtn.addEventListener('click', function() {
        // Cambiar a vista de lista
        document.querySelector('.appointments-container').classList.remove('day-view');
        document.querySelector('.appointments-container').classList.add('list-view');
        document.querySelectorAll('.view-toggle .btn-icon').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
    });
}

// Cargar los turnos desde el servidor (simulado)
function loadAppointments() {
    // En una aplicación real, aquí harías una petición al servidor
    console.log('Cargando turnos para la semana...');
    
    // Simular carga con datos de ejemplo
    setTimeout(() => {
        // Aquí iría la lógica para mostrar los turnos en el calendario
        console.log('Turnos cargados');
        // Por ahora, solo actualizamos el contador de notificaciones
        updateNotificationCount(3);
    }, 500);
}

// Actualizar el contador de notificaciones
function updateNotificationCount(count) {
    const badge = document.querySelector('.notifications .badge');
    if (badge) {
        badge.textContent = count;
    }
}

// Configurar los oyentes de eventos
function initEventListeners() {
    // Mostrar/ocultar detalles del turno al hacer clic
    document.querySelectorAll('.appointment-card').forEach(card => {
        card.addEventListener('click', function() {
            selectAppointment(this.dataset.id);
        });
    });
    
    // Botón de nuevo turno
    document.getElementById('new-appointment').addEventListener('click', function() {
        openAppointmentModal();
    });
    
    // Filtros
    document.getElementById('apply-filters').addEventListener('click', function() {
        applyFilters();
    });
    
    // Modal
    const modal = document.getElementById('appointment-modal');
    if (modal) {
        // Abrir modal
        document.querySelectorAll('[data-action="edit-appointment"]').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                openAppointmentModal(this.dataset.id);
            });
        });
        
        // Cerrar modal
        document.getElementById('close-modal').addEventListener('click', closeAppointmentModal);
        document.getElementById('cancel-form').addEventListener('click', closeAppointmentModal);
        
        // Cerrar al hacer clic fuera del modal
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeAppointmentModal();
            }
        });
        
        // Enviar formulario
        document.getElementById('appointment-form').addEventListener('submit', function(e) {
            e.preventDefault();
            saveAppointment();
        });
    }
    
    // Botones de acción rápida
    const startServiceBtn = document.getElementById('start-service');
    if (startServiceBtn) {
        startServiceBtn.addEventListener('click', function() {
            if (selectedAppointment) {
                updateAppointmentStatus(selectedAppointment, 'in-progress');
            }
        });
    }
    
    const completeServiceBtn = document.getElementById('complete-service');
    if (completeServiceBtn) {
        completeServiceBtn.addEventListener('click', function() {
            if (selectedAppointment) {
                updateAppointmentStatus(selectedAppointment, 'completed');
            }
        });
    }
    
    const cancelAppointmentBtn = document.getElementById('cancel-appointment');
    if (cancelAppointmentBtn) {
        cancelAppointmentBtn.addEventListener('click', function() {
            if (selectedAppointment && confirm('¿Estás seguro de que deseas cancelar este turno?')) {
                updateAppointmentStatus(selectedAppointment, 'cancelled');
            }
        });
    }
    
    const sendReminderBtn = document.getElementById('send-reminder');
    if (sendReminderBtn) {
        sendReminderBtn.addEventListener('click', function() {
            if (selectedAppointment) {
                sendReminder(selectedAppointment);
            }
        });
    }
}

// Seleccionar un turno
function selectAppointment(appointmentId) {
    // Aquí iría la lógica para cargar los detalles del turno
    console.log('Turno seleccionado:', appointmentId);
    
    // Simular carga de detalles
    selectedAppointment = appointmentId;
    
    // Resaltar el turno seleccionado
    document.querySelectorAll('.appointment-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.id === appointmentId) {
            card.classList.add('selected');
        }
    });
    
    // Mostrar los detalles
    showAppointmentDetails(appointmentId);
}

// Mostrar detalles de un turno
function showAppointmentDetails(appointmentId) {
    const detailPlaceholder = document.querySelector('.detail-placeholder');
    const detailInfo = document.querySelector('.detail-info');
    
    if (detailPlaceholder) detailPlaceholder.style.display = 'none';
    if (detailInfo) detailInfo.style.display = 'block';
    
    // Aquí iría la lógica para cargar los detalles reales del turno
    // Por ahora, mostramos datos de ejemplo
    const appointmentData = {
        clientName: 'Juan Pérez',
        clientPhone: '+54 9 11 1234-5678',
        clientEmail: 'juan.perez@email.com',
        vehicleModel: 'Toyota Corolla',
        vehicleYear: '2020',
        vehiclePlate: 'AB 123 CD',
        vehicleMileage: '45,200 km',
        date: 'Lun, 27 Nov 2023',
        time: '09:00 - 10:30',
        service: 'Cambio de aceite y filtro',
        status: 'confirmed',
        notes: 'El cliente mencionó un ruido en el motor al arrancar en frío. Verificar niveles de líquidos y presión de neumáticos.'
    };
    
    // Actualizar la interfaz con los datos del turno
    if (detailInfo) {
        document.getElementById('client-name').textContent = appointmentData.clientName;
        document.getElementById('client-phone').textContent = appointmentData.clientPhone;
        document.getElementById('client-email').textContent = appointmentData.clientEmail;
        document.getElementById('vehicle-model').textContent = appointmentData.vehicleModel;
        document.getElementById('vehicle-year').textContent = appointmentData.vehicleYear;
        document.getElementById('vehicle-plate').textContent = appointmentData.vehiclePlate;
        document.getElementById('vehicle-mileage').textContent = appointmentData.vehicleMileage;
        document.getElementById('appointment-date').textContent = appointmentData.date;
        document.getElementById('appointment-time').textContent = appointmentData.time;
        document.getElementById('service-type').textContent = appointmentData.service;
        document.getElementById('appointment-notes').textContent = appointmentData.notes;
        
        // Actualizar el estado en los botones
        updateActionButtons(appointmentData.status);
    }
}

// Actualizar los botones de acción según el estado del turno
function updateActionButtons(status) {
    const startBtn = document.getElementById('start-service');
    const completeBtn = document.getElementById('complete-service');
    const cancelBtn = document.getElementById('cancel-appointment');
    const reminderBtn = document.getElementById('send-reminder');
    
    // Resetear todos los botones
    [startBtn, completeBtn, cancelBtn, reminderBtn].forEach(btn => {
        if (btn) {
            btn.style.display = 'inline-flex';
            btn.disabled = false;
        }
    });
    
    // Configurar según el estado
    switch(status) {
        case 'pending':
            completeBtn.style.display = 'none';
            break;
            
        case 'confirmed':
            // Mostrar todos los botones
            break;
            
        case 'in-progress':
            startBtn.style.display = 'none';
            break;
            
        case 'completed':
        case 'cancelled':
            startBtn.style.display = 'none';
            completeBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
            reminderBtn.style.display = 'none';
            break;
    }
}

// Abrir el modal de turno
function openAppointmentModal(appointmentId = null) {
    const modal = document.getElementById('appointment-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('appointment-form');
    
    if (appointmentId) {
        // Modo edición
        modalTitle.textContent = 'Editar Turno';
        form.dataset.mode = 'edit';
        form.dataset.appointmentId = appointmentId;
        
        // Aquí iría la lógica para cargar los datos del turno
        console.log('Cargando datos del turno:', appointmentId);
        
        // Simular carga de datos
        const formData = {
            client: 'Juan Pérez',
            date: '2023-11-27',
            time: '09:00',
            service: 'maintenance',
            description: 'Cambio de aceite y filtro',
            notes: 'El cliente mencionó un ruido en el motor al arrancar en frío.'
        };
        
        // Rellenar el formulario con los datos
        document.getElementById('client-search').value = formData.client;
        document.getElementById('appointment-date').value = formData.date;
        document.getElementById('appointment-time').value = formData.time;
        document.getElementById('service-type').value = formData.service;
        document.getElementById('service-description').value = formData.description;
        document.getElementById('appointment-notes').value = formData.notes;
    } else {
        // Modo nuevo
        modalTitle.textContent = 'Nuevo Turno';
        form.dataset.mode = 'new';
        form.reset();
        
        // Establecer la fecha y hora por defecto
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        document.getElementById('appointment-date').value = dateStr;
        document.getElementById('appointment-time').value = timeStr;
    }
    
    // Mostrar el modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Enfocar el primer campo
    setTimeout(() => {
        if (appointmentId) {
            document.getElementById('appointment-date').focus();
        } else {
            document.getElementById('client-search').focus();
        }
    }, 100);
}

// Cerrar el modal de turno
function closeAppointmentModal() {
    const modal = document.getElementById('appointment-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Guardar un turno (nuevo o edición)
function saveAppointment() {
    const form = document.getElementById('appointment-form');
    const isEdit = form.dataset.mode === 'edit';
    const formData = new FormData(form);
    
    // Aquí iría la lógica para enviar los datos al servidor
    console.log('Guardando turno...', Object.fromEntries(formData));
    
    // Simular guardado
    setTimeout(() => {
        closeAppointmentModal();
        showNotification(
            isEdit ? 'Turno actualizado correctamente' : 'Turno creado correctamente',
            'success'
        );
        
        // Recargar los turnos
        loadAppointments();
    }, 1000);
}

// Aplicar filtros
function applyFilters() {
    const dateFilter = document.getElementById('date-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const serviceFilter = document.getElementById('service-filter').value;
    
    console.log('Aplicando filtros:', { dateFilter, statusFilter, serviceFilter });
    
    // Aquí iría la lógica para aplicar los filtros
    // Por ahora, simulamos un recargo
    loadAppointments();
}

// Actualizar el estado de un turno
function updateAppointmentStatus(appointmentId, newStatus) {
    console.log(`Actualizando estado del turno ${appointmentId} a ${newStatus}`);
    
    // Aquí iría la lógica para actualizar el estado en el servidor
    // Por ahora, simulamos la actualización
    setTimeout(() => {
        // Actualizar la interfaz
        const appointmentCard = document.querySelector(`.appointment-card[data-id="${appointmentId}"]`);
        if (appointmentCard) {
            appointmentCard.dataset.status = newStatus;
            const statusBadge = appointmentCard.querySelector('.badge');
            if (statusBadge) {
                // Actualizar la clase del badge
                statusBadge.className = 'badge';
                statusBadge.classList.add(newStatus);
                
                // Actualizar el texto del estado
                let statusText = '';
                switch(newStatus) {
                    case 'pending': statusText = 'Pendiente'; break;
                    case 'confirmed': statusText = 'Confirmado'; break;
                    case 'in-progress': statusText = 'En progreso'; break;
                    case 'completed': statusText = 'Completado'; break;
                    case 'cancelled': statusText = 'Cancelado'; break;
                }
                statusBadge.textContent = statusText;
            }
        }
        
        // Actualizar los botones de acción
        updateActionButtons(newStatus);
        
        showNotification('Estado del turno actualizado correctamente', 'success');
    }, 500);
}

// Enviar recordatorio
function sendReminder(appointmentId) {
    console.log(`Enviando recordatorio para el turno ${appointmentId}`);
    
    // Aquí iría la lógica para enviar el recordatorio
    // Por ahora, simulamos el envío
    setTimeout(() => {
        showNotification('Recordatorio enviado correctamente', 'success');
    }, 1000);
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    // Aquí iría la lógica para mostrar una notificación
    // Por ahora, usamos un alert simple
    alert(`${type.toUpperCase()}: ${message}`);
}

// Inicializar tooltips
function initTooltips() {
    // Aquí iría la lógica para inicializar tooltips
    // Por ejemplo, usando la API de tooltips de Bootstrap o similar
}

// Inicializar datepickers
function initDatepickers() {
    // Aquí iría la lógica para inicializar datepickers
    // Por ejemplo, usando flatpickr, jQuery UI Datepicker, etc.
}

// Inicializar timepickers
function initTimepickers() {
    // Aquí iría la lógica para inicializar timepickers
}

// Inicializar autocompletado de clientes
function initClientAutocomplete() {
    // Aquí iría la lógica para el autocompletado de clientes
    // Por ejemplo, usando la API de Google Places o una lista personalizada
}

// Inicializar la aplicación cuando el DOM esté completamente cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function initApp() {
    // Inicializar componentes adicionales
    initTooltips();
    initDatepickers();
    initTimepickers();
    initClientAutocomplete();
}
