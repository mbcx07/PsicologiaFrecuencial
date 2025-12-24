import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  setDoc,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
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
const defaultAuthor = "Moïses Beltrán Castro";
let currentUser = null;
let isAdmin = false;
let demoAdmin = false;
let useLocal = false;

const demoContent = {
  books: [
    {
      title: "Manual de Sintonía Verde",
      author: defaultAuthor,
      cover:
        "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      description: "Bitácora de ejercicios para elevar la vibración y cuidar tu mente.",
      priceMXN: 320,
      priceUSD: 18,
      discount: 10,
    },
  ],
  meditations: [
    {
      title: "Meditación de coherencia cardíaca",
      author: defaultAuthor,
      cover:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      description: "Audio guiado de 12 minutos para respirar y alinear el campo emocional.",
      priceMXN: 120,
      priceUSD: 8,
      discount: 0,
    },
  ],
  posts: [
    {
      title: "Cómo limpiar tu campo mental en 5 minutos",
      category: "Blog",
      url: "https://medium.com",
      cover:
        "https://images.unsplash.com/photo-1520525003242-7c0b3c05f7f2?auto=format&fit=crop&w=1200&q=80",
      description: "Rutina express para desintoxicar pensamientos y recalibrar tu mente.",
      author: defaultAuthor,
    },
    {
      title: "Física cuántica aplicada a la sanación",
      category: "Investigación",
      url: "https://dev.to",
      cover:
        "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
      description: "Conceptos básicos para entender la intención como frecuencia creadora.",
      author: defaultAuthor,
    },
  ],
  gallery: [
    {
      title: "Sala de terapia frecuencial",
      url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
      description: "Ambiente de consulta con tonos verdes y luz cálida.",
    },
  ],
};

const localState = (() => {
  try {
    const stored = localStorage.getItem("pf-local-state");
    if (stored) return JSON.parse(stored);
  } catch (err) {
    console.warn("No se pudo leer localStorage", err);
  }
  return structuredClone(demoContent);
})();

const firebaseStatus = document.getElementById("firebase-status");
const mpStatus = document.getElementById("mp-status");
const galleryList = document.getElementById("gallery-list");
const siteVerificationInput = document.getElementById("site-verification");
const siteConfigForm = document.getElementById("site-config-form");
const siteConfigStatus = document.getElementById("site-config-status");
const verificationMeta = document.querySelector("meta[name='google-site-verification']");
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
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".tab-panel");
const toast = document.getElementById("toast");
const demoButton = document.createElement("button");

const siteConfigKey = "pf-site-config";
const defaultSiteConfig = { googleSiteVerification: "" };

let siteConfig = (() => {
  try {
    const stored = localStorage.getItem(siteConfigKey);
    if (stored) return { ...defaultSiteConfig, ...JSON.parse(stored) };
  } catch (err) {
    console.warn("No se pudo leer la configuración local", err);
  }
  return { ...defaultSiteConfig };
})();

demoButton.className = "btn btn--ghost";
demoButton.type = "button";
demoButton.id = "demo-button";
demoButton.textContent = "Modo demo";
authButton?.parentNode?.insertBefore(demoButton, authButton.nextSibling);

firebaseStatus.textContent = "Firebase listo";
firebaseStatus.classList.add("chip--success");
heroCover.src = placeholderCover;
heroCover.classList.add("cover--empty");

const persistSiteConfig = () => {
  try {
    localStorage.setItem(siteConfigKey, JSON.stringify(siteConfig));
  } catch (err) {
    console.warn("No se pudo persistir config", err);
  }
};

const applyVerificationToken = (token, source = "local") => {
  if (verificationMeta) {
    verificationMeta.setAttribute("content", token || "");
  }
  if (siteVerificationInput) {
    siteVerificationInput.value = token || "";
  }
  if (siteConfigStatus) {
    siteConfigStatus.textContent = token
      ? `Activo (${source})`
      : `Vacío (${source})`;
    siteConfigStatus.classList.toggle("chip--warning", !token);
    siteConfigStatus.classList.add("chip--outline");
  }
};
heroPrices.style.display = "none";

const persistLocalState = () => {
  try {
    localStorage.setItem("pf-local-state", JSON.stringify(localState));
  } catch (err) {
    console.warn("No se pudo guardar el estado local", err);
  }
};

