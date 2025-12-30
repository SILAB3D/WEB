// Script para cargar y mostrar materiales desde filamentos.json
document.addEventListener('DOMContentLoaded', async function() {
    // Cargar materiales si estamos en la página de materiales
    const materialesGrid = document.getElementById('materialesGrid');
    if (materialesGrid) {
        try {
            const response = await fetch('../data/filamentos.json');
            const data = await response.json();
            const filamentos = data.filamentos;

            // Generar las tarjetas de materiales
            materialesGrid.innerHTML = filamentos.map(filamento => `
                <div class="material-card">
                    <div class="material-icon">${filamento.icono}</div>
                    <h3>${filamento.nombre}</h3>
                    <div class="material-details">
                        <h4>Características:</h4>
                        <ul>
                            ${filamento.caracteristicas.map(car => `<li>${car}</li>`).join('')}
                        </ul>
                        <h4>Aplicaciones:</h4>
                        <p>${filamento.aplicaciones}</p>
                        <h4>Precio:</h4>
                        <p class="precio">${filamento.precioMin}€ - ${filamento.precioMax}€ ${filamento.precioUnidad}</p>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error cargando los materiales:', error);
            materialesGrid.innerHTML = '<p>Error al cargar los materiales. Por favor, intenta más tarde.</p>';
        }
    }

    // Script para filtrado de productos
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filterValue = this.getAttribute('data-filter');

                // Actualizar botón activo
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');

                // Filtrar productos
                productCards.forEach(card => {
                    if (filterValue === 'all') {
                        card.style.display = 'block';
                        setTimeout(() => card.style.opacity = '1', 10);
                    } else {
                        const cardCategory = card.getAttribute('data-category');
                        if (cardCategory === filterValue) {
                            card.style.display = 'block';
                            setTimeout(() => card.style.opacity = '1', 10);
                        } else {
                            card.style.opacity = '0';
                            setTimeout(() => card.style.display = 'none', 300);
                        }
                    }
                });
            });
        });
    }

    // Agregar animación suave a los productos
    productCards.forEach((card, index) => {
        card.style.opacity = '1';
        card.style.transition = 'opacity 0.3s ease';
    });

    // Manejador para botón comprar
    const comprarButtons = document.querySelectorAll('.btn-comprar');
    comprarButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productName = this.closest('.product-card').querySelector('h3').textContent;
            alert(`Producto añadido al carrito: ${productName}`);
        });
    });

    // Smooth scroll para navegación
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
