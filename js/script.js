// Script para cargar y mostrar materiales desde filamentos.json
document.addEventListener('DOMContentLoaded', async function() {
    // Navbar ocultar/mostrar en scroll (solo móvil)
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');
    const scrollThreshold = 100; // píxeles antes de activar el efecto
    
    function handleNavbarScroll() {
        // Solo aplicar en móvil (ancho menor a 768px)
        if (window.innerWidth <= 768) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > scrollThreshold) {
                if (scrollTop > lastScrollTop) {
                    // Scroll hacia abajo - ocultar navbar
                    navbar.classList.add('navbar-hidden');
                } else {
                    // Scroll hacia arriba - mostrar navbar
                    navbar.classList.remove('navbar-hidden');
                }
            } else {
                // En la parte superior, siempre mostrar
                navbar.classList.remove('navbar-hidden');
            }
            
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        } else {
            // En escritorio, siempre visible
            navbar.classList.remove('navbar-hidden');
        }
    }
    
    window.addEventListener('scroll', handleNavbarScroll, { passive: true });
    window.addEventListener('resize', handleNavbarScroll);

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

    // Aplicar filtro si viene desde index.html
    const savedFilter = sessionStorage.getItem('filterCategory');
    if (savedFilter) {
        sessionStorage.removeItem('filterCategory');
        const filterBtn = document.querySelector(`[data-filter="${savedFilter}"]`);
        if (filterBtn) {
            filterBtn.click();
        }
    }

    // Script para filtrado de productos
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');
    const productsGrid = document.querySelector('.products-grid');

    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filterValue = this.getAttribute('data-filter');

                // Actualizar botón activo
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');

                // Desvanecer todo el grid
                productsGrid.style.opacity = '0';
                productsGrid.style.transform = 'translateY(20px)';

                setTimeout(() => {
                    // Actualizar visibilidad de las tarjetas
                    productCards.forEach(card => {
                        const cardCategory = card.getAttribute('data-category');
                        const shouldShow = filterValue === 'all' || cardCategory === filterValue;
                        
                        if (shouldShow) {
                            card.style.display = 'flex';
                        } else {
                            card.style.display = 'none';
                        }
                    });

                    // Mostrar el grid nuevamente
                    setTimeout(() => {
                        productsGrid.style.opacity = '1';
                        productsGrid.style.transform = 'translateY(0)';
                    }, 80);
                }, 400);
            });
        });
    }

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

    // Modal de método de contacto para productos
    const modal = document.getElementById('contactModal');
    const modalWhatsApp = document.getElementById('modalWhatsApp');
    const modalEmail = document.getElementById('modalEmail');
    const closeModal = document.querySelector('.contact-modal-close');
    const buyButtons = document.querySelectorAll('.btn-comprar');

    // Función para generar URLs personalizadas
    function generateContactURLs(productName, category) {
        const whatsappMessage = `¡Hola! Me gustaría obtener más información acerca de ${productName}.`;
        const emailSubject = `Consulta sobre ${productName}`;
        const emailBody = `¡Hola!%0D%0A%0D%0AMe gustaría obtener más información acerca de ${productName}.%0D%0A%0D%0AGracias.`;

        return {
            whatsapp: `https://wa.me/34644070487?text=${encodeURIComponent(whatsappMessage)}`,
            email: `https://mail.google.com/mail/?view=cm&fs=1&to=silab3d@gmail.com&su=${encodeURIComponent(emailSubject)}&body=${emailBody}`
        };
    }

    // Abrir modal al hacer clic en botón de comprar
    if (buyButtons.length > 0) {
        buyButtons.forEach(button => {
            button.addEventListener('click', function() {
                const productName = this.getAttribute('data-product');
                const category = this.getAttribute('data-category');
                const urls = generateContactURLs(productName, category);

                // Actualizar URLs del modal
                modalWhatsApp.href = urls.whatsapp;
                modalEmail.href = urls.email;

                // Mostrar modal
                modal.classList.add('active');
            });
        });
    }

    // Cerrar modal
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            modal.classList.remove('active');
        });
    }

    // Cerrar modal al hacer clic fuera del contenido
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    });

    // Sistema de formulario de presupuesto
    const quoteFormModal = document.getElementById('quoteFormModal');
    const quoteContactModal = document.getElementById('quoteContactModal');
    const quoteForm = document.getElementById('quoteForm');
    const quoteModalClose = document.querySelector('.quote-modal-close');
    const quoteContactModalClose = document.querySelector('.quote-contact-modal-close');
    const btnPresupuesto = document.querySelector('.btn-presupuesto');
    const quoteModalWhatsApp = document.getElementById('quoteModalWhatsApp');
    const quoteModalEmail = document.getElementById('quoteModalEmail');

    // Abrir modal de formulario al hacer clic en "Solicita tu presupuesto"
    if (btnPresupuesto) {
        btnPresupuesto.addEventListener('click', function(e) {
            e.preventDefault();
            quoteFormModal.classList.add('active');
        });
    }

    // Cerrar modales
    if (quoteModalClose) {
        quoteModalClose.addEventListener('click', function() {
            quoteFormModal.classList.remove('active');
        });
    }

    if (quoteContactModalClose) {
        quoteContactModalClose.addEventListener('click', function() {
            quoteContactModal.classList.remove('active');
        });
    }

    // Cerrar modales al hacer clic fuera
    if (quoteFormModal) {
        quoteFormModal.addEventListener('click', function(e) {
            if (e.target === quoteFormModal) {
                quoteFormModal.classList.remove('active');
            }
        });
    }

    if (quoteContactModal) {
        quoteContactModal.addEventListener('click', function(e) {
            if (e.target === quoteContactModal) {
                quoteContactModal.classList.remove('active');
            }
        });
    }

    // Manejar envío del formulario
    if (quoteForm) {
        quoteForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Obtener datos del formulario
            const customerName = document.getElementById('customerName').value;
            const customerContact = document.getElementById('customerContact').value;
            const projectName = document.getElementById('projectName').value;
            const projectDescription = document.getElementById('projectDescription').value;

            // Generar mensajes personalizados para WhatsApp
            const whatsappMessage = `¡Hola!

Mi nombre es *${customerName}*. Me gustaría solicitar un presupuesto para el siguiente proyecto:

- *Nombre del Proyecto:*
${projectName}

- *Descripción:*
${projectDescription}

- *Datos de Contacto:*
${customerContact}

Quedo a la espera de respuesta. ¡Muchas gracias!`;
            
            // Generar mensajes personalizados para Email
            const emailSubject = `Solicitud de Presupuesto - ${projectName}`;
            const emailBody = `¡Hola!%0D%0A%0D%0AMi nombre es ${customerName}. Me gustaría solicitar un presupuesto para el siguiente proyecto:%0D%0A%0D%0A━━━━━━━━━━━━━━━━━━━━━━━━━━%0D%0A%0D%0A- NOMBRE DEL PROYECTO:%0D%0A${projectName}%0D%0A%0D%0A- DESCRIPCIÓN:%0D%0A${projectDescription}%0D%0A%0D%0A- DATOS DE CONTACTO:%0D%0A${customerContact}%0D%0A%0D%0A━━━━━━━━━━━━━━━━━━━━━━━━━━%0D%0A%0D%0AQuedo a la espera de respuesta.%0D%0A%0D%0A¡Muchas gracias!%0D%0A%0D%0A${customerName}`;

            // Actualizar URLs
            const whatsappURL = `https://wa.me/34644070487?text=${encodeURIComponent(whatsappMessage)}`;
            const emailURL = `https://mail.google.com/mail/?view=cm&fs=1&to=silab3d@gmail.com&su=${encodeURIComponent(emailSubject)}&body=${emailBody}`;
            
            quoteModalWhatsApp.href = whatsappURL;
            quoteModalEmail.href = emailURL;

            // Agregar event listeners para los clics
            quoteModalWhatsApp.onclick = function(e) {
                e.preventDefault();
                window.open(whatsappURL, '_blank');
                quoteContactModal.classList.remove('active');
            };

            quoteModalEmail.onclick = function(e) {
                e.preventDefault();
                window.open(emailURL, '_blank');
                quoteContactModal.classList.remove('active');
            };

            // Cambiar al modal de opciones de contacto
            quoteFormModal.classList.remove('active');
            quoteContactModal.classList.add('active');
        });
    }

    // Cerrar modales con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (quoteFormModal && quoteFormModal.classList.contains('active')) {
                quoteFormModal.classList.remove('active');
            }
            if (quoteContactModal && quoteContactModal.classList.contains('active')) {
                quoteContactModal.classList.remove('active');
            }
        }
    });

    // Sistema de Pop-up de Términos y Condiciones
    const termsPopup = document.getElementById('termsPopup');
    const acceptTermsBtn = document.getElementById('acceptTerms');
    const rejectTermsBtn = document.getElementById('rejectTerms');

    // Verificar si el usuario ya aceptó los términos
    if (termsPopup) {
        const termsAccepted = localStorage.getItem('termsAccepted');
        
        if (!termsAccepted) {
            // Mostrar el popup después de un pequeño delay
            setTimeout(() => {
                termsPopup.classList.add('show');
            }, 1000);
        }

        // Manejar clic en Aceptar
        if (acceptTermsBtn) {
            acceptTermsBtn.addEventListener('click', function() {
                localStorage.setItem('termsAccepted', 'true');
                termsPopup.classList.remove('show');
            });
        }

        // Manejar clic en Rechazar
        if (rejectTermsBtn) {
            rejectTermsBtn.addEventListener('click', function() {
                // Cerrar la ventana o redirigir
                window.close();
                // Si window.close() no funciona (navegadores modernos), redirigir a una página en blanco
                setTimeout(() => {
                    window.location.href = 'about:blank';
                }, 100);
            });
        }
    }
});
