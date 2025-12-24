# Psicología Frecuencial

Sitio estático dividido en páginas para librería, meditaciones, blog y panel de administración. Usa Firebase (Firestore/Storage/Auth) y el Wallet Brick de Mercado Pago.

## Páginas
- `index.html`: portada y acceso rápido al resto de apartados.
- `libros.html`: vista de tienda para la colección `books` y el wallet de Mercado Pago.
- `meditaciones.html`: listado de la colección `meditations`.
- `blog.html`: feed estilo Blogger con la colección `posts`.
- `admin.html`: panel protegido por Google Sign-In para crear/eliminar libros, meditaciones, posts y subir imágenes a `gallery`.

## Datos en Firebase
- `books`: `{ title, author, cover, url, description, priceMXN, priceUSD, discount }`
- `meditations`: mismos campos que libros.
- `posts`: `{ title, category, cover, url, description }`
- `gallery`: `{ title, url, description }` (el archivo se sube a Storage si lo adjuntas en el panel).
- `config/payment`: agrega `preferenceId` para que el Wallet Brick se muestre.

## Uso rápido
1. Sirve la carpeta en cualquier hosting estático (GitHub Pages, Vercel, Netlify, Firebase Hosting).
2. La configuración de Firebase y la public key de Mercado Pago ya están incluidas.
3. Inicia sesión en `admin.html` con `moises.beltranx7@gmail.com` para poder publicar o borrar elementos.
4. Todo lo guardado aparece inmediatamente en su página dedicada (libros, meditaciones, blog o galería). Si no hay datos, se muestran ejemplos de demo desde el cliente.

## Notas
- El héroe de cada página muestra el primer elemento disponible de su colección.
- Si no existe `preferenceId` en `config/payment`, el estado del wallet mostrará una advertencia hasta que lo agregues en Firestore.
