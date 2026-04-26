// Script para cargar y mostrar materiales desde filamentos.json
document.addEventListener('DOMContentLoaded', async function() {
    // Navbar siempre visible (anclada)

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

    if (filterButtons.length > 0 && productsGrid) {
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
    const closeModal = document.querySelector('#contactModal .contact-modal-close');
    const buyButtons = document.querySelectorAll('.btn-comprar, .btn-action');

    function shouldRedirectToConfigurator(productName) {
        return productName === 'Trofeos y medallas' || productName === 'Figura con diseño personalizado';
    }

    function generateContactURLs(productName, category) {
        const whatsappMessage = `¡Hola! Me gustaría obtener más información acerca de ${productName}.`;
        const emailSubject = `Consulta sobre ${productName}`;
        const emailBody = `¡Hola!%0D%0A%0D%0AMe gustaría obtener más información acerca de ${productName}.%0D%0A%0D%0AGracias.`;

        return {
            whatsapp: `https://wa.me/34644070487?text=${encodeURIComponent(whatsappMessage)}`,
            email: `https://mail.google.com/mail/?view=cm&fs=1&to=silab3d@gmail.com&su=${encodeURIComponent(emailSubject)}&body=${emailBody}`
        };
    }

    // Abrir configurador o modal según el producto
    if (buyButtons.length > 0) {
        buyButtons.forEach(button => {
            button.addEventListener('click', function() {
                const productName = this.getAttribute('data-product');
                const category = this.getAttribute('data-category');

                if (productName === 'Palomitera de Yoshi') {
                    openPalomiteraRequestFlow();
                    return;
                }

                if (shouldRedirectToConfigurator(productName)) {
                    const configuratorURL = new URL('configura-tu-proyecto.html', window.location.href);

                    if (productName) {
                        configuratorURL.searchParams.set('producto', productName);
                    }

                    if (category) {
                        configuratorURL.searchParams.set('categoria', category);
                    }

                    window.location.href = configuratorURL.toString();
                    return;
                }

                const urls = generateContactURLs(productName, category);

                if (modalWhatsApp) {
                    modalWhatsApp.href = urls.whatsapp;
                }
                if (modalEmail) {
                    modalEmail.href = urls.email;
                }

                if (modal) {
                    modal.classList.add('active');
                }
            });
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', function() {
            if (modal) {
                modal.classList.remove('active');
            }
        });
    }

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (modal && modal.classList.contains('active')) modal.classList.remove('active');
            if (libraryModal && libraryModal.classList.contains('active')) libraryModal.classList.remove('active');
        }
    });

    // Modal Bibliotecas 3D
    const libraryModal = document.getElementById('libraryModal');
    const btnExplorar = document.getElementById('btnExplorarBibliotecas');
    const libraryModalClose = document.getElementById('libraryModalClose');

    if (btnExplorar && libraryModal) {
        btnExplorar.addEventListener('click', function() {
            libraryModal.classList.add('active');
        });
    }
    if (libraryModalClose) {
        libraryModalClose.addEventListener('click', function() {
            libraryModal.classList.remove('active');
        });
    }
    if (libraryModal) {
        libraryModal.addEventListener('click', function(e) {
            if (e.target === libraryModal) libraryModal.classList.remove('active');
        });
    }
    const quoteFormModal = document.getElementById('quoteFormModal');
    const quoteContactModal = document.getElementById('quoteContactModal');
    const quoteForm = document.getElementById('quoteForm');
    const quoteModalClose = document.querySelector('.quote-modal-close');
    const quoteContactModalClose = document.querySelector('.quote-contact-modal-close');
    const btnPresupuesto = document.querySelector('.btn-presupuesto');
    const quoteModalWhatsApp = document.getElementById('quoteModalWhatsApp');
    const quoteModalEmail = document.getElementById('quoteModalEmail');

    // Abrir modal de formulario al hacer clic en "Solicita tu presupuesto"
    if (btnPresupuesto && quoteFormModal && btnPresupuesto.getAttribute('href') === '#') {
        btnPresupuesto.addEventListener('click', function(e) {
            e.preventDefault();
            quoteFormModal.classList.add('active');
        });
    }

    // Abrir modal desde el botón móvil del menú hamburguesa
    const btnPresupuestoMobile = document.getElementById('btnPresupuestoMobile');
    if (btnPresupuestoMobile && quoteFormModal && btnPresupuestoMobile.getAttribute('href') === '#') {
        btnPresupuestoMobile.addEventListener('click', function(e) {
            e.preventDefault();
            quoteFormModal.classList.add('active');
            // Cerrar menú hamburguesa
            const hamburgerMenu = document.getElementById('hamburgerMenu');
            const mobileMenu = document.getElementById('mobileMenu');
            if (hamburgerMenu && mobileMenu) {
                hamburgerMenu.classList.remove('active');
                mobileMenu.classList.remove('active');
            }
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

    // Popup promocional Palomitera
    const isIndexPage = window.location.pathname === '/' || window.location.pathname.toLowerCase().endsWith('/index.html');
    const inPagesFolder = window.location.pathname.toLowerCase().includes('/pages/');
    const imagePrefix = inPagesFolder ? '../img/' : 'img/';
    let palomiteraFlowReady = false;
    let palomiteraRequestModal = null;
    let palomiteraContactModal = null;
    let palomiteraRequestForm = null;
    let palomiteraRequestCloseBtn = null;
    let palomiteraContactCloseBtn = null;
    let palomiteraRequestColorButtons = [];
    let palomiteraRequestColorSections = null;
    let palomiteraRequestSelectedColor = null;
    let palomiteraRequestName = null;
    let palomiteraRequestModel = null;
    let palomiteraContactWhatsApp = null;
    let palomiteraContactEmail = null;
    let palomiteraCatalogCache = null;
    let palomiteraActiveColorGroup = 'pla-basico';

    function shouldShowPalomiteraPopup() {
        return isIndexPage;
    }

    async function loadPalomiteraCatalog() {
        if (palomiteraCatalogCache) {
            return palomiteraCatalogCache;
        }

        try {
            const response = await fetch('../data/filamentos.json', { cache: 'no-store' });
            if (!response.ok) {
                palomiteraCatalogCache = { 'pla-basico': [], 'pla-premium': [] };
                return palomiteraCatalogCache;
            }

            const data = await response.json();
            const filamentos = Array.isArray(data.filamentos) ? data.filamentos : [];
            const catalog = { 'pla-basico': [], 'pla-premium': [] };

            filamentos.forEach((material) => {
                if (!material || String(material.nombre || '').toUpperCase() !== 'PLA') {
                    return;
                }

                const colors = Array.isArray(material.colores) ? material.colores : [];
                colors.forEach((color) => {
                    const normalized = normalizePalomiteraColor(color);
                    if (normalized.isPremium) {
                        catalog['pla-premium'].push(normalized);
                    } else {
                        catalog['pla-basico'].push(normalized);
                    }
                });
            });

            palomiteraCatalogCache = catalog;
            return palomiteraCatalogCache;
        } catch (error) {
            palomiteraCatalogCache = { 'pla-basico': [], 'pla-premium': [] };
            return palomiteraCatalogCache;
        }
    }

    function normalizePalomiteraColor(color) {
        const name = String(color && color.nombre ? color.nombre : 'Color');
        const rawHex = color && color.hex;
        const hexList = Array.isArray(rawHex) ? rawHex : [rawHex || '#cccccc'];
        const isPremium = Boolean(color && color.premium) || hexList.length > 1 || /(silk|marble|marmol|mármol|seda)/i.test(name);
        const swatch = hexList.length > 1 ? 'linear-gradient(135deg, ' + hexList.join(', ') + ')' : hexList[0];

        return {
            id: slugify(name + '-' + hexList.join('-')),
            name: name,
            swatch: swatch,
            isPremium: isPremium,
            offer: Boolean(color && color.offer)
        };
    }

    function slugify(value) {
        return String(value)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function createPalomiteraRequestModal() {
        const wrapper = document.createElement('div');
        wrapper.id = 'palomiteraRequestModal';
        wrapper.className = 'quote-modal palomitera-request-modal';

        wrapper.innerHTML = `
            <div class="quote-modal-content palomitera-request-content">
                <span class="quote-modal-close" id="palomiteraRequestClose" aria-label="Cerrar ventana">&times;</span>
                <h2 class="palomitera-request-title">Encarga tu Palomitera de Yoshi</h2>
                <p class="palomitera-request-subtitle">Rellena lo esencial y te damos tu presupuesto.</p>
                <form id="palomiteraRequestForm" novalidate>
                    <div class="form-group">
                        <label for="palomiteraCustomerName">Tu nombre *</label>
                        <input type="text" id="palomiteraCustomerName" name="palomiteraCustomerName" required placeholder="Un nombre para comunicarnos">
                    </div>
                    <div class="form-group">
                        <label for="palomiteraModel">Modelo *</label>
                        <select id="palomiteraModel" name="palomiteraModel" required>
                            <option value="" selected disabled>Elige el tamaño</option>
                            <option value="25cm">25 cm</option>
                            <option value="15cm">15 cm</option>
                        </select>
                    </div>
                    <div class="form-group form-group-colors">
                        <label>Color *</label>
                        <div class="palomitera-color-group-buttons">
                            <button type="button" class="color-material-card palomitera-color-group-button active" data-color-group="pla-basico">PLA Básico</button>
                            <button type="button" class="color-material-card palomitera-color-group-button" data-color-group="pla-premium">PLA Premium</button>
                        </div>
                        <div id="palomiteraColorCatalogSections" class="catalog-sections palomitera-color-sections"></div>
                        <input type="hidden" id="palomiteraSelectedColor" name="palomiteraSelectedColor" required>
                    </div>
                    <div class="quote-step-actions">
                        <button type="submit" class="cta-button quote-submit-button palomitera-request-submit">Enviar tu solicitud</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(wrapper);
        palomiteraRequestModal = wrapper;
        palomiteraRequestForm = document.getElementById('palomiteraRequestForm');
        palomiteraRequestCloseBtn = document.getElementById('palomiteraRequestClose');
        palomiteraRequestName = document.getElementById('palomiteraCustomerName');
        palomiteraRequestModel = document.getElementById('palomiteraModel');
        palomiteraRequestSelectedColor = document.getElementById('palomiteraSelectedColor');
        palomiteraRequestColorSections = document.getElementById('palomiteraColorCatalogSections');
        palomiteraRequestColorButtons = Array.from(wrapper.querySelectorAll('.palomitera-color-group-button'));

        if (palomiteraRequestCloseBtn) {
            palomiteraRequestCloseBtn.addEventListener('click', hidePalomiteraRequestModal);
        }

        if (palomiteraRequestForm) {
            palomiteraRequestForm.addEventListener('submit', function(e) {
                e.preventDefault();

                const customerName = palomiteraRequestName ? palomiteraRequestName.value.trim() : '';
                const model = palomiteraRequestModel ? palomiteraRequestModel.value.trim() : '';
                const selectedColorInput = palomiteraRequestColorSections ? palomiteraRequestColorSections.querySelector('input[name="palomiteraColorChoice"]:checked') : null;
                const selectedColor = selectedColorInput ? (selectedColorInput.getAttribute('data-color-label') || '').trim() : '';

                if (!customerName) {
                    if (palomiteraRequestName) {
                        palomiteraRequestName.reportValidity();
                        palomiteraRequestName.focus();
                    }
                    return;
                }

                if (!model) {
                    if (palomiteraRequestModel) {
                        palomiteraRequestModel.reportValidity();
                        palomiteraRequestModel.focus();
                    }
                    return;
                }

                if (!selectedColor) {
                    if (palomiteraRequestColorSections) {
                        palomiteraRequestColorSections.classList.add('error');
                        palomiteraRequestColorSections.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    return;
                }

                if (palomiteraRequestColorSections) {
                    palomiteraRequestColorSections.classList.remove('error');
                }

                hidePalomiteraRequestModal();
                openPalomiteraContactOptions({
                    productName: 'Palomitera de Yoshi',
                    customerName: customerName,
                    model: model,
                    color: selectedColor
                });
            });
        }

        return wrapper;
    }

    function createPalomiteraContactModal() {
        const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
        const wrapper = document.createElement('div');
        wrapper.id = 'palomiteraContactModal';
        wrapper.className = 'quote-modal palomitera-contact-modal';

        wrapper.innerHTML = `
            <div class="quote-modal-content palomitera-contact-content">
                <span class="quote-contact-modal-close" id="palomiteraContactClose" aria-label="Cerrar ventana">&times;</span>
                <h2 class="palomitera-contact-title">Elige cómo prefieres contactar</h2>
                <p class="palomitera-contact-subtitle">Enviaremos tu solicitud con el nombre, modelo y color seleccionado.</p>
                <div class="contact-options-grid palomitera-contact-grid">
                    <a id="palomiteraContactWhatsApp" href="#" target="_blank" class="contact-option-card">
                        <div class="contact-option-icon">📱</div>
                        <h3>WhatsApp</h3>
                        <p>Respuesta inmediata</p>
                    </a>
                    ${isMobileViewport ? '' : `
                    <a id="palomiteraContactEmail" href="#" target="_blank" class="contact-option-card">
                        <div class="contact-option-icon">📧</div>
                        <h3>Email</h3>
                        <p>Comunicación formal</p>
                    </a>`}
                </div>
            </div>
        `;

        document.body.appendChild(wrapper);
        palomiteraContactModal = wrapper;
        palomiteraContactCloseBtn = document.getElementById('palomiteraContactClose');
        palomiteraContactWhatsApp = document.getElementById('palomiteraContactWhatsApp');
        palomiteraContactEmail = document.getElementById('palomiteraContactEmail');

        if (palomiteraContactCloseBtn) {
            palomiteraContactCloseBtn.addEventListener('click', hidePalomiteraContactModal);
        }

        if (palomiteraContactModal) {
            palomiteraContactModal.addEventListener('click', function(e) {
                if (e.target === palomiteraContactModal) {
                    hidePalomiteraContactModal();
                }
            });
        }

        return wrapper;
    }

    function renderPalomiteraColorCatalog() {
        if (!palomiteraRequestColorSections || !palomiteraCatalogCache) {
            return;
        }

        const colors = palomiteraCatalogCache[palomiteraActiveColorGroup] || [];
        if (!colors.length) {
            palomiteraRequestColorSections.innerHTML = `
                <div class="project-color-group">
                    <p style="color: #9ca3af; font-size: 0.9rem; margin: 0;">No hay colores disponibles en este momento.</p>
                </div>
            `;
            return;
        }

        palomiteraRequestColorSections.innerHTML = `
            <div class="project-color-group">
                <div class="project-color-options">
                    ${colors.map((color) => `
                        <label class="project-color-option">
                            <input type="radio" class="color-checkbox" name="palomiteraColorChoice" value="${escapeHtml(color.id)}" data-color-label="${escapeHtml(color.name)}" data-color-swatch="${escapeHtml(color.swatch)}">
                            <div class="color-option-ui">
                                <span class="project-color-swatch" style="background:${escapeHtml(color.swatch)};"></span>
                                <span class="project-color-name" title="${escapeHtml(color.name)}">${escapeHtml(color.name)}</span>
                                ${color.offer ? '<span class="color-offer-badge">Oferta</span>' : ''}
                            </div>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;

        const selectedRadio = palomiteraRequestColorSections.querySelector('input[name="palomiteraColorChoice"]:checked');
        palomiteraRequestSelectedColor.value = selectedRadio ? selectedRadio.getAttribute('data-color-label') || '' : '';

        palomiteraRequestColorSections.querySelectorAll('input[name="palomiteraColorChoice"]').forEach((input) => {
            input.addEventListener('change', function () {
                palomiteraRequestSelectedColor.value = this.getAttribute('data-color-label') || '';
                palomiteraRequestColorSections.classList.remove('error');
            });
        });
    }

    function showPalomiteraRequestModal() {
        if (!palomiteraRequestModal) {
            createPalomiteraRequestModal();
        }

        palomiteraRequestModal.classList.add('active');
        loadPalomiteraCatalog().then(() => {
            renderPalomiteraColorCatalog();
        });
    }

    function hidePalomiteraRequestModal() {
        if (palomiteraRequestModal) {
            palomiteraRequestModal.classList.remove('active');
        }
    }

    function showPalomiteraContactModal() {
        if (!palomiteraContactModal) {
            createPalomiteraContactModal();
        }

        palomiteraContactModal.classList.add('active');
    }

    function hidePalomiteraContactModal() {
        if (palomiteraContactModal) {
            palomiteraContactModal.classList.remove('active');
        }
    }

    function openPalomiteraContactOptions(payload) {
        const whatsappMessage = `¡Hola! Me gustaría encargar una ${payload.productName} personalizada.\n\n- Nombre: ${payload.customerName}\n- Modelo: ${payload.model}\n- Color: ${payload.color}\n\n¿Podéis darme más información?`;
        const emailSubject = `Consulta sobre ${payload.productName}`;
        const emailBody = `¡Hola!%0D%0A%0D%0AMe gustaría encargar una ${payload.productName} personalizada.%0D%0A%0D%0A- Nombre: ${payload.customerName}%0D%0A- Modelo: ${payload.model}%0D%0A- Color: ${payload.color}%0D%0A%0D%0A¿Podéis darme más información?`;

        const whatsappURL = `https://wa.me/34644070487?text=${encodeURIComponent(whatsappMessage)}`;
        const emailURL = `https://mail.google.com/mail/?view=cm&fs=1&to=silab3d@gmail.com&su=${encodeURIComponent(emailSubject)}&body=${emailBody}`;

        if (!palomiteraContactModal) {
            createPalomiteraContactModal();
        }

        if (palomiteraContactWhatsApp) {
            palomiteraContactWhatsApp.href = whatsappURL;
            palomiteraContactWhatsApp.onclick = function(e) {
                e.preventDefault();
                window.open(whatsappURL, '_blank');
                hidePalomiteraContactModal();
            };
        }

        if (palomiteraContactEmail) {
            palomiteraContactEmail.href = emailURL;
            palomiteraContactEmail.onclick = function(e) {
                e.preventDefault();
                window.open(emailURL, '_blank');
                hidePalomiteraContactModal();
            };
        }

        showPalomiteraContactModal();
    }

    function openPalomiteraRequestFlow() {
        const activePalomiteraPopup = document.getElementById('palomiteraPopup');
        if (activePalomiteraPopup) {
            activePalomiteraPopup.classList.remove('show');
        }
        showPalomiteraRequestModal();
    }

    function createPalomiteraPopup() {
        const wrapper = document.createElement('div');
        wrapper.id = 'palomiteraPopup';
        wrapper.className = 'palomitera-popup-overlay';
        wrapper.setAttribute('role', 'dialog');
        wrapper.setAttribute('aria-modal', 'true');
        wrapper.setAttribute('aria-labelledby', 'palomiteraPopupTitle');

        wrapper.innerHTML = `
            <div class="palomitera-popup-modal">
                <button type="button" class="palomitera-popup-close" id="palomiteraPopupClose" aria-label="Cerrar ventana">&times;</button>
                <div class="palomitera-popup-head">
                    <span class="palomitera-popup-chip">Novedad</span>
                    <h2 id="palomiteraPopupTitle" class="palomitera-popup-title">Palomitera de Yoshi</h2>
                </div>
                <div class="palomitera-carousel" id="palomiteraCarousel">
                    <img src="${imagePrefix}Palomitera-frontal.webp" alt="Palomitera de Yoshi vista frontal" class="palomitera-slide active" loading="eager" decoding="async">
                    <img src="${imagePrefix}Palomitera-trasera.webp" alt="Palomitera de Yoshi vista trasera" class="palomitera-slide" loading="eager" decoding="async">
                </div>
                <p class="palomitera-popup-description">Encarga tu unidad personalizada con los <strong>colores</strong> de nuestro catálogo. ¡Disponible en varios <strong>tamaños</strong>!</p>
                <button type="button" class="palomitera-popup-cta" id="palomiteraPopupCTA">¡La quiero!</button>
            </div>
        `;

        document.body.appendChild(wrapper);
        return wrapper;
    }

    if (shouldShowPalomiteraPopup()) {
        const palomiteraPopup = createPalomiteraPopup();
        const palomiteraCloseBtn = document.getElementById('palomiteraPopupClose');
        const palomiteraCTA = document.getElementById('palomiteraPopupCTA');
        const palomiteraSlides = palomiteraPopup.querySelectorAll('.palomitera-slide');
        let palomiteraSlideIndex = 0;
        let palomiteraIntervalId = null;
        const palomiteraProductName = 'Palomitera de Yoshi';
        const palomiteraWhatsAppURL = `https://wa.me/34644070487?text=${encodeURIComponent(`¡Hola! Me gustaría encargar una ${palomiteraProductName} personalizada. ¿Podéis darme más información?`)}`;
        const palomiteraEmailURL = `https://mail.google.com/mail/?view=cm&fs=1&to=silab3d@gmail.com&su=${encodeURIComponent(`Consulta sobre ${palomiteraProductName}`)}&body=${encodeURIComponent(`¡Hola!\n\nMe gustaría encargar una ${palomiteraProductName} personalizada. ¿Podéis darme más información?\n\nGracias.`)}`;

        function showPalomiteraSlide(nextIndex) {
            palomiteraSlides.forEach((slide, index) => {
                slide.classList.toggle('active', index === nextIndex);
            });
        }

        function closePalomiteraPopup() {
            palomiteraPopup.classList.remove('show');
            if (palomiteraIntervalId) {
                clearInterval(palomiteraIntervalId);
                palomiteraIntervalId = null;
            }
        }

        if (palomiteraSlides.length > 1) {
            palomiteraIntervalId = setInterval(() => {
                palomiteraSlideIndex = (palomiteraSlideIndex + 1) % palomiteraSlides.length;
                showPalomiteraSlide(palomiteraSlideIndex);
            }, 2000);
        }

        setTimeout(() => {
            palomiteraPopup.classList.add('show');
        }, 5000);

        if (palomiteraCloseBtn) {
            palomiteraCloseBtn.addEventListener('click', closePalomiteraPopup);
        }

        if (palomiteraCTA) {
            palomiteraCTA.addEventListener('click', function() {
                openPalomiteraRequestFlow();
            });
        }

        document.addEventListener('click', function(e) {
            const clickedGroupButton = e.target.closest('.palomitera-color-group-button');
            if (clickedGroupButton && palomiteraRequestModal && palomiteraRequestModal.classList.contains('active')) {
                palomiteraActiveColorGroup = clickedGroupButton.getAttribute('data-color-group') || 'pla-basico';
                palomiteraRequestColorButtons.forEach((button) => button.classList.toggle('active', button === clickedGroupButton));
                if (palomiteraRequestColorSections) {
                    palomiteraRequestColorSections.classList.remove('error');
                }
                renderPalomiteraColorCatalog();
            }
        });

        palomiteraPopup.addEventListener('click', function(e) {
            if (e.target === palomiteraPopup) {
                closePalomiteraPopup();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && palomiteraPopup.classList.contains('show')) {
                closePalomiteraPopup();
            }
            if (e.key === 'Escape' && palomiteraRequestModal && palomiteraRequestModal.classList.contains('active')) {
                hidePalomiteraRequestModal();
            }
            if (e.key === 'Escape' && palomiteraContactModal && palomiteraContactModal.classList.contains('active')) {
                hidePalomiteraContactModal();
            }
        });
    }

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

    // Menú Hamburguesa para móvil
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const mobileMenu = document.getElementById('mobileMenu');

    if (hamburgerMenu && mobileMenu) {
        hamburgerMenu.addEventListener('click', function() {
            hamburgerMenu.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });

        // Cerrar menú al hacer clic en un enlace
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburgerMenu.classList.remove('active');
                mobileMenu.classList.remove('active');
            });
        });

        // Cerrar menú al hacer clic fuera de él
        document.addEventListener('click', function(event) {
            const isClickInside = hamburgerMenu.contains(event.target) || mobileMenu.contains(event.target);
            if (!isClickInside && mobileMenu.classList.contains('active')) {
                hamburgerMenu.classList.remove('active');
                mobileMenu.classList.remove('active');
            }
        });
    }
});
