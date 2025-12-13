# Directorio de Uploads

Este directorio contiene las imágenes y archivos subidos por los usuarios del sistema.

## Estructura

```
uploads/
├── products/     # Imágenes de productos
├── categories/   # Imágenes de categorías (futuro)
└── users/        # Avatares de usuarios (futuro)
```

## Características

- **Tamaño máximo:** 5MB por archivo
- **Formatos permitidos:** JPG, PNG, GIF, WEBP
- **Nombres únicos:** Los archivos se renombran automáticamente con timestamp para evitar duplicados
- **Acceso público:** Los archivos son accesibles públicamente en `/uploads/{folder}/{filename}`

## Seguridad

- Solo usuarios autenticados con rol admin pueden subir archivos
- Validación de tipo MIME en el servidor
- Validación de tamaño en el servidor
- Nombres de archivo sanitizados (caracteres especiales removidos)

## Backup

⚠️ **IMPORTANTE:** Este directorio NO está incluido en Git. 

Para producción, asegúrate de:
1. Hacer backups regulares de este directorio
2. Usar un servicio de almacenamiento en la nube (S3, Cloudinary, etc.) para mejor escalabilidad
3. Configurar permisos adecuados en el servidor (755 para directorios, 644 para archivos)

## Mantenimiento

- Revisa periódicamente el espacio en disco
- Elimina imágenes huérfanas (productos eliminados que aún tienen imágenes)
- Considera implementar optimización de imágenes (resize, compress) en el futuro
