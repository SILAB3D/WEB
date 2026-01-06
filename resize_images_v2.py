#!/usr/bin/env python3
from PIL import Image
from pathlib import Path

# Directorio de imágenes
img_dir = Path(__file__).parent / "img"

# Imágenes a redimensionar
images_to_resize = {
    'filamentos silab.webp': (378, 252),
    'SILAB-LOGO-lateral.png': (262, 94),
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
