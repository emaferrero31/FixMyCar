document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const addVehicleBtn = document.getElementById('addVehicleBtn');
    const vehicleModal = document.getElementById('vehicleModal');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const vehicleForm = document.getElementById('vehicleForm');
    const vehiclesGrid = document.querySelector('.vehicles-grid');
    
    // Datos de ejemplo (en un caso real, estos vendrían de una API)
    let vehicles = [
        {
            id: 1,
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020',
            licensePlate: 'ABC-1234',
            color: 'Rojo',
            fuelType: 'Gasolina',
            mileage: '45,000 km',
            image: 'https://www.carlogos.org/logo/Toyota-logo-1989-1920x1080.png'
        },
        {
            id: 2,
            brand: 'Honda',
            model: 'Civic',
            year: '2019',
            licensePlate: 'XYZ-5678',
            color: 'Azul',
            fuelType: 'Híbrido',
            mileage: '32,500 km',
            image: 'https://www.carlogos.org/logo/Honda-logo-1920x1080.png'
        }
    ];
    
    // Actualizar el contador de vehículos
    function updateVehiclesCount() {
        const countElement = document.querySelector('.vehicles-count');
        if (countElement) {
            const count = vehicles.length;
            countElement.textContent = `${count} vehículo${count !== 1 ? 's' : ''} registrado${count !== 1 ? 's' : ''}`;
        }
    }
    
    // Variables para el modo de edición
    let isEditMode = false;
    let currentVehicleId = null;
    
    // Mostrar el modal para agregar/editar vehículo
    function showModal(vehicle = null) {
        const modalTitle = document.getElementById('modalTitle');
        
        if (vehicle) {
            // Modo edición
            isEditMode = true;
            currentVehicleId = vehicle.id;
            modalTitle.textContent = 'Editar Vehículo';
            
            // Llenar el formulario con los datos del vehículo
            document.getElementById('brand').value = vehicle.brand;
            document.getElementById('model').value = vehicle.model;
            document.getElementById('year').value = vehicle.year;
            document.getElementById('licensePlate').value = vehicle.licensePlate;
            document.getElementById('color').value = vehicle.color;
        } else {
            // Modo agregar
            isEditMode = false;
            currentVehicleId = null;
            modalTitle.textContent = 'Agregar Vehículo';
            
            // Limpiar el formulario
            vehicleForm.reset();
        }
        
        // Mostrar el modal
        vehicleModal.classList.add('active');
    }
    
    // Ocultar el modal
    function hideModal() {
        vehicleModal.classList.remove('active');
        // Limpiar el formulario después de cerrar el modal
        setTimeout(() => {
            vehicleForm.reset();
        }, 300);
    }
    
    // Renderizar la lista de vehículos
    function renderVehicles() {
        // Actualizar el contador
        updateVehiclesCount();
        
        // Limpiar el contenedor
        vehiclesGrid.innerHTML = '';
        
        // Mostrar mensaje si no hay vehículos
        if (vehicles.length === 0) {
            vehiclesGrid.innerHTML = `
                <div class="no-vehicles">
                    <i class="fas fa-car-side"></i>
                    <p>No tienes vehículos registrados</p>
                    <button class="btn-primary" id="addFirstVehicleBtn">
                        <i class="fas fa-plus"></i> Agregar mi primer vehículo
                    </button>
                </div>
            `;
            
            document.getElementById('addFirstVehicleBtn')?.addEventListener('click', () => showModal());
            return;
        }
        
        // Agregar cada vehículo al grid
        vehicles.forEach(vehicle => {
            const vehicleCard = document.createElement('div');
            vehicleCard.className = 'vehicle-card';
            vehicleCard.dataset.id = vehicle.id;
            
            vehicleCard.innerHTML = `
                <div class="vehicle-image">
                    <img src="${vehicle.image}" alt="${vehicle.brand} ${vehicle.model}">
                </div>
                <div class="vehicle-details">
                    <div class="vehicle-title">
                        <h4>${vehicle.brand} ${vehicle.model}</h4>
                        <span class="vehicle-year">${vehicle.year}</span>
                    </div>
                    <div class="vehicle-info">
                        <span><i class="fas fa-car"></i> ${vehicle.licensePlate}</span>
                        <span><i class="fas fa-paint-brush"></i> ${vehicle.color}</span>
                        <span><i class="fas fa-gas-pump"></i> ${vehicle.fuelType}</span>
                        <span><i class="fas fa-tachometer-alt"></i> ${vehicle.mileage}</span>
                    </div>
                    <div class="vehicle-actions">
                        <button class="btn-edit" data-id="${vehicle.id}">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-delete" data-id="${vehicle.id}">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
            
            vehiclesGrid.appendChild(vehicleCard);
        });
        
        // Agregar event listeners a los botones de editar y eliminar
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const vehicleId = parseInt(e.currentTarget.dataset.id);
                const vehicle = vehicles.find(v => v.id === vehicleId);
                if (vehicle) {
                    showModal(vehicle);
                }
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('¿Estás seguro de que deseas eliminar este vehículo?')) {
                    const vehicleId = parseInt(e.currentTarget.dataset.id);
                    deleteVehicle(vehicleId);
                }
            });
        });
    }
    
    // Agregar un nuevo vehículo
    function addVehicle(vehicleData) {
        // En un caso real, aquí harías una petición a tu API
        const newVehicle = {
            id: Date.now(), // Usamos el timestamp como ID temporal
            ...vehicleData,
            image: `https://via.placeholder.com/300x150/2c3e50/ffffff?text=${encodeURIComponent(vehicleData.brand.toUpperCase())}`
        };
        
        vehicles.push(newVehicle);
        renderVehicles();
    }
    
    // Actualizar un vehículo existente
    function updateVehicle(id, vehicleData) {
        // En un caso real, aquí harías una petición a tu API
        const index = vehicles.findIndex(v => v.id === id);
        if (index !== -1) {
            vehicles[index] = {
                ...vehicles[index],
                ...vehicleData
            };
            renderVehicles();
        }
    }
    
    // Eliminar un vehículo
    function deleteVehicle(id) {
        // En un caso real, aquí harías una petición a tu API
        vehicles = vehicles.filter(vehicle => vehicle.id !== id);
        renderVehicles();
    }
    
    // Event Listeners
    addVehicleBtn.addEventListener('click', () => showModal());
    
    closeModal.addEventListener('click', hideModal);
    cancelBtn.addEventListener('click', hideModal);
    
    // Cerrar el modal al hacer clic fuera del contenido
    window.addEventListener('click', (e) => {
        if (e.target === vehicleModal) {
            hideModal();
        }
    });
    
    // Manejar el envío del formulario
    vehicleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(vehicleForm);
        const vehicleData = {
            brand: formData.get('brand'),
            model: formData.get('model'),
            year: formData.get('year'),
            licensePlate: formData.get('licensePlate'),
            color: formData.get('color')
        };
        
        if (isEditMode && currentVehicleId) {
            updateVehicle(currentVehicleId, vehicleData);
        } else {
            addVehicle(vehicleData);
        }
        
        hideModal();
    });
    
    // Renderizar los vehículos al cargar la página
    renderVehicles();


    // Alternar menú en pantallas pequeñas
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });

        // Cerrar menú al hacer clic en un enlace
        const navLinks = document.querySelectorAll('.nav-item');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    menuToggle.classList.remove('active');
                }
            });
        });

        // Cerrar menú al hacer clic fuera de él
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                !sidebar.contains(e.target) && 
                !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
    }
});
