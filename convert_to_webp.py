#!/usr/bin/env python3
from PIL import Image
import os
from pathlib import Path

# Directorio de imágenes
img_dir = Path(__file__).parent / "img"

# Extensiones a convertir
extensions_to_convert = {'.png', '.jpg', '.jpeg'}

# Convertir cada imagen
for img_file in img_dir.iterdir():
    if img_file.suffix.lower() in extensions_to_convert and img_file.name != 'desktop.ini':
        try:
            # Abrir imagen
            img = Image.open(img_file)
            
            # Crear nombre del archivo webp
            webp_name = img_file.stem + '.webp'
            webp_path = img_dir / webp_name
            
            # Convertir a RGB si tiene transparencia (excepto favicon)
            if img.mode in ('RGBA', 'LA', 'P') and 'favicon' not in img_file.name:
                # Crear fondo blanco
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                rgb_img.save(webp_path, 'WEBP', quality=85)
            else:
                # Guardar directamente
                img.save(webp_path, 'WEBP', quality=85)
            
            print(f"✓ Convertido: {img_file.name} → {webp_name}")
        except Exception as e:
            print(f"✗ Error al convertir {img_file.name}: {e}")

print("\n✓ Conversiones completadas")
