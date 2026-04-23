document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('projectQuoteForm');
    const contactOptions = document.getElementById('projectContactOptions');
    const whatsappLink = document.getElementById('projectWhatsApp');
    const emailLink = document.getElementById('projectEmail');

    const colorsBoard = document.getElementById('projectColorsBoard');
    const selectedColorChips = document.getElementById('projectSelectedColorChips');
    const selectionDisplay = colorsBoard ? colorsBoard.querySelector('.color-selection-display') : null;
    const selectionTitle = colorsBoard ? colorsBoard.querySelector('.selection-title') : null;
    const categoryButtons = Array.from(document.querySelectorAll('.color-material-card'));

    const colorCatalog = document.getElementById('projectColorCatalog');
    const colorCatalogSections = document.getElementById('projectColorCatalogSections');

    const catalogState = {
        'pla-basico': [],
        'pla-premium': [],
        petg: []
    };
    const selectedColorState = {};

    if (!form || !contactOptions || !whatsappLink || !emailLink || !colorsBoard || !selectedColorChips || !categoryButtons.length || !colorCatalog || !colorCatalogSections) {
        return;
    }

    initColorCatalog();
    updateColorCounts();

    categoryButtons.forEach((button) => {
        button.addEventListener('click', function () {
            onColorGroupButtonClick(button);
        });
    });

    colorCatalogSections.addEventListener('change', function (event) {
        if (event.target && event.target.matches('input[name="projectColorChoices"]')) {
            syncSelectedColorsFromRenderedInputs();
            updateSelectedBoard();
        }
    });

    updateSelectedBoard();

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const customerName = document.getElementById('projectCustomerName').value.trim();
        const customerContact = document.getElementById('projectCustomerContact').value.trim();
        const projectName = document.getElementById('projectName').value.trim();
        const projectDescription = document.getElementById('projectDescription').value.trim();
        const projectMeasures = document.getElementById('projectMeasures').value.trim();
        const projectReferenceFiles = document.getElementById('projectReferenceFiles').value;

        const selectedGroupValues = getSelectedGroupValues();
        const selectedGroupLabels = getSelectedGroupLabels();

        const selectedColorLabels = getSelectedColorEntries().map((entry) => entry.label);

        if (!selectedGroupValues.length && !selectedColorLabels.length) {
            colorsBoard.classList.add('error');
            colorsBoard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        colorsBoard.classList.remove('error');

        const colorsSummary = buildColorsSummary(selectedGroupValues, selectedGroupLabels, selectedColorLabels);
        const referenceSummary = projectReferenceFiles === 'si'
            ? 'Si (incluye los archivos en el siguiente paso)'
            : 'No';

        const whatsappMessage = '¡Hola!\n\nMi nombre es *' + customerName + '*.' +
            ' Me gustaria solicitar un presupuesto para el siguiente proyecto:\n\n' +
            '- *Tu nombre:*\n' + customerName + '\n\n' +
            '- *Telefono / Email de contacto:*\n' + customerContact + '\n\n' +
            '- *Nombre del Proyecto:*\n' + projectName + '\n\n' +
            '- *Descripcion del proyecto:*\n' + projectDescription + '\n\n' +
            '- *Medidas del proyecto:*\n' + (projectMeasures || 'No especificadas') + '\n\n' +
            '- *Colores del proyecto:*\n' + colorsSummary + '\n\n' +
            '- *Proyecto o imagenes de referencia:*\n' + referenceSummary + '\n\n' +
            'Quedo a la espera de respuesta. ¡Muchas gracias!';

        const emailSubject = 'Solicitud de Presupuesto - ' + projectName;
        const emailBodyText = '¡Hola!\n\nMi nombre es ' + customerName +
            '. Me gustaria solicitar un presupuesto para el siguiente proyecto:\n\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
            '- TU NOMBRE:\n' + customerName + '\n\n' +
            '- TELEFONO / EMAIL DE CONTACTO:\n' + customerContact + '\n\n' +
            '- NOMBRE DEL PROYECTO:\n' + projectName + '\n\n' +
            '- DESCRIPCION DEL PROYECTO:\n' + projectDescription + '\n\n' +
            '- MEDIDAS DEL PROYECTO:\n' + (projectMeasures || 'No especificadas') + '\n\n' +
            '- COLORES DEL PROYECTO:\n' + colorsSummary + '\n\n' +
            '- PROYECTO O IMAGENES DE REFERENCIA:\n' + referenceSummary + '\n\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
            'Quedo a la espera de respuesta.\n\n' +
            '¡Muchas gracias!\n\n' + customerName;

        const whatsappURL = 'https://wa.me/34644070487?text=' + encodeURIComponent(whatsappMessage);
        const emailURL = 'https://mail.google.com/mail/?view=cm&fs=1&to=silab3d@gmail.com&su=' + encodeURIComponent(emailSubject) + '&body=' + encodeURIComponent(emailBodyText);

        whatsappLink.href = whatsappURL;
        emailLink.href = emailURL;

        contactOptions.classList.add('active');
        contactOptions.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    async function initColorCatalog() {
        try {
            const response = await fetch('../data/filamentos.json', { cache: 'no-store' });
            if (!response.ok) {
                return;
            }

            const data = await response.json();
            hydrateCatalog(data);
            updateColorCounts();
        } catch (error) {
            // Si falla la carga del catalogo, el formulario sigue siendo usable.
        }
    }

    function hydrateCatalog(data) {
        const filamentos = Array.isArray(data && data.filamentos) ? data.filamentos : [];

        filamentos.forEach((material) => {
            const materialName = String(material && material.nombre ? material.nombre : '').toUpperCase();
            const colors = Array.isArray(material && material.colores) ? material.colores : [];

            if (materialName === 'PLA') {
                colors.forEach((color) => {
                    const normalized = normalizeColor(color);
                    if (normalized.isPremium) {
                        catalogState['pla-premium'].push(normalized);
                    } else {
                        catalogState['pla-basico'].push(normalized);
                    }
                });
            }

            if (materialName === 'PETG') {
                colors.forEach((color) => {
                    catalogState.petg.push(normalizeColor(color));
                });
            }
        });
    }

    function normalizeColor(color) {
        const name = String(color && color.nombre ? color.nombre : 'Color');
        const rawHex = color && color.hex;
        const hexList = Array.isArray(rawHex) ? rawHex : [rawHex || '#cccccc'];
        const isPremium = Boolean(color && color.premium) || hexList.length > 1 || /(silk|marble|marmol|mármol|seda)/i.test(name);
        const swatch = hexList.length > 1
            ? 'linear-gradient(135deg, ' + hexList.join(', ') + ')'
            : hexList[0];

        return {
            id: slugify(name + '-' + hexList.join('-')),
            name: name,
            swatch: swatch,
            isPremium: isPremium
        };
    }

    function updateColorCounts() {
        categoryButtons.forEach((button) => {
            const group = button.getAttribute('data-color-group');
            if (group && group !== 'indeterminado') {
                const count = (catalogState[group] || []).length;
                const countElement = button.querySelector('.card-color-count');
                if (countElement) {
                    countElement.textContent = count + ' color' + (count !== 1 ? 'es' : '');
                    countElement.setAttribute('data-count', count);
                }
            }
        });
    }

    function onColorGroupButtonClick(button) {
        const value = button.getAttribute('data-color-group');
        if (!value) {
            return;
        }

        if (value === 'indeterminado') {
            const isActive = button.classList.contains('active');
            categoryButtons.forEach((item) => item.classList.remove('active'));
            if (!isActive) {
                button.classList.add('active');
            }
            renderColorCatalog();
            updateSelectedBoard();
            return;
        }

        const indeterminateBtn = categoryButtons.find((item) => item.getAttribute('data-color-group') === 'indeterminado');
        if (indeterminateBtn) {
            indeterminateBtn.classList.remove('active');
        }

        const wasActive = button.classList.contains('active');
        categoryButtons.forEach((item) => {
            if (item !== indeterminateBtn) {
                item.classList.remove('active');
            }
        });

        if (!wasActive) {
            button.classList.add('active');
        }

        renderColorCatalog();
        updateSelectedBoard();
    }

    function renderColorCatalog() {
        syncSelectedColorsFromRenderedInputs();

        const selected = getSelectedGroupValues().filter((value) => value !== 'indeterminado');

        if (!selected.length) {
            colorCatalog.hidden = true;
            colorCatalogSections.innerHTML = '';
            return;
        }

        colorCatalog.hidden = false;

        const titles = {
            'pla-basico': 'PLA Básico',
            'pla-premium': 'PLA Premium',
            petg: 'PETG'
        };

        colorCatalogSections.innerHTML = selected.map((groupKey) => {
            const colors = catalogState[groupKey] || [];

            if (!colors.length) {
                return '' +
                    '<div class="project-color-group">' +
                        '<h4 class="project-color-group-title">' + titles[groupKey] + '</h4>' +
                        '<p style="color: #9ca3af; font-size: 0.9rem;">No hay colores disponibles en este momento.</p>' +
                    '</div>';
            }

            const optionsHtml = colors.map((color) => {
                const colorValue = groupKey + ':' + color.id;
                const colorLabel = groupKey === 'petg'
                    ? color.name + ' (PETG)'
                    : color.name;
                return '' +
                    '<label class="project-color-option">' +
                        '<input type="checkbox" class="color-checkbox" name="projectColorChoices" value="' + escapeHtml(colorValue) + '" data-color-label="' + escapeHtml(colorLabel) + '" data-color-swatch="' + escapeHtml(color.swatch) + '" ' + (selectedColorState[colorValue] ? 'checked' : '') + '>' +
                        '<div class="color-option-ui">' +
                            '<span class="project-color-swatch" style="background:' + escapeHtml(color.swatch) + ';"></span>' +
                            '<span class="project-color-name" title="' + escapeHtml(color.name) + '">' + escapeHtml(color.name) + '</span>' +
                        '</div>' +
                    '</label>';
            }).join('');

            return '' +
                '<div class="project-color-group">' +
                    '<h4 class="project-color-group-title">' + titles[groupKey] + '</h4>' +
                    '<div class="project-color-options">' + optionsHtml + '</div>' +
                '</div>';
        }).join('');
    }

    function updateSelectedBoard() {
        const selectedColors = getSelectedColorEntries();

        if (!selectedColors.length) {
            if (selectionDisplay) {
                selectionDisplay.hidden = true;
            }
            if (selectionTitle) {
                selectionTitle.hidden = true;
            }
            selectedColorChips.innerHTML = '' +
                '<div class="color-chips-empty">' +
                    '<span class="empty-icon">🎯</span>' +
                    '<span class="empty-text">Selecciona colores concretos del catálogo</span>' +
                '</div>';
            return;
        }

        if (selectionDisplay) {
            selectionDisplay.hidden = false;
        }
        if (selectionTitle) {
            selectionTitle.hidden = false;
        }

        const colorChips = selectedColors.map((color) => {
            return '<span class="planner-chip"><span class="planner-chip-swatch" style="background:' + escapeHtml(color.swatch) + ';"></span><span>' + escapeHtml(color.label) + '</span></span>';
        }).join('');

        selectedColorChips.innerHTML = colorChips;
    }

    function syncSelectedColorsFromRenderedInputs() {
        const renderedInputs = Array.from(colorCatalogSections.querySelectorAll('input[name="projectColorChoices"]'));

        renderedInputs.forEach((input) => {
            const value = input.value;
            if (!value) {
                return;
            }

            if (input.checked) {
                selectedColorState[value] = {
                    value: value,
                    label: input.getAttribute('data-color-label') || 'Color',
                    swatch: input.getAttribute('data-color-swatch') || '#ffffff'
                };
                return;
            }

            delete selectedColorState[value];
        });
    }

    function getSelectedColorEntries() {
        return Object.keys(selectedColorState).map((key) => selectedColorState[key]);
    }

    function buildColorsSummary(groupValues, groupLabels, colorLabels) {
        if (groupValues.includes('indeterminado')) {
            return 'Indeterminado';
        }

        if (colorLabels.length) {
            return colorLabels.join(', ');
        }

        if (groupLabels.length) {
            return 'Categorías seleccionadas: ' + groupLabels.join(', ');
        }

        return 'Sin especificar';
    }

    function getSelectedGroupValues() {
        return categoryButtons
            .filter((button) => button.classList.contains('active'))
            .map((button) => button.getAttribute('data-color-group'))
            .filter(Boolean);
    }

    function getSelectedGroupLabels() {
        return categoryButtons
            .filter((button) => button.classList.contains('active'))
            .map((button) => button.querySelector('.card-title').textContent.trim());
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
});
