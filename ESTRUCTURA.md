# Guía de Estructura del Proyecto SILAB 3D

## 📂 Organización de Carpetas

### Raíz (`/`)
- **index.html** - Página principal de inicio
- **README.md** - Documentación del proyecto

### `/css`
Contiene todos los archivos de estilos:
- **styles.css** - Estilos principales y responsive design

### `/js`
Contiene scripts JavaScript:
- **script.js** - Funcionalidad de filtros y interactividad

### `/pages`
Contiene las páginas secundarias del sitio:
- **tienda.html** - Catálogo de productos
- **materiales.html** - Información sobre materiales

### `/img` (Futura)
Almacenará todas las imágenes:
- Fotos de productos
- Iconos
- Banners
- Logos

### `/assets` (Futura)
Almacenará archivos adicionales:
- PDFs con especificaciones
- Documentos descargables
- Catálogos en PDF
- Certificados

## 🔗 Referencias de Rutas

### Desde `index.html` (raíz)
```html
<link rel="stylesheet" href="css/styles.css">
<script src="js/script.js"></script>
<a href="pages/tienda.html">Tienda</a>
```

### Desde archivos en `/pages`
```html
<link rel="stylesheet" href="../css/styles.css">
<script src="../js/script.js"></script>
<a href="../index.html">Inicio</a>
<a href="tienda.html">Tienda</a>
```

## 📋 Nombres de Archivos

### Convención de Nombres
- **Archivos HTML**: minúsculas, guiones para espacios
  - `index.html`, `tienda.html`, `materiales.html`
- **Archivos CSS**: minúsculas
  - `styles.css`
- **Archivos JavaScript**: minúsculas
  - `script.js`
- **Imágenes**: descriptivas, minúsculas
  - `producto-dinosaurio.png`, `icono-envio.svg`

## 🎨 Estructura de Archivos CSS

```css
:root { }              /* Variables globales */
* { }                  /* Reset */
html { }               /* Estilos HTML */
body { }               /* Estilos body */

/* Container y layout */
.container { }

/* Navegación */
.navbar { }
.nav-links { }

/* Secciones principales */
.hero { }
.about { }
.services { }
.tienda { }
.materiales { }

/* Componentes reutilizables */
.cta-button { }
.card { }

/* Media queries */
@media (max-width: 768px) { }
```

## 🔄 Flujo de Navegación

```
index.html (Inicio)
├── pages/tienda.html (Tienda)
│   └── ../index.html (volver)
│   └── materiales.html (materiales)
└── pages/materiales.html (Materiales)
    └── ../index.html (volver)
    └── tienda.html (tienda)
```

## ✅ Checklist para Agregar Nueva Funcionalidad

- [ ] Crear/editar archivos en carpetas apropiadas
- [ ] Actualizar referencias de rutas en HTML
- [ ] Validar links de navegación
- [ ] Probar en móvil (max-width: 480px)
- [ ] Probar en tablet (max-width: 768px)
- [ ] Probar en desktop
- [ ] Actualizar README.md si es necesario

## 🚀 Próximos Pasos Recomendados

1. **Agregar imágenes** en la carpeta `/img`
2. **Crear página de contacto** en `/pages/contacto.html`
3. **Implementar carrito de compras** con JavaScript
4. **Agregar formulario de contacto**
5. **Integrar base de datos** (si se requiere)
6. **Optimizar imágenes** para web
7. **Minificar CSS y JS** para producción

---

**Última actualización**: Diciembre 2025
