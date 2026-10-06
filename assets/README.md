# assets/ — bandeja de entrada

Archivos de diseño que reúne el usuario. Aquí se **clasifican y se guardan**; todavía no
se sirven desde el sitio. Cuando se construya cada componente (Fase 3) lo que es parte
del diseño se mueve a `web/public/` (se sirve con `next/image`), y lo que edita el
profesor (retrato, CV, imágenes de página) se sube a Sanity.

## Inventario (2026-10-05)

| Archivo | Qué es | Destino previsto |
|---|---|---|
| `logos/logo-carlos-conca.svg` | Isotipo "CC", trazo negro (viewBox 334×334) | **movido a `web/public/logos/`** · navbar sobre fondo claro (falta footer) |
| `logos/logo-carlos-conca-light.svg` | Isotipo "CC", versión clara | **movido a `web/public/logos/`** · navbar sobre fondo oscuro |
| `logos/logo-fcfm.png`, `logo-fcfm-2.png` | Logo Facultad de Ciencias Físicas y Matemáticas (927×170), dos variantes; el WordPress usa `logo_fcfm2.png` en el hero de la home | `web/public/` (confirmar cuál va) |
| `fotos/carlos-conca-background.jpg` | Foto de fondo, 1450×1224 | hero de la home (Sanity `portrait` o `public/`; decidir) |
| `fotos/carlos-conca-background-2.jpg` | Misma foto, 1700×1419 (mayor resolución; es la que usa el WordPress) | ídem |
| `fotos/areas-investigacion/*.png` | 6 ilustraciones 750×1080: homogeneización, fluidos, estructura sólido-fluido, diseño óptimo, problemas inversos, investigación asociativa | tarjetas de áreas en la home. **El schema no tiene campo de imagen por área**: agregarlo (`researchArea.image`) o servirlas desde `public/` |

## Pendientes de assets (no están aquí)

- Isotipo "CC" grande del footer (el WordPress usa `cc.logo_.svg`, 134×134; probablemente es el mismo `logo-carlos-conca.svg`).
- Favicon / ícono de app, imagen para redes (Open Graph).
- Retrato del profesor para `homePage.portrait` (el actual es un fondo del tema).
- Íconos de las tarjetas de cifras (documento con comillas).
- CV en PDF: ya está en Sanity (`siteSettings.cv`, bajado del WordPress); aquí solo si hay versión nueva.

## Convenciones

Nombres en minúsculas con guiones, sin acentos. SVG para logos e íconos. Foto original en la
mejor resolución disponible (Next la optimiza). Las carpetas vacías (`iconos/`, `documentos/`,
`otros/`) tienen `.gitkeep`.
