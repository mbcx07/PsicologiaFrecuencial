import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyB9SQUqPAvXiU5GG8jOX35yjxPwgtJpn8E",
  authDomain: "psico-c6f02.firebaseapp.com",
  projectId: "psico-c6f02",
  storageBucket: "psico-c6f02.firebasestorage.app",
  messagingSenderId: "444844907252",
  appId: "1:444844907252:web:263a67c113a6ff461edca1",
  measurementId: "G-7P7GS0Z6ZQ",
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

const mpPublicKey = "APP_USR-7d17980f-c2ee-47d1-990c-de2e3d4c4fc0";
const mp = new MercadoPago(mpPublicKey, { locale: "es-AR" });
const placeholderCover = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const firebaseStatus = document.getElementById("firebase-status");
const mpStatus = document.getElementById("mp-status");
const galleryList = document.getElementById("gallery-list");
const heroCover = document.getElementById("hero-cover");
const heroAuthor = document.getElementById("hero-author");
const heroTitle = document.getElementById("hero-title");
const heroDesc = document.getElementById("hero-desc");
const highlightPill = document.getElementById("highlight-pill");
const heroCard = document.getElementById("hero-card");
const heroDiscount = document.getElementById("hero-discount");
const heroCategory = document.getElementById("hero-category");
const heroPriceMXN = document.getElementById("hero-price-mxn");
const heroPriceUSD = document.getElementById("hero-price-usd");
const heroPrices = document.getElementById("hero-prices");

firebaseStatus.textContent = "Firebase listo";
firebaseStatus.classList.add("chip--success");
heroCover.src = placeholderCover;
heroCover.classList.add("cover--empty");
heroPrices.style.display = "none";

const safeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const renderBlogCard = (data) => {
  const card = document.createElement("article");
  card.className = "blog-card";
  card.innerHTML = `
    <div class="meta">${data.author || "Moïses Beltrán Castro"} · ${data.category || "Recurso"}</div>
    <h4>${data.title ?? "Sin título"}</h4>
    <p class="muted">${data.description ?? "Contenido pendiente"}</p>
    ${data.url ? `<a class="link" href="${data.url}" target="_blank" rel="noopener">Leer ahora</a>` : ""}
  `;
  return card;
};

const renderResourceCard = (data) => {
  const card = document.createElement("article");
  card.className = "resource-card";
  const discount = safeNumber(data.discount);
  const priceMXN = safeNumber(data.priceMXN ?? data.price);
  const priceUSD = safeNumber(data.priceUSD);
  const cover = data.cover || data.url;
  card.innerHTML = `
    ${discount ? `<span class="badge badge--discount">-${discount}%</span>` : ""}
    ${cover ? `<img src="${cover}" alt="${data.title ?? "Portada"}">` : ""}
    <div class="author">${data.author || "Moïses Beltrán Castro"}</div>
    <h3>${data.title ?? "Recurso"}</h3>
    <p class="desc">${data.description ?? "Descripción pendiente"}</p>
    <div class="pricing">
      ${priceMXN ? `<span class="primary">$${priceMXN} MXN</span>` : ""}
      ${priceUSD ? `<span class="secondary">$${priceUSD} USD</span>` : ""}
    </div>
    <div class="actions">
      <span class="pill pill--success">${data.category === "meditations" ? "Adquirir sintonía" : "Leer ahora"}</span>
      ${data.url ? `<a href="${data.url}" target="_blank" rel="noopener">Abrir</a>` : ""}
    </div>
  `;
  return card;
};

const renderGalleryCard = (data) => {
  const card = document.createElement("div");
  card.className = "gallery-card";
  if (data.url) {
    const img = document.createElement("img");
    img.src = data.url;
    img.alt = data.title ?? "Imagen";
    card.appendChild(img);
  }
  const info = document.createElement("div");
  info.className = "gallery-card__info";
  info.innerHTML = `<strong>${data.title ?? "Imagen"}</strong><br>${data.description ?? ""}`;
  card.appendChild(info);
  return card;
};

const sections = {
  books: document.getElementById("book-cards"),
  meditations: document.getElementById("meditation-cards"),
};

const blogList = document.getElementById("blog-list");

