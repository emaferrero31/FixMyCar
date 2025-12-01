// Inicialización de la página
document.addEventListener('DOMContentLoaded', function() {
    // Manejar el envío del formulario de búsqueda
    const searchForm = document.querySelector('.search-container');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchTerm = this.querySelector('input[type="text"]').value;
            alert(`Buscando: ${searchTerm}`);
            // Aquí iría la lógica de búsqueda real
        });
    }
});

// Manejar el scroll para la barra de navegación
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.padding = '10px 0';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.padding = '15px 0';
        navbar.style.boxShadow = 'none';
    }
});
