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

const firebaseStatus = document.getElementById("firebase-status");
const mpStatus = document.getElementById("mp-status");
const galleryList = document.getElementById("gallery-list");
const heroCover = document.getElementById("hero-cover");
const heroAuthor = document.getElementById("hero-author");
const heroTitle = document.getElementById("hero-title");
const heroDesc = document.getElementById("hero-desc");
const highlightPill = document.getElementById("highlight-pill");
const heroCard = document.getElementById("hero-card");

firebaseStatus.textContent = "Firebase listo";
firebaseStatus.classList.add("chip--success");

const safeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const renderBlogCard = (data) => {
  const card = document.createElement("article");
  card.className = "blog-card";
  card.innerHTML = `
    <div class="meta">${data.author || "Moïses Beltrán Castro"} · ${data.category}</div>
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
  const priceMXN = data.priceMXN ?? data.price ?? null;
  const priceUSD = data.priceUSD ?? null;
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
    highlightPill.textContent = "Carga tus recursos en Firestore";
    return;
  }
  const latest = [...items].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0];
  highlightPill.textContent = latest.title ?? "Nuevo recurso";
  heroTitle.textContent = latest.title ?? "Recurso";
  heroDesc.textContent = latest.description ?? "";
  heroAuthor.textContent = latest.author || "Moïses Beltrán Castro";
  if (latest.cover || latest.url) {
    heroCover.src = latest.cover || latest.url;
  }
};

const renderCollections = () => {
  const state = { books: [], meditations: [] };

  const rebuildBlogAndHero = () => {
    const combined = [...state.books, ...state.meditations].sort(
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );
    blogList.innerHTML = "";
    if (!combined.length) {
      blogList.innerHTML = '<article class="blog-card ghost">Carga posts en Firestore para verlos aquí.</article>';
    } else {
      combined.forEach((item) => blogList.appendChild(renderBlogCard(item)));
    }
    updateHero(combined);
  };

  const listen = (name) => {
    onSnapshot(collection(db, name), (snapshot) => {
      if (name === "gallery") {
        galleryList.innerHTML = "";
        snapshot.forEach((docSnap) => {
          galleryList.appendChild(renderGalleryCard(docSnap.data()));
        });
        return;
      }

      const container = name === "books" ? sections.books : sections.meditations;
      container.innerHTML = "";
      state[name] = [];

      snapshot.forEach((docSnap) => {
        const data = { ...docSnap.data(), id: docSnap.id, category: name };
        state[name].push(data);
        container.appendChild(renderResourceCard(data));
      });

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
