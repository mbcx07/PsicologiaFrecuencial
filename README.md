# Psicología Frecuencial

Landing estática con Firebase y cobros por Mercado Pago.

## Cómo usar
1. Abre `index.html` desde cualquier hosting estático (GitHub Pages, Firebase Hosting, Vercel, Netlify).
2. Firebase ya está configurado con la clave que compartiste. La app escribe/lee:
   - `books`: enlaces de libros (portada, precios, descuento).
   - `meditations`: audios o videos de frecuencias.
   - `posts`: artículos del blog (título, categoría, cover, link externo).
   - `gallery`: imágenes (subidas a Storage o referenciadas por URL).
3. Para activar los cobros:
   - Crea una preferencia en tu cuenta de Mercado Pago.
   - Guarda el `preferenceId` en Firestore en el documento `config/payment` (campo `preferenceId`).
   - El Wallet Brick usará tu public key `APP_USR-7d17980f-c2ee-47d1-990c-de2e3d4c4fc0`.

## Diseño y panel
- La portada replica la experiencia de la versión desplegada en la nube: hero, cards de recursos y panel inferior para cargar contenido.
- El héroe y las secciones ya no usan datos estáticos: toman en vivo las colecciones de Firestore.
- Usa el panel inferior (pestañas Libros, Audios, Blog y Zona test) para publicar libros, meditaciones, entradas del blog e imágenes.
- Inicia sesión con Google usando la cuenta `moises.beltranx7@gmail.com` para habilitar edición y borrado.
- Los elementos cargados aparecen al instante en la biblioteca, en el feed del blog y en el héroe destacado.
- Si las colecciones están vacías, el cliente crea contenido de demo (libro, meditación, posts y una imagen) para que veas el diseño completo sin datos estáticos.
- El botón **Modo demo** activa un administrador falso y guarda libros, meditaciones, blog e imágenes en `localStorage`, útil cuando Firestore/Google Auth no responde. También carga datos de demo desde la primera vista para que todo se vea poblado.

## Desarrollo local
Al ser un sitio estático no necesitas dependencias. Abre `index.html` en el navegador o sirve la carpeta con tu servidor HTTP favorito.
