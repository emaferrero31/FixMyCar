document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let selectedItems = [];
    
    // Elementos del DOM
    const inventoryTable = document.querySelector('.inventory-table');
    const checkboxes = document.querySelectorAll('.item-checkbox');
    const selectAllCheckbox = document.getElementById('select-all');
    const bulkActions = document.getElementById('bulkActions');
    const selectedItemsCount = document.getElementById('selectedItemsCount');
    const searchInput = document.getElementById('search-inventory');
    const categoryFilter = document.getElementById('category-filter');
    const stockFilter = document.getElementById('stock-filter');
    const addItemBtn = document.getElementById('add-item');
    const productModal = document.getElementById('product-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const productForm = document.getElementById('product-form');
    
    // Inicialización
    initEventListeners();
    
    // Funciones de inicialización
    function initEventListeners() {
        // Selección de ítems
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', handleCheckboxChange);
        });
        
        // Seleccionar todos los ítems
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', handleSelectAll);
        }
        
        // Filtros
        if (searchInput) {
            searchInput.addEventListener('input', filterInventory);
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', filterInventory);
        }
        
        if (stockFilter) {
            stockFilter.addEventListener('change', filterInventory);
        }
        
        // Botón para agregar nuevo ítem
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => {
                openProductModal();
            });
        }
        
        // Cerrar modal
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', closeProductModal);
        });
        
        // Enviar formulario
        if (productForm) {
            productForm.addEventListener('submit', handleFormSubmit);
        }
        
        // Cerrar modal al hacer clic fuera del contenido
        window.addEventListener('click', (e) => {
            if (e.target === productModal) {
                closeProductModal();
            }
        });
        
        // Manejar clics en los botones de acción
        document.addEventListener('click', (e) => {
            // Botón de editar
            if (e.target.closest('.btn-edit')) {
                const row = e.target.closest('tr');
                const itemId = row ? row.getAttribute('data-id') : null;
                if (itemId) {
                    openProductModal(itemId);
                }
            }
            
            // Botón de eliminar
            if (e.target.closest('.btn-delete')) {
                const row = e.target.closest('tr');
                const itemId = row ? row.getAttribute('data-id') : null;
                if (itemId) {
                    deleteItem(itemId, row);
                }
            }
        });
    }
    
    // Manejar cambios en los checkboxes
    function handleCheckboxChange(e) {
        const checkbox = e.target;
        const row = checkbox.closest('tr');
        const itemId = row.getAttribute('data-id');
        
        if (checkbox.checked) {
            selectedItems.push(itemId);
            row.classList.add('selected');
        } else {
            selectedItems = selectedItems.filter(id => id !== itemId);
            row.classList.remove('selected');
            
            // Desmarcar "seleccionar todos" si se desmarca un ítem
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = false;
            }
        }
        
        updateBulkActions();
    }
    
    // Seleccionar todos los ítems
    function handleSelectAll(e) {
        const isChecked = e.target.checked;
        const checkboxes = document.querySelectorAll('.item-checkbox:not(#select-all)');
        
        selectedItems = [];
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
            const row = checkbox.closest('tr');
            
            if (isChecked) {
                const itemId = row.getAttribute('data-id');
                selectedItems.push(itemId);
                row.classList.add('selected');
            } else {
                row.classList.remove('selected');
            }
        });
        
        updateBulkActions();
    }
    
    // Actualizar la barra de acciones masivas
    function updateBulkActions() {
        if (selectedItems.length > 0) {
            bulkActions.style.display = 'flex';
            selectedItemsCount.textContent = selectedItems.length;
        } else {
            bulkActions.style.display = 'none';
        }
    }
    
    // Filtrar la tabla de inventario
    function filterInventory() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        const stockStatus = stockFilter.value;
        const rows = document.querySelectorAll('.inventory-item');
        
        rows.forEach(row => {
            const itemName = row.querySelector('h4').textContent.toLowerCase();
            const itemSku = row.querySelector('.item-sku').textContent.toLowerCase();
            const itemCategory = row.getAttribute('data-category');
            const itemStock = parseInt(row.getAttribute('data-stock'));
            
            const matchesSearch = itemName.includes(searchTerm) || itemSku.includes(searchTerm);
            const matchesCategory = category === 'all' || itemCategory === category;
            
            let matchesStock = true;
            if (stockStatus === 'low' && itemStock > 5) matchesStock = false;
            if (stockStatus === 'critical' && itemStock > 0) matchesStock = false;
            if (stockStatus === 'out' && itemStock > 0) matchesStock = false;
            
            if (matchesSearch && matchesCategory && matchesStock) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    // Abrir modal de producto
    function openProductModal(itemId = null) {
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('product-form');
        
        if (itemId) {
            // Modo edición
            modalTitle.textContent = 'Editar Producto';
            // Aquí cargarías los datos del producto con el ID proporcionado
            // Por ahora, solo mostramos el modal con datos de ejemplo
            populateFormWithDummyData();
        } else {
            // Modo nuevo producto
            modalTitle.textContent = 'Nuevo Producto';
            form.reset();
        }
        
        productModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    // Cerrar modal de producto
    function closeProductModal() {
        productModal.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    // Manejar envío del formulario
    function handleFormSubmit(e) {
        e.preventDefault();
        
        // Aquí iría la lógica para guardar el producto
        // Por ahora, solo cerramos el modal
        closeProductModal();
        
        // Mostrar notificación de éxito
        showNotification('¡Producto guardado correctamente!', 'success');
    }
    
    // Eliminar un ítem
    function deleteItem(itemId, row) {
        if (confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
            // Aquí iría la lógica para eliminar el producto del servidor
            // Por ahora, solo eliminamos la fila de la tabla
            row.style.animation = 'fadeOut 0.3s ease forwards';
            
            setTimeout(() => {
                row.remove();
                // Mostrar notificación de éxito
                showNotification('Producto eliminado correctamente', 'success');
            }, 300);
        }
    }
    
    // Mostrar notificación
    function showNotification(message, type = 'info') {
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
    
    // Función de ejemplo para rellenar el formulario con datos de prueba
    function populateFormWithDummyData() {
        // Esta es solo una función de ejemplo para mostrar cómo se rellenaría el formulario
        // En una aplicación real, estos datos vendrían de una API
        const formData = {
            name: 'Filtro de Aceite',
            sku: 'FLT-001',
            category: 'filtros',
            supplier: 'Filtros S.A.',
            stock: 15,
            minStock: 5,
            maxStock: 30,
            price: 1000,
            salePrice: 1250,
            description: 'Filtro de aceite de alta calidad para la mayoría de los vehículos.'
        };
        
        // Rellenar los campos del formulario
        document.getElementById('product-name').value = formData.name;
        document.getElementById('product-sku').value = formData.sku;
        document.getElementById('product-category').value = formData.category;
        document.getElementById('product-supplier').value = formData.supplier;
        document.getElementById('product-stock').value = formData.stock;
        document.getElementById('product-min-stock').value = formData.minStock;
        document.getElementById('product-max-stock').value = formData.maxStock;
        document.getElementById('product-price').value = formData.price;
        document.getElementById('product-sale-price').value = formData.salePrice;
        document.getElementById('product-description').value = formData.description;
    }
    
    // Inicializar tooltips
    function initTooltips() {
        const tooltipElements = document.querySelectorAll('[title]');
        
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', showTooltip);
            element.addEventListener('mouseleave', hideTooltip);
        });
    }
    
    // Mostrar tooltip
    function showTooltip(e) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = this.getAttribute('title');
        
        document.body.appendChild(tooltip);
        
        const rect = this.getBoundingClientRect();
        tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
        tooltip.style.left = `${rect.left + window.scrollX + (this.offsetWidth - tooltip.offsetWidth) / 2}px`;
        
        this._tooltip = tooltip;
    }
    
    // Ocultar tooltip
    function hideTooltip() {
        if (this._tooltip) {
            this._tooltip.remove();
            this._tooltip = null;
        }
    }
    
    // Inicializar tooltips
    initTooltips();
});

// Añadir estilos para las notificaciones
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
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
    
    .tooltip {
        position: absolute;
        background-color: #2c3e50;
        color: white;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 0.8rem;
        z-index: 2000;
        pointer-events: none;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    
    .tooltip::after {
        content: '';
        position: absolute;
        bottom: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: transparent transparent #2c3e50 transparent;
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
    }
`;
document.head.appendChild(style);
