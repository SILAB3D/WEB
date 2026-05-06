document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('projectQuoteForm');
    const contactOptions = document.getElementById('projectContactOptions');
    const whatsappLink = document.getElementById('projectWhatsApp');
    const emailLink = document.getElementById('projectEmail');
    const formSteps = Array.from(document.querySelectorAll('[data-form-step]'));
    const nextToDetailsButton = document.getElementById('projectNextToDetails');
    const backToDetailsButton = document.getElementById('projectBackToDetails');
    const nextToColorsButton = document.getElementById('projectNextToColors');
    const showContactOptionsButton = document.getElementById('projectShowContactOptions');
    const backToProjectDetailsButton = document.getElementById('projectBackToProjectDetails');
    const backToColorsButton = document.getElementById('projectBackToColors');
    const queryParams = new URLSearchParams(window.location.search);
    const presetProductName = queryParams.get('producto');

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
    let activeStep = 1;

    if (!form || !contactOptions || !whatsappLink || !emailLink || !colorsBoard || !selectedColorChips || !categoryButtons.length || !colorCatalog || !colorCatalogSections || !formSteps.length) {
        return;
    }

    if (presetProductName) {
        const projectNameField = document.getElementById('projectName');
        if (projectNameField && !projectNameField.value.trim()) {
            projectNameField.value = presetProductName;
        }
    }

    showStep(1);

    initColorCatalog();
    updateColorCounts();

    categoryButtons.forEach((button) => {
        button.addEventListener('click', function () {
            onColorGroupButtonClick(button);
        });
    });

    colorCatalogSections.addEventListener('change', function (event) {
        if (event.target && event.target.matches('input[name="projectColorChoices"]')) {
            const label = event.target.closest('.catalog-color-item');
            if (label) {
                label.classList.toggle('selected', event.target.checked);
            }
            syncSelectedColorsFromRenderedInputs();
            updateSelectedBoard();
        }
    });

    selectedColorChips.addEventListener('click', function (event) {
        const removeBtn = event.target.closest('.color-chip-remove');
        if (removeBtn) {
            const colorValue = removeBtn.getAttribute('data-value');
            const checkbox = colorCatalogSections.querySelector('input[value="' + CSS.escape(colorValue) + '"]');
            if (checkbox) {
                checkbox.checked = false;
                const label = checkbox.closest('.catalog-color-item');
                if (label) label.classList.remove('selected');
                syncSelectedColorsFromRenderedInputs();
                updateSelectedBoard();
            }
        }
    });

    updateSelectedBoard();

    if (nextToDetailsButton) {
        nextToDetailsButton.addEventListener('click', function () {
            goToNextStep(1);
        });
    }

    if (backToDetailsButton) {
        backToDetailsButton.addEventListener('click', function () {
            goToPreviousStep(2);
        });
    }

    if (nextToColorsButton) {
        nextToColorsButton.addEventListener('click', function () {
            goToNextStep(2);
        });
    }

    if (backToProjectDetailsButton) {
        backToProjectDetailsButton.addEventListener('click', function () {
            goToPreviousStep(3);
        });
    }

    if (showContactOptionsButton) {
        showContactOptionsButton.addEventListener('click', function () {
            goToNextStep(3);
        });
    }

    if (backToColorsButton) {
        backToColorsButton.addEventListener('click', function () {
            contactOptions.classList.remove('active');
            showStep(3);
            const colorsSection = formSteps.find((step) => Number(step.getAttribute('data-form-step')) === 3);
            if (colorsSection) {
                colorsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    if (whatsappLink) {
        whatsappLink.addEventListener('click', function (event) {
            if (!whatsappLink.href || whatsappLink.href === '#') {
                event.preventDefault();
                return;
            }

            event.preventDefault();
            window.open(whatsappLink.href, '_blank', 'noopener,noreferrer');
        });
    }

    if (emailLink) {
        emailLink.addEventListener('click', function (event) {
            if (!emailLink.href || emailLink.href === '#') {
                event.preventDefault();
                return;
            }

            event.preventDefault();
            window.open(emailLink.href, '_blank', 'noopener,noreferrer');
        });
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (activeStep < 3) {
            goToNextStep(activeStep);
            return;
        }

        if (!buildContactOptions()) {
            return;
        }
    });

    // Helper: intenta cargar el catálogo desde OpenSheet y, si falla, cae al JSON local
    async function fetchFilamentos() {
        const sheetId = (window.FILAMENTS_SHEET && window.FILAMENTS_SHEET.id) || '';
        const sheetName = (window.FILAMENTS_SHEET && window.FILAMENTS_SHEET.sheet) || 'filamentos';
        const inPagesFolder = window.location.pathname.toLowerCase().includes('/pages/');
        const localPath = inPagesFolder ? '../data/filamentos.json' : 'data/filamentos.json';

        if (sheetId) {
            try {
                const opensheetUrl = 'https://opensheet.elk.sh/' + encodeURIComponent(sheetId) + '/' + encodeURIComponent(sheetName);
                const resp = await fetch(opensheetUrl, { cache: 'no-store' });
                if (resp && resp.ok) {
                    const json = await resp.json();
                    if (Array.isArray(json)) {
                        const rows = json;
                        const first = rows[0] || {};
                        if (first.hex || first.color || first.color_name || first.nombre_color || first.color_hex || first['Código HEX'] || first['Color'] || first['Tipo']) {
                            const map = Object.create(null);
                            rows.forEach(r => {
                                const rawTipo = (r.Tipo || r.tipo || r.material || r.nombre || r.material_name || '').toString().trim();
                                if (!rawTipo) return;
                                if (/^TOTAL\b/i.test(rawTipo)) return;
                                const material = rawTipo || 'UNKNOWN';
                                const subtype = (r.Subtipo || r.subtipo || r.subtype || '').toString().trim();
                                const colorName = (r.Color || r.color || r.color_name || r.nombre || r.name || '').toString().trim();
                                if (!colorName) return;
                                const hexRaw = (r['Código HEX'] || r['Codigo HEX'] || r.hex || r.hex_code || r.color_hex || '').toString().trim();
                                const premiumFlag = (r.Premium || r.premium || r.isPremium || '').toString().toLowerCase();
                                const offerFlag = (r.Offer || r.offer || r.oferta || '').toString().toLowerCase();
                                const premium = premiumFlag === 'true' || premiumFlag === '1' || premiumFlag === 'yes' || premiumFlag === 'si' || /premium/i.test(subtype);
                                const offer = offerFlag === 'true' || offerFlag === '1' || offerFlag === 'yes' || offerFlag === 'si';
                                let hex;
                                if (hexRaw.indexOf(',') >= 0) {
                                    hex = hexRaw.split(',').map(h => { const t = h.trim(); return t.startsWith('#') ? t : ('#' + t); });
                                } else {
                                    const t = hexRaw || '#cccccc';
                                    hex = t.startsWith('#') ? t : ('#' + t);
                                }
                                const colorObj = { nombre: colorName, hex: hex };
                                if (premium) colorObj.premium = true;
                                if (offer) colorObj.offer = true;
                                if (!map[material]) map[material] = { nombre: material, colores: [] };
                                map[material].colores.push(colorObj);
                            });
                            const filamentos = Object.keys(map).map(k => map[k]);
                            return { filamentos };
                        }
                        return { filamentos: json };
                    }
                    return json;
                }
            } catch (e) {
                // fallback
            }
        }

        try {
            const r = await fetch(localPath, { cache: 'no-store' });
            if (r && r.ok) return await r.json();
        } catch (e) {}

        return { filamentos: [] };
    }

    function showStep(stepNumber) {
        activeStep = stepNumber;

        formSteps.forEach((step) => {
            const stepValue = Number(step.getAttribute('data-form-step'));
            step.hidden = stepValue !== stepNumber;
        });

        const isContactStep = stepNumber === 4;
        contactOptions.hidden = !isContactStep;
        contactOptions.classList.toggle('active', isContactStep);

        if (stepNumber < 4) {
            contactOptions.classList.remove('active');
        }
    }

    function goToNextStep(currentStep) {
        const currentSection = formSteps.find((step) => Number(step.getAttribute('data-form-step')) === currentStep);
        if (!currentSection || !validateStep(currentSection)) {
            return;
        }

        const nextStep = currentStep + 1;
        if (nextStep <= 3) {
            showStep(nextStep);
            const nextSection = formSteps.find((step) => Number(step.getAttribute('data-form-step')) === nextStep);
            if (nextSection) {
                nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            if (!buildContactOptions()) {
                return;
            }

            showStep(4);
            contactOptions.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function goToPreviousStep(currentStep) {
        const previousStep = currentStep - 1;
        if (previousStep < 1) {
            return;
        }

        showStep(previousStep);

        const previousSection = formSteps.find((step) => Number(step.getAttribute('data-form-step')) === previousStep);
        if (previousSection) {
            previousSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function validateStep(section) {
        const fields = Array.from(section.querySelectorAll('input, textarea, select'));
        for (const field of fields) {
            if (field.checkValidity && !field.checkValidity()) {
                field.reportValidity();
                field.focus();
                return false;
            }
        }

        return true;
    }

    function buildContactOptions() {
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
            return false;
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
        return true;
    }

    async function initColorCatalog() {
        try {
            const data = await fetchFilamentos();
            if (!data) return;
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
            isPremium: isPremium,
            offer: Boolean(color && color.offer)
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
                    '<div class="catalog-section">' +
                        '<h4 class="catalog-section-title">' + titles[groupKey] + '</h4>' +
                        '<p style="color: #9ca3af; font-size: 0.9rem;">No hay colores disponibles en este momento.</p>' +
                    '</div>';
            }

            const optionsHtml = colors.map((color) => {
                const colorValue = groupKey + ':' + color.id;
                const colorLabel = groupKey === 'petg'
                    ? color.name + ' (PETG)'
                    : color.name;
                const isSelected = selectedColorState[colorValue];
                return '' +
                    '<label class="catalog-color-item' + (isSelected ? ' selected' : '') + '">' +
                        '<input type="checkbox" style="display:none;" class="color-checkbox" name="projectColorChoices" value="' + escapeHtml(colorValue) + '" data-color-label="' + escapeHtml(colorLabel) + '" data-color-swatch="' + escapeHtml(color.swatch) + '" ' + (isSelected ? 'checked' : '') + '>' +
                        '<span class="catalog-color-circle" style="background:' + escapeHtml(color.swatch) + ';"></span>' +
                        '<span class="catalog-color-name" title="' + escapeHtml(color.name) + '">' + escapeHtml(color.name) + '</span>' +
                    '</label>';
            }).join('');

            return '' +
                '<div class="catalog-section">' +
                    '<h4 class="catalog-section-title">' + titles[groupKey] + '</h4>' +
                    '<div class="catalog-color-grid">' + optionsHtml + '</div>' +
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
            return '<span class="color-chip">' +
                '<span class="color-chip-dot" style="background:' + escapeHtml(color.swatch) + ';"></span>' +
                '<span>' + escapeHtml(color.label) + '</span>' +
                '<button type="button" class="color-chip-remove" data-value="' + escapeHtml(color.value) + '">✕</button>' +
            '</span>';
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
