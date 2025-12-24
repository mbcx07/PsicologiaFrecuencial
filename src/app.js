import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const mpPublicKey = "APP_USR-7d17980f-c2ee-47d1-990c-de2e3d4c4fc0";
const mp = new MercadoPago(mpPublicKey, { locale: "es-AR" });
const placeholderCover = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
const adminEmail = "moises.beltranx7@gmail.com";
let currentUser = null;
let isAdmin = false;

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
const blogStream = document.getElementById("blog-stream");
const blogRefresh = document.getElementById("blog-refresh");
const adminBooks = document.getElementById("admin-books");
const adminMeditations = document.getElementById("admin-meditations");
const adminPosts = document.getElementById("admin-posts");
const authStatus = document.getElementById("auth-status");
const authButton = document.getElementById("auth-button");
const postForm = document.getElementById("post-form");
const bookForm = document.getElementById("book-form");
const meditationForm = document.getElementById("meditation-form");

firebaseStatus.textContent = "Firebase listo";
firebaseStatus.classList.add("chip--success");
heroCover.src = placeholderCover;
heroCover.classList.add("cover--empty");
heroPrices.style.display = "none";

const safeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const formatDate = (timestamp) => {
  if (!timestamp?.seconds) return "Fecha no registrada";
  return new Date(timestamp.seconds * 1000).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const editingState = {
  books: null,
  meditations: null,
  posts: null,
};

const renderBlogCard = (data) => {
  const card = document.createElement("article");
  card.className = "blog-card";
  card.innerHTML = `
    ${data.cover ? `<img class="blog-card__cover" src="${data.cover}" alt="${data.title ?? "Post"}">` : ""}
    <div class="meta">${formatDate(data.createdAt)} · ${data.category || "Blog"}</div>
    <h4>${data.title ?? "Sin título"}</h4>
    <p class="muted">${data.description ?? "Contenido pendiente"}</p>
    <div class="blog-card__footer">
      <span class="chip chip--outline">${data.author || "Moïses Beltrán Castro"}</span>
      ${data.url ? `<a class="link" href="${data.url}" target="_blank" rel="noopener">Leer ahora</a>` : ""}
    </div>
  `;
  return card;
};

const renderBlogStreamCard = (data) => {
  const card = document.createElement("article");
  card.className = "stream-card";
  card.innerHTML = `
    <div class="stream-card__header">
      <span class="pill pill--ghost">${data.category || "Entrada"}</span>
      <span class="muted">${formatDate(data.createdAt)}</span>
    </div>
    <h3>${data.title ?? "Artículo"}</h3>
    <p class="muted">${data.description ?? "Descripción pendiente"}</p>
    <div class="stream-card__actions">
      <span class="chip">${data.author || "Moïses Beltrán Castro"}</span>
      ${data.url ? `<a class="btn btn--ghost" href="${data.url}" target="_blank" rel="noopener">Leer</a>` : ""}
    </div>
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

const renderAdminRow = (data, collectionKey, formRef, containerRef) => {
  const row = document.createElement("div");
  row.className = "admin-row";
  row.innerHTML = `
    <div class="admin-row__meta">
      <strong>${data.title ?? "Sin título"}</strong>
      <span class="muted">${formatDate(data.createdAt)}</span>
    </div>
    <div class="admin-row__actions">
      <button class="chip chip--outline" data-action="edit">Editar</button>
      <button class="chip chip--danger" data-action="delete">Borrar</button>
    </div>
  `;

  row.querySelector('[data-action="edit"]').addEventListener("click", () => {
    if (!isAdmin) return;
    populateForm(formRef, data, collectionKey);
    formRef.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  row.querySelector('[data-action="delete"]').addEventListener("click", async () => {
    if (!isAdmin) return;
    const ok = confirm("¿Eliminar este elemento?");
    if (!ok) return;
    await deleteDoc(doc(db, collectionKey, data.id));
    if (editingState[collectionKey] === data.id) {
      resetForm(formRef, collectionKey);
    }
  });

  containerRef.appendChild(row);
};

const sections = {
  books: document.getElementById("book-cards"),
  meditations: document.getElementById("meditation-cards"),
};

const blogList = document.getElementById("blog-list");

const updateFormLock = () => {
  const reason = isAdmin
    ? "Modo edición"
    : "Solo lectura · Inicia sesión con tu Google autorizado";
  authStatus.textContent = isAdmin
    ? `Admin: ${currentUser?.email}`
    : reason;
  authButton.textContent = isAdmin ? "Salir" : "Ingresar con Google";

  [bookForm, meditationForm, postForm, document.getElementById("gallery-form")]
    .filter(Boolean)
    .forEach((form) => {
      Array.from(form.elements).forEach((el) => {
        if (el.tagName !== "BUTTON") {
          el.disabled = !isAdmin;
        }
      });
    });
};
updateFormLock();

const populateForm = (form, data, collectionKey) => {
  editingState[collectionKey] = data.id;
  const submit = form.querySelector("button[type='submit']");
  if (submit && !submit.dataset.defaultText) {
    submit.dataset.defaultText = submit.textContent;
  }
  if (submit) submit.textContent = "Actualizar";
  Object.entries(data).forEach(([key, value]) => {
    const control = form.elements.namedItem(key);
    if (control && typeof value !== "object") {
      control.value = value ?? "";
    }
  });
};

const resetForm = (form, collectionKey) => {
  form.reset();
  editingState[collectionKey] = null;
  const submit = form.querySelector("button[type='submit']");
  if (submit) {
    submit.dataset.defaultText = submit.dataset.defaultText || submit.textContent;
    submit.textContent = submit.dataset.defaultText;
  }
};

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
  const state = { books: [], meditations: [], posts: [] };

  const renderEmptyCard = (container, message) => {
    const empty = document.createElement("article");
    empty.className = "blog-card ghost";
    empty.innerHTML = message;
    container.appendChild(empty);
  };

  const rebuildHero = () => {
    const combined = [...state.books, ...state.meditations].sort(
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );
    updateHero(combined);
  };

  const rebuildBlog = () => {
    blogList.innerHTML = "";
    blogStream.innerHTML = "";
    if (!state.posts.length) {
      renderEmptyCard(
        blogList,
        "<strong>Sin entradas</strong><br>Publica artículos en la pestaña Blog para verlos aquí."
      );
      return;
    }
    state.posts.forEach((item) => {
      blogList.appendChild(renderBlogCard(item));
      blogStream.appendChild(renderBlogStreamCard(item));
    });
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

      const container =
        name === "books"
          ? sections.books
          : name === "meditations"
            ? sections.meditations
            : null;

      state[name] = snapshot.docs
        .map((docSnap) => ({ ...docSnap.data(), id: docSnap.id, category: name }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      if (container) {
        container.innerHTML = "";
        if (!state[name].length) {
          renderEmptyCard(
            container,
            `Sin ${name === "books" ? "libros" : "audios"} aún. Usa el panel de admin para cargarlos en vivo.`
          );
        } else {
          state[name].forEach((data) => container.appendChild(renderResourceCard(data)));
        }
      }

      if (name === "books") {
        adminBooks.innerHTML = "";
        state.books.forEach((data) =>
          renderAdminRow(data, "books", bookForm, adminBooks)
        );
      }

      if (name === "meditations") {
        adminMeditations.innerHTML = "";
        state.meditations.forEach((data) =>
          renderAdminRow(data, "meditations", meditationForm, adminMeditations)
        );
      }

      if (name === "posts") {
        adminPosts.innerHTML = "";
        state.posts.forEach((data) => renderAdminRow(data, "posts", postForm, adminPosts));
        rebuildBlog();
      }

      rebuildHero();
    });
  };

  listen("books");
  listen("meditations");
  listen("gallery");
  listen("posts");

  blogRefresh?.addEventListener("click", rebuildBlog);
};

const uploadFileIfNeeded = async (file) => {
  if (!file) return null;
  const storageRef = ref(storage, `gallery/${Date.now()}-${file.name}`);
  const snap = await uploadBytes(storageRef, file);
  return getDownloadURL(snap.ref);
};

const handleSubmit = (collectionName, form, needsUpload, key) => {
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("Inicia sesión con tu Google autorizado para publicar.");
      return;
    }
    const formData = new FormData(form);
    const payload = {
      title: formData.get("title"),
      url: formData.get("url") || null,
      cover: formData.get("cover") || null,
      author: formData.get("author") || currentUser?.email || null,
      category: formData.get("category") || null,
      priceMXN: safeNumber(formData.get("priceMXN")),
      priceUSD: safeNumber(formData.get("priceUSD")),
      discount: safeNumber(formData.get("discount")),
      description: formData.get("description") || null,
      createdAt: editingState[key] ? undefined : serverTimestamp(),
    };

    if (needsUpload) {
      const file = form.elements.namedItem("file")?.files?.[0];
      const uploadedUrl = await uploadFileIfNeeded(file);
      if (uploadedUrl) payload.url = uploadedUrl;
    }

    const docId = editingState[key];
    if (docId) {
      const sanitized = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== undefined)
      );
      await updateDoc(doc(db, collectionName, docId), sanitized);
    } else {
      await addDoc(collection(db, collectionName), payload);
    }
    resetForm(form, key);
  });
};

handleSubmit("books", bookForm, false, "books");
handleSubmit("meditations", meditationForm, false, "meditations");
handleSubmit("gallery", document.getElementById("gallery-form"), true, "gallery");
handleSubmit("posts", postForm, false, "posts");

renderCollections();

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  isAdmin = Boolean(user?.email === adminEmail);
  updateFormLock();
});

authButton?.addEventListener("click", async () => {
  if (isAdmin) {
    await signOut(auth);
  } else {
    await signInWithPopup(auth, provider);
  }
});

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
