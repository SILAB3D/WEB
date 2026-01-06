# SILAB 3D - Muestrario de Impresión 3D

## 📋 Descripción del Proyecto

SILAB 3D es una página web profesional, rápida y optimizada para un muestrario de impresión 3D. Incluye información sobre la empresa, un catálogo completo de productos y detalles sobre los materiales disponibles con visualización 3D interactiva.

## 📁 Estructura del Proyecto

```
WEB/
├── index.html                    # Página de inicio
├── css/
│   ├── custom.css               # Estilos personalizados
│   ├── styles.css               # Estilos principales
│   └── tailwind.min.css         # Framework CSS compilado
├── js/
│   └── script.js                # JavaScript interactivo
├── pages/
│   ├── productos.html           # Catálogo de productos
│   ├── materiales.html          # Muestrario con visualización 3D
│   ├── reseñas.html            # Opiniones de clientes
│   └── términos.html           # Términos y condiciones
├── data/
│   └── filamentos.json          # Base de datos de colores
├── img/                         # Imágenes optimizadas (WebP)
├── assets/                      # Modelos 3D y recursos adicionales
└── README.md                    # Este archivo
```

## 🎯 Páginas Disponibles

### 1. **Página de Inicio** (`index.html`)
- Sección hero con bienvenida profesional
- Información "Quiénes Somos"
- Servicios principales destacados
- Call-to-action hacia productos y materiales

### 2. **Catálogo de Productos** (`pages/productos.html`)
- Catálogo completo de diseños personalizables
- Filtrado interactivo por categorías
- Información detallada de cada producto
- Links directos a presupuestos

### 3. **Muestrario de Materiales** (`pages/materiales.html`)
- PLA con 13 colores disponibles
- PETG con 4 opciones de color
- Visualización 3D interactiva de cada color
- Tabla comparativa de propiedades
- Sistema de recomendaciones de combinaciones de colores

### 4. **Reseñas de Clientes** (`pages/reseñas.html`)
- Widget de opiniones de Google
- Galería de trabajos en Instagram
- Testimonios verificados

## 🎨 Características Técnicas

### Optimización y Rendimiento
- ⚡ **CSS compilado**: Tailwind pre-compilado (sin JIT Compiler)
- 🚀 **Scripts con defer**: No bloquean el renderizado
- 📦 **Imágenes WebP**: Reducción de ~40% en tamaño
- 🔗 **DNS Prefetch**: Precargas inteligentes de recursos
- 📉 **-152KB**: Eliminados recursos innecesarios

### Diseño
- **Responsive**: Adaptable a móviles, tablets y desktop
- **Moderno**: Gradientes, sombras y transiciones suaves
- **Profesional**: Paleta de colores coherente y atractiva

### Funcionalidad
- 🎨 **Visualizador 3D**: Model Viewer integrado para cada color
- 🔍 **Filtrado dinámico**: Búsqueda y filtrado de productos
- 🎯 **Corrección de gamma**: Colores realistas en renderizado
- 📱 **Modal responsivo**: Detalles de color con recomendaciones
- 💾 **JSON dinámico**: Base de datos sincronizable

## 🚀 Cómo Usar

1. **Abrir la página**: Abre `index.html` en tu navegador (o accede al dominio)
2. **Navegar**: Usa el menú superior para acceder a diferentes secciones
3. **Explorar productos**: Filtra y explora el catálogo completo
4. **Ver materiales**: Visualiza colores en 3D y consulta especificaciones

## 📱 Responsividad

La página se adapta perfectamente a:
- **Escritorio**: 1200px+ (navegación completa)
- **Tablet**: 768px - 1199px (diseño optimizado)
- **Móvil**: Menos de 768px (navbar colapsable)

## 🎯 Colores Disponibles

### PLA (Biodegradable)
- Black, Silver, White, Wood, Coffee Brown
- Sakura Pink, Lavender Purple, Sky Blue
- Mint Green, Sunny Orange, Lemon Yellow
- Grass Green, Silk Yellow

### PETG (Resistente)
- Black, White, Blue, Red

## 📦 Optimizaciones Implementadas (v1.5)

- ✅ Renombrado a `index.html` (estándar web)
- ✅ Tailwind CDN reemplazado por CSS compilado (-52KB)
- ✅ Scripts con atributo `defer` para no bloquear rendering
- ✅ DNS Prefetch para dominios externos
- ✅ Elfsight duplicado removido (-100KB)
- ✅ Imágenes convertidas a WebP (mejor compresión)
- ✅ Archivos no utilizados eliminados (limpieza del repositorio)
- ✅ Corrección de gamma en visualizador 3D

## 📧 Información de Contacto

- **Email**: silab3d@gmail.com
- **Teléfono**: +34 644 07 04 87
- **Instagram**: @silab3d

## 📝 Notas de Desarrollo

- Los archivos HTML están organizados en `pages/` por función
- Los estilos están centralizados en `css/`
- JavaScript se encuentra en `js/script.js`
- Los colores se sincronizan desde `data/filamentos.json`
- Las imágenes están optimizadas en formato WebP
- Los modelos 3D se encuentran en `assets/`

## 🔄 Historial de Versiones

- **v1.5** - Enero 2026: Optimización de rendimiento, renombramiento a index.html, limpieza del proyecto
- **v1.4** - Enero 2026: Conversión a WebP, redimensionamiento de imágenes
- **v1.3** - Enero 2026: Actualización de códigos de color v1.1_Prueba
- **v1.2** - Enero 2026: Revisión y ajustes
- **v1.1_Prueba** - Diciembre 2025: Versión de prueba
- **v1.0** - Diciembre 2025: Release inicial

---

**Creado para SILAB 3D - Innovación en Impresión 3D** ✨
