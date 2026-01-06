#!/usr/bin/env python3
from PIL import Image
from pathlib import Path

# Directorio de imágenes
img_dir = Path(__file__).parent / "img"

# Diccionario de imágenes a redimensionar
images_to_resize = {
    'Wave.webp': (240, 360),
    'Ilustración simple.webp': (240, 360),
    'Classic.webp': (240, 360),
    'Llaveros personalizados.webp': (240, 360),
    'Código de Spotify.webp': (240, 360),
    'productos silab.webp': (400, 400),
    'Romance.webp': (240, 360),
    'Geo.webp': (240, 320),
    'Aura.webp': (240, 360),
    'Straight.webp': (240, 370),
    'SILAB-LOGO-lateral.png': (359, 130),
}

# Redimensionar cada imagen
for img_name, new_size in images_to_resize.items():
    img_path = img_dir / img_name
    
    if img_path.exists():
        try:
            # Abrir imagen
            img = Image.open(img_path)
            
            # Redimensionar con LANCZOS para mejor calidad
            img_resized = img.resize(new_size, Image.Resampling.LANCZOS)
            
            # Guardar sobre la imagen original
            if img_name.endswith('.png'):
                img_resized.save(img_path, 'PNG', quality=95)
            else:
                img_resized.save(img_path, 'WEBP', quality=85)
            
            print(f"✓ Redimensionada: {img_name} → {new_size}")
        except Exception as e:
            print(f"✗ Error al redimensionar {img_name}: {e}")
    else:
        print(f"✗ No encontrada: {img_name}")

print("\n✓ Redimensionamientos completados")
