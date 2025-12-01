document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const editProfileForm = document.getElementById('editProfileForm');
    const addServiceBtn = document.getElementById('addServiceBtn');
    const addServiceModal = document.getElementById('addServiceModal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const confirmAddService = document.getElementById('confirmAddService');
    const servicesContainer = document.getElementById('servicesContainer');
    const addScheduleBtn = document.getElementById('addScheduleBtn');
    const scheduleContainer = document.getElementById('scheduleContainer');
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    const imageUpload = document.getElementById('imageUpload');
    const coverUpload = document.getElementById('coverUpload');
    const coverPreview = document.getElementById('coverPreview');
    const avatarUpload = document.getElementById('avatarUpload');
    const avatarPreview = document.getElementById('avatarPreview');
    const changeCoverBtn = document.getElementById('changeCoverBtn');
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    
    // Toggle del menú en móviles
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
    }
    
    // Cerrar menú al hacer clic fuera de él
    document.addEventListener('click', function(e) {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.classList.remove('show');
        }
    });
    
    // Manejar envío del formulario
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Aquí iría la lógica para guardar los cambios
            showNotification('¡Los cambios se han guardado correctamente!', 'success');
        });
    }
    
    // Mostrar/ocultar modal de agregar servicio
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', function() {
            addServiceModal.classList.add('show');
        });
    }
    
    // Cerrar modales
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            addServiceModal.classList.remove('show');
        });
    });
    
    // Cerrar modal al hacer clic fuera del contenido
    window.addEventListener('click', function(e) {
        if (e.target === addServiceModal) {
            addServiceModal.classList.remove('show');
        }
    });
    
    // Agregar nuevo servicio
    if (confirmAddService) {
        confirmAddService.addEventListener('click', function() {
            const serviceName = document.getElementById('serviceName').value;
            const selectedIcon = document.querySelector('.icon-option.active').getAttribute('data-icon');
            
            if (serviceName.trim() === '') {
                showNotification('Por favor ingresa un nombre para el servicio', 'error');
                return;
            }
            
            addService(serviceName, selectedIcon);
            document.getElementById('serviceName').value = '';
            addServiceModal.classList.remove('show');
        });
    }
    
    // Función para agregar un servicio
    function addService(name, icon) {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-edit-card';
        serviceCard.innerHTML = `
            <div class="service-edit-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="service-edit-details">
                <input type="text" class="form-control" value="${name}" placeholder="Nombre del servicio">
                <div class="service-edit-actions">
                    <button type="button" class="btn btn-icon btn-remove-service">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Insertar antes del botón de agregar
        servicesContainer.insertBefore(serviceCard, addServiceBtn);
        
        // Agregar evento para eliminar servicio
        const removeBtn = serviceCard.querySelector('.btn-remove-service');
        removeBtn.addEventListener('click', function() {
            serviceCard.remove();
        });
    }
    
    // Eliminar servicio
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-remove-service')) {
            const serviceCard = e.target.closest('.service-edit-card');
            serviceCard.remove();
        }
    });
    
    // Seleccionar ícono
    document.querySelectorAll('.icon-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Agregar horario
    if (addScheduleBtn) {
        addScheduleBtn.addEventListener('click', function() {
            const scheduleItem = document.createElement('div');
            scheduleItem.className = 'schedule-item';
            scheduleItem.innerHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label>Día</label>
                        <select class="form-control">
                            <option>Lunes a Viernes</option>
                            <option>Lunes</option>
                            <option>Martes</option>
                            <option>Miércoles</option>
                            <option>Jueves</option>
                            <option>Viernes</option>
                            <option>Sábado</option>
                            <option>Domingo</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Horario</label>
                        <div class="time-range">
                            <input type="time" class="form-control" value="09:00">
                            <span>a</span>
                            <input type="time" class="form-control" value="18:00">
                        </div>
                    </div>
                    <button type="button" class="btn btn-icon btn-remove-schedule">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            scheduleContainer.appendChild(scheduleItem);
            
            // Agregar evento para eliminar horario
            const removeBtn = scheduleItem.querySelector('.btn-remove-schedule');
            removeBtn.addEventListener('click', function() {
                scheduleItem.remove();
            });
        });
    }
    
    // Eliminar horario
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-remove-schedule')) {
            const scheduleItem = e.target.closest('.schedule-item');
            scheduleItem.remove();
        }
    });
    
    // Subir imagen de galería
    if (uploadImageBtn && imageUpload) {
        uploadImageBtn.addEventListener('click', function() {
            imageUpload.click();
        });
        
        imageUpload.addEventListener('change', function(e) {
            if (e.target.files) {
                Array.from(e.target.files).forEach(file => {
                    const reader = new FileReader();
                    
                    reader.onload = function(event) {
                        const galleryItem = document.createElement('div');
                        galleryItem.className = 'gallery-item';
                        galleryItem.innerHTML = `
                            <img src="${event.target.result}" alt="Imagen del taller">
                            <div class="gallery-item-actions">
                                <button type="button" class="btn btn-icon">
                                    <i class="fas fa-arrows-alt"></i>
                                </button>
                                <button type="button" class="btn btn-icon">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `;
                        
                        // Insertar antes del botón de subir
                        uploadImageBtn.parentNode.insertBefore(galleryItem, uploadImageBtn);
                        
                        // Agregar evento para eliminar imagen
                        const deleteBtn = galleryItem.querySelector('.fa-trash').closest('button');
                        deleteBtn.addEventListener('click', function() {
                            galleryItem.remove();
                        });
                    };
                    
                    reader.readAsDataURL(file);
                });
            }
        });
    }
    
    // Cambiar foto de portada
    if (changeCoverBtn && coverUpload) {
        changeCoverBtn.addEventListener('click', function() {
            coverUpload.click();
        });
        
        coverUpload.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(event) {
                    coverPreview.src = event.target.result;
                };
                
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }
    
    // Cambiar foto de perfil
    if (changeAvatarBtn && avatarUpload) {
        changeAvatarBtn.addEventListener('click', function() {
            avatarUpload.click();
        });
        
        avatarUpload.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(event) {
                    avatarPreview.src = event.target.result;
                };
                
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }
    
    // Función para mostrar notificaciones
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Mostrar notificación
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Ocultar y eliminar después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Inicializar arrastrar y soltar para la galería
    initDragAndDrop();
    
    function initDragAndDrop() {
        const gallery = document.getElementById('galleryContainer');
        
        if (!gallery) return;
        
        let draggedItem = null;
        
        gallery.addEventListener('dragstart', function(e) {
            if (e.target.classList.contains('gallery-item')) {
                draggedItem = e.target;
                setTimeout(() => {
                    e.target.style.opacity = '0.5';
                }, 0);
            }
        });
        
        gallery.addEventListener('dragend', function(e) {
            if (e.target.classList.contains('gallery-item')) {
                e.target.style.opacity = '1';
            }
        });
        
        gallery.addEventListener('dragover', function(e) {
            e.preventDefault();
            const afterElement = getDragAfterElement(gallery, e.clientY);
            const draggable = document.querySelector('.dragging');
            
            if (afterElement == null) {
                if (gallery.lastElementChild !== uploadImageBtn) {
                    gallery.insertBefore(draggable, uploadImageBtn);
                } else {
                    gallery.insertBefore(draggable, uploadImageBtn);
                }
            } else {
                gallery.insertBefore(draggable, afterElement);
            }
        });
        
        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('.gallery-item:not(.dragging)')];
            
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }
        
        // Agregar clase dragging al elemento arrastrado
        document.addEventListener('dragstart', function(e) {
            if (e.target.classList.contains('gallery-item')) {
                e.target.classList.add('dragging');
            }
        });
        
        document.addEventListener('dragend', function(e) {
            if (e.target.classList.contains('gallery-item')) {
                e.target.classList.remove('dragging');
            }
        });
    }
    
    // Agregar estilos para las notificaciones
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 6px;
            color: white;
            font-size: 0.9rem;
            transform: translateX(120%);
            transition: transform 0.3s ease, opacity 0.3s ease;
            z-index: 3000;
            opacity: 0;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .notification.show {
            transform: translateX(0);
            opacity: 1;
        }
        
        .notification.success {
            background-color: #27ae60;
        }
        
        .notification.error {
            background-color: #e74c3c;
        }
        
        .notification.warning {
            background-color: #f39c12;
        }
        
        .notification.info {
            background-color: #3498db;
        }
        
        /* Estilos para arrastrar y soltar */
        .gallery-item {
            cursor: move;
            user-select: none;
            transition: opacity 0.2s ease;
        }
        
        .gallery-item.dragging {
            opacity: 0.5;
        }
    `;
    document.head.appendChild(style);
});
