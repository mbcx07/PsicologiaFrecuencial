# Psicología Frecuencial

Landing estática con Firebase y cobros por Mercado Pago.

## Cómo usar
1. Abre `index.html` desde cualquier hosting estático (GitHub Pages, Firebase Hosting, Vercel, Netlify).
2. Firebase ya está configurado con la clave que compartiste. La app escribe/lee:
   - `books`: enlaces de libros.
   - `meditations`: audios o videos.
   - `gallery`: imágenes (subidas a Storage o referenciadas por URL).
3. Para activar los cobros:
   - Crea una preferencia en tu cuenta de Mercado Pago.
   - Guarda el `preferenceId` en Firestore en el documento `config/payment` (campo `preferenceId`).
   - El Wallet Brick usará tu public key `APP_USR-7d17980f-c2ee-47d1-990c-de2e3d4c4fc0`.

## Diseño y panel
- La portada replica la experiencia de la versión desplegada en la nube: hero, cards de recursos y panel inferior para cargar contenido.
- Usa el botón "Abrir panel de carga" o desplázate al final para abrir los formularios de libros, meditaciones e imágenes.
- Los elementos cargados aparecen al instante en la biblioteca y en el bloque destacado del héroe.

## Desarrollo local
Al ser un sitio estático no necesitas dependencias. Abre `index.html` en el navegador o sirve la carpeta con tu servidor HTTP favorito.