const updateHero = (items) => {
  if (!items.length) {
    highlightPill.textContent = "Sin contenido en vivo";
    heroCategory.textContent = "En vivo";
    heroCategory.classList.add("chip--outline");
    heroDiscount.classList.add("pill--hidden");
    heroCover.src = placeholderCover;
    heroCover.classList.add("cover--empty");
    heroPrices.style.display = "none";
    return;
  }
  const latest = [...items].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0];
  highlightPill.textContent = latest.title ?? "Nuevo recurso";
  heroTitle.textContent = latest.title ?? "Recurso";
  heroDesc.textContent = latest.description ?? "";
  heroAuthor.textContent = latest.author || "Moïses Beltrán Castro";
  heroCategory.textContent = latest.category === "meditations" ? "Meditación" : "Libro";
  heroCategory.classList.remove("chip--outline");

  const hasCover = Boolean(latest.cover || latest.url);
  heroCover.src = hasCover ? latest.cover || latest.url : placeholderCover;
  heroCover.classList.toggle("cover--empty", !hasCover);

  const discount = safeNumber(latest.discount);
  if (discount) {
    heroDiscount.textContent = `Oferta · -${discount}%`;
    heroDiscount.classList.remove("pill--hidden");
  } else {
    heroDiscount.classList.add("pill--hidden");
  }

  const priceMXN = safeNumber(latest.priceMXN ?? latest.price);
  const priceUSD = safeNumber(latest.priceUSD);
  heroPriceMXN.textContent = priceMXN ? `$${priceMXN} MXN` : "";
  heroPriceUSD.textContent = priceUSD ? `$${priceUSD} USD` : "";
  heroPrices.style.display = priceMXN || priceUSD ? "flex" : "none";
};

const renderCollections = () => {
  const state = { books: [], meditations: [] };

  const renderEmptyCard = (container, message) => {
    const empty = document.createElement("article");
    empty.className = "blog-card ghost";
    empty.innerHTML = message;
    container.appendChild(empty);
  };

  const rebuildBlogAndHero = () => {
    const combined = [...state.books, ...state.meditations].sort(
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );
    blogList.innerHTML = "";
    if (!combined.length) {
      renderEmptyCard(
        blogList,
        "<strong>Sin contenido</strong><br>Publica libros o meditaciones para verlos aquí al instante."
      );
    } else {
      combined.forEach((item) => blogList.appendChild(renderBlogCard(item)));
    }
    updateHero(combined);
  };

  const listen = (name) => {
    onSnapshot(collection(db, name), (snapshot) => {
      if (name === "gallery") {
        galleryList.innerHTML = "";
        const galleryItems = snapshot.docs.map((docSnap) => docSnap.data());
        if (!galleryItems.length) {
          renderEmptyCard(
            galleryList,
            "Sube imágenes en la pestaña Zona test y se verán aquí con su descripción."
          );
          return;
        }
        galleryItems
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          .forEach((item) => {
            galleryList.appendChild(renderGalleryCard(item));
          });
        return;
      }

      const container = name === "books" ? sections.books : sections.meditations;
      container.innerHTML = "";
      state[name] = snapshot.docs
        .map((docSnap) => ({ ...docSnap.data(), id: docSnap.id, category: name }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      if (!state[name].length) {
        renderEmptyCard(
          container,
          `Sin ${name === "books" ? "libros" : "audios"} aún. Usa el panel de admin para cargarlos en vivo.`
        );
      } else {
        state[name].forEach((data) => container.appendChild(renderResourceCard(data)));
      }

      rebuildBlogAndHero();
    });
  };

  listen("books");
  listen("meditations");
  listen("gallery");
};

const uploadFileIfNeeded = async (file) => {
  if (!file) return null;
  const storageRef = ref(storage, `gallery/${Date.now()}-${file.name}`);
  const snap = await uploadBytes(storageRef, file);
  return getDownloadURL(snap.ref);
};

const handleSubmit = (collectionName, form, needsUpload) => {
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = {
      title: formData.get("title"),
      url: formData.get("url") || null,
      cover: formData.get("cover") || null,
      author: formData.get("author") || null,
      priceMXN: safeNumber(formData.get("priceMXN")),
      priceUSD: safeNumber(formData.get("priceUSD")),
      discount: safeNumber(formData.get("discount")),
      description: formData.get("description") || null,
      createdAt: serverTimestamp(),
    };

    if (needsUpload) {
      const file = form.elements.namedItem("file").files[0];
      const uploadedUrl = await uploadFileIfNeeded(file);
      if (uploadedUrl) payload.url = uploadedUrl;
    }

    await addDoc(collection(db, collectionName), payload);
    form.reset();
  });
};

handleSubmit("books", document.getElementById("book-form"), false);
handleSubmit("meditations", document.getElementById("meditation-form"), false);
handleSubmit("gallery", document.getElementById("gallery-form"), true);

renderCollections();

const bootstrapPayment = async () => {
  try {
    const docSnap = await getDoc(doc(db, "config", "payment"));
    const prefId = docSnap.data()?.preferenceId;
    if (!prefId) {
      mpStatus.textContent = "Agrega un preferenceId en config/payment";
      return;
    }
    mpStatus.textContent = "Preferencia encontrada, cargando Wallet";
    const bricksBuilder = mp.bricks();
    await bricksBuilder.create("wallet", "wallet_container", {
      initialization: { preferenceId: prefId },
    });
  } catch (err) {
    console.error(err);
    mpStatus.textContent = "Error cargando pago: " + err.message;
  }
};

bootstrapPayment();