const showToast = (message, tone = "success") => {
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast toast--${tone} visible`;
  setTimeout(() => {
    toast.classList.remove("visible");
  }, 2600);
};

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

const state = {
  books: [],
  meditations: [],
  posts: [],
  gallery: [],
};

const seedDemoContent = async () => {
  try {
    const collections = Object.keys(demoContent);
    for (const key of collections) {
      const snap = await getDocs(collection(db, key));
      if (snap.empty) {
        await Promise.all(
          demoContent[key].map((item) =>
            addDoc(collection(db, key), { ...item, createdAt: serverTimestamp() })
          )
        );
        showToast(`Demo cargada para ${key}`, "success");
      }
    }
  } catch (err) {
    console.error("No se pudo sembrar contenido demo", err);
    showToast("Error cargando demo", "error");
  }
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
      <span class="chip chip--outline">${data.author || defaultAuthor}</span>
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
      <span class="chip">${data.author || defaultAuthor}</span>
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
    <div class="author">${data.author || defaultAuthor}</div>
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
    await deleteEntry(collectionKey, data.id);
    showToast("Eliminado", "success");
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

const setActiveTab = (key) => {
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === key);
  });
  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === key);
  });
};
tabs.forEach((tab) =>
  tab.addEventListener("click", () => setActiveTab(tab.dataset.tab))
);
setActiveTab("libros");

const updateFormLock = () => {
  const reason = isAdmin
    ? "Modo edición"
    : "Solo lectura · Inicia sesión con tu Google autorizado";
  const label = demoAdmin ? "Admin demo" : `Admin: ${currentUser?.email}`;
  authStatus.textContent = isAdmin ? label : reason;
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

const activateDemoAdmin = () => {
  demoAdmin = true;
  isAdmin = true;
  currentUser = { email: adminEmail };
  switchToLocal("Vista previa sin autenticación");
  updateFormLock();
  showToast("Modo demo admin activo", "success");
};

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

const switchToLocal = (reason) => {
  if (useLocal) return;
  useLocal = true;
  firebaseStatus.textContent = `Modo demo local · ${reason || "Sin Firebase"}`;
  firebaseStatus.classList.remove("chip--success");
  firebaseStatus.classList.add("chip--warning");
  Object.entries(localState).forEach(([key, items]) => updateState(key, items));
  applyVerificationToken(siteConfig.googleSiteVerification || "", "demo");
  showToast("Modo demo activado con datos falsos", "success");
};

const ensureLocalIds = () => {
  Object.keys(localState).forEach((key) => {
    localState[key] = mapWithIds(localState[key] || [], key);
  });
  persistLocalState();
};
ensureLocalIds();

const preloadDemoView = () => {
  firebaseStatus.textContent = "Demo visible mientras carga Firebase";
  firebaseStatus.classList.add("chip--outline");
  Object.entries(localState).forEach(([key, items]) => updateState(key, items));
};

const loadSiteConfig = async () => {
  applyVerificationToken(siteConfig.googleSiteVerification || "", "local");
  try {
    const snap = await getDoc(doc(db, "config", "site"));
    const token = snap.data()?.googleSiteVerification || siteConfig.googleSiteVerification || "";
    siteConfig.googleSiteVerification = token;
    persistSiteConfig();
    applyVerificationToken(token, snap.exists() ? "Firebase" : "local");
  } catch (err) {
    console.error("No se pudo cargar la configuración del sitio", err);
    applyVerificationToken(siteConfig.googleSiteVerification || "", "demo");
    if (siteConfigStatus) siteConfigStatus.textContent = "Demo local";
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
  heroAuthor.textContent = latest.author || defaultAuthor;
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

const deleteEntry = async (collectionKey, id) => {
  if (useLocal) {
    localState[collectionKey] = (localState[collectionKey] || []).filter(
      (item) => item.id !== id
    );
    persistLocalState();
    updateState(collectionKey, localState[collectionKey]);
    return;
  }
  await deleteDoc(doc(db, collectionKey, id));
};

const renderEmptyCard = (container, message) => {
  const empty = document.createElement("article");
  empty.className = "blog-card ghost";
  empty.innerHTML = message;
  container.appendChild(empty);
};

const mapWithIds = (items, key) =>
  items.map((item, idx) => ({
    ...item,
    id: item.id || `${key}-${Date.now()}-${idx}`,
    category: key,
  }));

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

const rebuildGallery = () => {
  galleryList.innerHTML = "";
  if (!state.gallery.length) {
    renderEmptyCard(
      galleryList,
      "Sube imágenes en la pestaña Zona test y se verán aquí con su descripción."
    );
    return;
  }
  state.gallery
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .forEach((item) => galleryList.appendChild(renderGalleryCard(item)));
};

const rebuildStorefronts = () => {
  [
    { name: "books", container: sections.books, empty: "libros" },
    { name: "meditations", container: sections.meditations, empty: "audios" },
  ].forEach(({ name, container, empty }) => {
    container.innerHTML = "";
    if (!state[name].length) {
      renderEmptyCard(
        container,
        `Sin ${empty} aún. Usa el panel de admin para cargarlos en vivo.`
      );
      return;
    }
    state[name].forEach((data) => container.appendChild(renderResourceCard(data)));
  });
};

const rebuildAdminLists = () => {
  adminBooks.innerHTML = "";
  adminMeditations.innerHTML = "";
  adminPosts.innerHTML = "";

  state.books.forEach((data) => renderAdminRow(data, "books", bookForm, adminBooks));
  state.meditations.forEach((data) =>
    renderAdminRow(data, "meditations", meditationForm, adminMeditations)
  );
  state.posts.forEach((data) => renderAdminRow(data, "posts", postForm, adminPosts));
};

const rebuildEverything = () => {
  rebuildHero();
  rebuildStorefronts();
  rebuildBlog();
  rebuildGallery();
  rebuildAdminLists();
};

const updateState = (name, items) => {
  state[name] = mapWithIds(items, name).sort(
    (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
  );
  rebuildEverything();
};

const renderCollections = () => {
  const listen = (name) => {
    onSnapshot(
      collection(db, name),
      (snapshot) => {
        const docs = snapshot.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.id,
          category: name,
        }));
        updateState(name, docs);
      },
      (err) => {
        console.warn(`Snapshot ${name} falló, usando modo local`, err);
        switchToLocal(`Sin permisos de lectura en ${name}`);
      }
    );
  };

  listen("books");
  listen("meditations");
  listen("gallery");
  listen("posts");

  blogRefresh?.addEventListener("click", () => {
    rebuildBlog();
    showToast("Blog actualizado", "success");
  });
};

const uploadFileIfNeeded = async (file) => {
  if (!file) return null;
  const storageRef = ref(storage, `gallery/${Date.now()}-${file.name}`);
  const snap = await uploadBytes(storageRef, file);
  return getDownloadURL(snap.ref);
};

const handleSubmit = (collectionName, form, needsUpload, key) => {
  const friendly = {
    books: "Libro",
    meditations: "Meditación",
    posts: "Entrada",
    gallery: "Imagen",
  };
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast("Inicia sesión con tu Google autorizado para publicar.", "error");
      return;
    }
    try {
      const formData = new FormData(form);
      const payload = {
        title: formData.get("title"),
        url: formData.get("url") || null,
        cover: formData.get("cover") || null,
        author: formData.get("author") || currentUser?.email || defaultAuthor,
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
      if (useLocal) {
        if (docId) {
          localState[collectionName] = (localState[collectionName] || []).map((item) =>
            item.id === docId ? { ...item, ...payload, id: docId } : item
          );
          showToast(`${friendly[collectionName] || "Elemento"} actualizado`, "success");
        } else {
          const id = `${collectionName}-${Date.now()}`;
          localState[collectionName] = [
            { ...payload, id, createdAt: { seconds: Date.now() / 1000 } },
            ...(localState[collectionName] || []),
          ];
          showToast(`${friendly[collectionName] || "Elemento"} publicado`, "success");
        }
        persistLocalState();
        updateState(collectionName, localState[collectionName]);
      } else {
        if (docId) {
          const sanitized = Object.fromEntries(
            Object.entries(payload).filter(([, v]) => v !== undefined)
          );
          await updateDoc(doc(db, collectionName, docId), sanitized);
          showToast(`${friendly[collectionName] || "Elemento"} actualizado`, "success");
        } else {
          await addDoc(collection(db, collectionName), payload);
          showToast(`${friendly[collectionName] || "Elemento"} publicado`, "success");
        }
      }
      resetForm(form, key);
    } catch (err) {
      console.error(err);
      showToast("Error guardando", "error");
      switchToLocal("Guardado bloqueado en Firebase");
    }
  });
};

handleSubmit("books", bookForm, false, "books");
handleSubmit("meditations", meditationForm, false, "meditations");
handleSubmit("gallery", document.getElementById("gallery-form"), true, "gallery");
handleSubmit("posts", postForm, false, "posts");

siteConfigForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!isAdmin && !demoAdmin) {
    showToast("Inicia sesión con Google o activa modo demo para guardar", "error");
    return;
  }
  const token = siteVerificationInput?.value.trim() || "";
  siteConfig.googleSiteVerification = token;
  persistSiteConfig();
  applyVerificationToken(token, useLocal || demoAdmin ? "demo" : "Firebase");

  if (useLocal || demoAdmin) {
    showToast("Token guardado en modo demo/local", "success");
    return;
  }

  try {
    await setDoc(
      doc(db, "config", "site"),
      { googleSiteVerification: token, updatedAt: serverTimestamp() },
      { merge: true }
    );
    showToast("google-site-verification guardado", "success");
  } catch (err) {
    console.error(err);
    showToast("No se pudo guardar en Firebase; usando modo demo", "error");
    switchToLocal("Config no guardada");
  }
});

preloadDemoView();
renderCollections();
seedDemoContent();
loadSiteConfig();

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  isAdmin = Boolean(user?.email === adminEmail);
  demoAdmin = false;
  updateFormLock();
  if (user && isAdmin) {
    showToast("Acceso admin activo", "success");
  } else if (user && !isAdmin) {
    showToast("Cuenta sin permisos de edición", "error");
  } else {
    showToast("Sesión cerrada", "success");
  }
});

authButton?.addEventListener("click", async () => {
  if (demoAdmin) {
    demoAdmin = false;
    isAdmin = false;
    currentUser = null;
    updateFormLock();
    showToast("Modo demo cerrado", "success");
    return;
  }
  if (isAdmin) {
    await signOut(auth);
    return;
  } else {
    try {
      await signInWithPopup(auth, provider);
      showToast("Sesión iniciada", "success");
    } catch (err) {
      console.error(err);
      showToast("Error al iniciar sesión", "error");
    }
  }
});

demoButton?.addEventListener("click", activateDemoAdmin);

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
