(function () {
    const state = {
        figures: [],
        activeFigureId: null,
        catalog: {
            PLA: [],
            PETG: []
        },
        figureCounter: 1
    };

    const dom = {
        figurasList: null,
        figuraEditor: null,
        addFiguraBtn: null,
        copyListaBtn: null,
        plannerStatus: null
    };

    let exportFeedbackTimer = null;

    document.addEventListener('DOMContentLoaded', initPlanner);

    async function initPlanner() {
        dom.figurasList = document.getElementById('figurasList');
        dom.figuraEditor = document.getElementById('figuraEditor');
        dom.addFiguraBtn = document.getElementById('addFiguraBtn');
        dom.copyListaBtn = document.getElementById('copyListaBtn');
        dom.plannerStatus = document.getElementById('plannerStatus');

        if (!dom.figurasList || !dom.figuraEditor || !dom.addFiguraBtn || !dom.copyListaBtn) {
            return;
        }

        try {
            const response = await fetch('../data/filamentos.json', { cache: 'no-store' });
            if (!response.ok) {
                throw new Error('No se pudo cargar el catálogo de materiales.');
            }

            const data = await response.json();
            hydrateCatalog(data);
            createFigure();
            bindStaticEvents();
            render();
            setStatus('Listo. Crea figuras y selecciona colores.', false);
        } catch (error) {
            setStatus(error.message, true);
        }
    }

    function bindStaticEvents() {
        dom.addFiguraBtn.addEventListener('click', () => {
            createFigure();
            render();
            setStatus('Nueva figura creada.', false);
        });

        dom.copyListaBtn.addEventListener('click', async () => {
            const report = buildTextReport();
            if (!report.ok) {
                setStatus(report.message, true);
                return;
            }

            const copied = await copyText(report.text);
            if (copied) {
                showExportCopiedFeedback();
                setStatus('Lista copiada al portapapeles.', false);
            } else {
                setStatus('No se pudo copiar automáticamente. Intenta de nuevo.', true);
            }
        });

        dom.figurasList.addEventListener('click', onFigureListClick);
        dom.figurasList.addEventListener('input', onFigureListInput);
        dom.figuraEditor.addEventListener('click', onEditorClick);
    }

    function hydrateCatalog(data) {
        const list = Array.isArray(data && data.filamentos) ? data.filamentos : [];

        list.forEach((material) => {
            const materialName = (material.nombre || '').toUpperCase();
            if (materialName !== 'PLA' && materialName !== 'PETG') {
                return;
            }

            const colors = Array.isArray(material.colores) ? material.colores : [];
            state.catalog[materialName] = colors.map((color, idx) => ({
                id: materialName + '-' + idx,
                name: color.nombre || 'Color sin nombre',
                hexRaw: color.hex,
                swatchCss: buildSwatchCss(color.hex),
                hexLabel: buildHexLabel(color.hex),
                isPremium: isPremiumColor(materialName, color)
            }));
        });
    }

    function isPremiumColor(materialName, color) {
        if (Boolean(color && color.premium)) {
            return true;
        }

        if (materialName !== 'PLA') {
            return false;
        }

        if (Array.isArray(color && color.hex) && color.hex.length > 1) {
            return true;
        }

        const normalized = String(color && color.nombre ? color.nombre : '').toLowerCase();
        return /(silk|marble|marmol|mármol|seda)/i.test(normalized);
    }

    function buildSwatchCss(hexValue) {
        if (Array.isArray(hexValue) && hexValue.length > 1) {
            return 'linear-gradient(135deg, ' + hexValue.join(', ') + ')';
        }
        if (Array.isArray(hexValue) && hexValue.length === 1) {
            return hexValue[0];
        }
        return typeof hexValue === 'string' ? hexValue : '#dddddd';
    }

    function buildHexLabel(hexValue) {
        if (Array.isArray(hexValue)) {
            return hexValue.join(' / ');
        }
        return typeof hexValue === 'string' ? hexValue : '#000000';
    }

    function createFigure() {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const figure = {
            id: id,
            name: 'Figura ' + state.figureCounter,
            material: 'PLA',
            colors: []
        };

        state.figureCounter += 1;
        state.figures.push(figure);
        state.activeFigureId = figure.id;
    }

    function onFigureListClick(event) {
        const target = event.target;
        const selectBtn = target.closest('[data-action="select-figure"]');
        if (selectBtn) {
            state.activeFigureId = selectBtn.getAttribute('data-id');
            render();
            return;
        }

        const deleteBtn = target.closest('[data-action="delete-figure"]');
        if (deleteBtn) {
            const id = deleteBtn.getAttribute('data-id');
            deleteFigure(id);
            render();
        }
    }

    function onFigureListInput(event) {
        const input = event.target;
        if (input.matches('[data-action="rename-figure"]')) {
            const id = input.getAttribute('data-id');
            const figure = getFigureById(id);
            if (figure) {
                figure.name = sanitizeName(input.value);
            }
        }
    }

    function onEditorClick(event) {
        const target = event.target;

        const materialBtn = target.closest('[data-action="set-material"]');
        if (materialBtn) {
            const material = materialBtn.getAttribute('data-material');
            setFigureMaterial(material);
            render();
            return;
        }

        const addColorBtn = target.closest('[data-action="add-color"]');
        if (addColorBtn) {
            const colorId = addColorBtn.getAttribute('data-color-id');
            addColorToFigure(colorId);
            render();
            return;
        }

        const removeColorBtn = target.closest('[data-action="remove-color"]');
        if (removeColorBtn) {
            const colorId = removeColorBtn.getAttribute('data-color-id');
            removeColorFromFigure(colorId);
            render();
        }
    }

    function setFigureMaterial(material) {
        const figure = getActiveFigure();
        if (!figure || (material !== 'PLA' && material !== 'PETG')) {
            return;
        }

        if (figure.material !== material) {
            figure.material = material;
            figure.colors = [];
            setStatus('Material cambiado a ' + material + '. Selecciona colores para la figura.', false);
        }
    }

    function addColorToFigure(colorId) {
        const figure = getActiveFigure();
        if (!figure) {
            return;
        }

        if (figure.colors.length >= 4) {
            setStatus('Cada figura admite un máximo de 4 colores.', true);
            return;
        }

        const color = state.catalog[figure.material].find((item) => item.id === colorId);
        if (!color) {
            return;
        }

        if (figure.colors.some((item) => item.id === colorId)) {
            setStatus('Ese color ya está en la figura.', true);
            return;
        }

        figure.colors.push(color);
        setStatus('Color añadido a ' + figure.name + '.', false);
    }

    function removeColorFromFigure(colorId) {
        const figure = getActiveFigure();
        if (!figure) {
            return;
        }

        figure.colors = figure.colors.filter((color) => color.id !== colorId);
    }

    function deleteFigure(id) {
        if (state.figures.length === 1) {
            setStatus('Debe existir al menos una figura en el proyecto.', true);
            return;
        }

        state.figures = state.figures.filter((figure) => figure.id !== id);
        if (state.activeFigureId === id) {
            state.activeFigureId = state.figures[0] ? state.figures[0].id : null;
        }
        setStatus('Figura eliminada.', false);
    }

    function render() {
        renderFigureList();
        renderEditor();
    }

    function renderFigureList() {
        dom.figurasList.innerHTML = state.figures.map((figure) => {
            const isActive = figure.id === state.activeFigureId;
            const colorCount = figure.colors.length;
            const progressPercent = Math.max(0, Math.min(100, Math.round((colorCount / 4) * 100)));
            const counterStateClass = colorCount === 0 ? ' is-empty' : (colorCount === 4 ? ' is-full' : '');
            return '' +
                '<div class="planner-figura-item' + (isActive ? ' active' : '') + '">' +
                    '<div class="planner-figura-top">' +
                        '<button type="button" class="planner-figura-select" data-action="select-figure" data-id="' + escapeHtml(figure.id) + '">Editar</button>' +
                        '<input class="planner-figura-name" data-action="rename-figure" data-id="' + escapeHtml(figure.id) + '" value="' + escapeHtml(figure.name) + '" maxlength="40" />' +
                        '<button type="button" class="planner-figura-delete" data-action="delete-figure" data-id="' + escapeHtml(figure.id) + '" aria-label="Eliminar figura">x</button>' +
                    '</div>' +
                    '<div class="planner-figura-meta">' +
                        '<span class="planner-material-tag">' + escapeHtml(figure.material) + '</span>' +
                        '<span class="planner-color-counter' + counterStateClass + '">' +
                            '<span class="planner-color-counter-text">' + colorCount + '/4</span>' +
                            '<span class="planner-color-counter-track"><span class="planner-color-counter-fill" style="width:' + progressPercent + '%;"></span></span>' +
                        '</span>' +
                    '</div>' +
                '</div>';
        }).join('');
    }

    function renderEditor() {
        const figure = getActiveFigure();
        if (!figure) {
            dom.figuraEditor.innerHTML = '<div class="planner-editor-empty">No hay figura activa.</div>';
            return;
        }

        const availableColors = state.catalog[figure.material] || [];

        const selectedHtml = figure.colors.length ? figure.colors.map((color) => {
            return '' +
                '<span class="planner-chip">' +
                    '<span class="planner-chip-swatch" style="background:' + escapeHtml(color.swatchCss) + ';"></span>' +
                    '<span>' + escapeHtml(color.name) + '</span>' +
                    '<button type="button" class="planner-chip-remove" data-action="remove-color" data-color-id="' + escapeHtml(color.id) + '" aria-label="Quitar color">x</button>' +
                '</span>';
        }).join('') : '<div class="planner-editor-empty">Aún no hay colores seleccionados para esta figura.</div>';

        const standardColors = availableColors.filter((color) => !color.isPremium);
        const premiumColors = availableColors.filter((color) => color.isPremium);
        const availableStandardHtml = standardColors.map((color) => renderColorButton(color, figure)).join('');
        const availablePremiumHtml = premiumColors.map((color) => renderColorButton(color, figure)).join('');

        dom.figuraEditor.innerHTML = '' +
            '<div class="planner-selected-colors">' + selectedHtml + '</div>' +
            '<div class="planner-material-picker">' +
                renderMaterialButton('PLA', figure.material) +
                renderMaterialButton('PETG', figure.material) +
            '</div>' +
                '<p class="planner-label">Colores básicos:</p>' +
            '<div class="planner-available-grid">' + availableStandardHtml + '</div>' +
                (availablePremiumHtml ? '<p class="planner-label">Colores premium:</p><div class="planner-available-grid">' + availablePremiumHtml + '</div>' : '');
    }

    function renderColorButton(color, figure) {
        const alreadySelected = figure.colors.some((item) => item.id === color.id);
        const disabled = alreadySelected || figure.colors.length >= 4;
        const label = color.name + ' (' + color.hexLabel + ')';
        return '' +
            '<button type="button" class="planner-color-btn" data-action="add-color" data-color-id="' + escapeHtml(color.id) + '" ' + (disabled ? 'disabled' : '') + ' title="' + escapeHtml(label) + '">' +
                '<span class="planner-chip-swatch" style="background:' + escapeHtml(color.swatchCss) + ';"></span>' +
                '<span class="planner-color-name">' + escapeHtml(color.name) + '</span>' +
            '</button>';
    }

    function renderMaterialButton(material, selectedMaterial) {
        const isActive = material === selectedMaterial;
        return '<button type="button" class="planner-material-btn' + (isActive ? ' active' : '') + '" data-action="set-material" data-material="' + material + '">' + material + '</button>';
    }

    function buildTextReport() {
        if (!state.figures.length) {
            return { ok: false, message: 'No hay figuras para copiar.' };
        }

        const lines = ['Proyecto SILAB 3D - Lista de colores', ''];

        for (let index = 0; index < state.figures.length; index += 1) {
            const figure = state.figures[index];
            if (figure.colors.length < 1) {
                return {
                    ok: false,
                    message: 'La figura "' + figure.name + '" necesita al menos 1 color antes de copiar.'
                };
            }

            lines.push('*Figura ' + (index + 1) + ': ' + figure.name + '*');
            lines.push('Material: ' + figure.material);
            lines.push('Colores (' + figure.colors.length + '): ' + figure.colors.map((color) => color.name).join(', '));
            lines.push('');
        }

        return { ok: true, text: lines.join('\n') };
    }

    async function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (error) {
                // Fallback below.
            }
        }

        const temp = document.createElement('textarea');
        temp.value = text;
        temp.setAttribute('readonly', '');
        temp.style.position = 'absolute';
        temp.style.left = '-9999px';
        document.body.appendChild(temp);
        temp.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(temp);
        return copied;
    }

    function showExportCopiedFeedback() {
        if (!dom.copyListaBtn) {
            return;
        }

        if (exportFeedbackTimer) {
            clearTimeout(exportFeedbackTimer);
        }

        const successLabel = '¡Proyecto copiado en el portapapeles!';
        dom.copyListaBtn.textContent = successLabel;
        dom.copyListaBtn.classList.add('is-copied');

        exportFeedbackTimer = setTimeout(() => {
            dom.copyListaBtn.textContent = 'Exportar proyecto';
            dom.copyListaBtn.classList.remove('is-copied');
        }, 1700);
    }

    function setStatus(message, isError) {
        // Estado silenciado por preferencia de UX: no mostrar mensajes emergentes.
        return;
    }

    function getFigureById(id) {
        return state.figures.find((figure) => figure.id === id) || null;
    }

    function getActiveFigure() {
        return getFigureById(state.activeFigureId);
    }

    function sanitizeName(input) {
        const value = (input || '').replace(/\s+/g, ' ').trim();
        return value || 'Sin nombre';
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
})();
