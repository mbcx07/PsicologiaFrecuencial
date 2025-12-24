import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
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
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const page = document.body.dataset.page || "home";
const adminEmail = "moises.beltranx7@gmail.com";
const mpPublicKey = "APP_USR-7d17980f-c2ee-47d1-990c-de2e3d4c4fc0";
const mp = new MercadoPago(mpPublicKey, { locale: "es-AR" });

const demoContent = {
  books: [
    {
      title: "Manual de Sintonía Verde",
      author: "Moïses Beltrán Castro",
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
      author: "Moïses Beltrán Castro",
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
      author: "Moïses Beltrán Castro",
    },
    {
      title: "Física cuántica aplicada a la sanación",
      category: "Investigación",
      url: "https://dev.to",
      cover:
        "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
      description: "Conceptos básicos para entender la intención como frecuencia creadora.",
      author: "Moïses Beltrán Castro",
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

let currentUser = null;
let isAdmin = false;

const qs = (id) => document.getElementById(id);
const heroCover = qs("hero-cover");
const heroTitle = qs("hero-title");
const heroDesc = qs("hero-desc");
const heroCategory = qs("hero-category");
const heroAuthor = qs("hero-author");
const heroPriceMXN = qs("hero-price-mxn");
const heroPriceUSD = qs("hero-price-usd");
const heroDiscount = qs("hero-discount");
const heroPrices = qs("hero-prices");
const mpStatus = qs("mp-status");
const firebaseStatus = qs("firebase-status");

const showStatus = (el, text, type = "info") => {
  if (!el) return;
  el.textContent = text;
  el.classList.remove("chip--success", "chip--warning", "chip--info");
  if (type === "success") el.classList.add("chip--success");
  else if (type === "warning") el.classList.add("chip--warning");
  else el.classList.add("chip--info");
};

const renderHero = (item) => {
  if (!heroCover || !item) return;
  heroCover.src = item.cover || "";
  heroTitle && (heroTitle.textContent = item.title || "");
  heroDesc && (heroDesc.textContent = item.description || "");
  heroCategory && (heroCategory.textContent = item.category || item.type || "");
  heroAuthor && (heroAuthor.textContent = item.author ? `Por ${item.author}` : "");
  heroPrices?.classList.toggle("hidden", !(item.priceMXN || item.priceUSD));
  if (heroPriceMXN) heroPriceMXN.textContent = item.priceMXN ? `$${item.priceMXN} MXN` : "";
  if (heroPriceUSD) heroPriceUSD.textContent = item.priceUSD ? `$${item.priceUSD} USD` : "";
  heroDiscount?.classList.toggle("pill--hidden", !item.discount);
  if (heroDiscount) heroDiscount.textContent = item.discount ? `-${item.discount}%` : "";
};

const renderCards = (container, list = [], emptyText) => {
  if (!container) return;
  if (!list.length) {
    container.innerHTML = `<p class="muted">${emptyText}</p>`;
    return;
  }
  container.innerHTML = list
    .map(
      (item) => `
        <article class="card">
          <div class="cover-frame"><img src="${item.cover || ""}" alt="${
        item.title || "Item"
      }"></div>
          <div class="card-body">
            <p class="eyebrow">${item.category || item.author || ""}</p>
            <h3>${item.title || ""}</h3>
            <p class="muted">${item.description || ""}</p>
            ${item.priceMXN || item.priceUSD ? `<div class="price-row">${
        item.priceMXN ? `<div class="price">$${item.priceMXN} MXN</div>` : ""
      }${item.priceUSD ? `<div class="price price--muted">$${
        item.priceUSD
      } USD</div>` : ""}</div>` : ""}
            ${item.url ? `<a class="btn btn--ghost" href="${
        item.url
      }" target="_blank" rel="noreferrer">Abrir</a>` : ""}
          </div>
        </article>
      `
    )
    .join("");
};

const renderBlog = (listEl, gridEl, posts) => {
  if (listEl) {
    listEl.innerHTML = posts
      .slice(0, 3)
      .map(
        (post) => `
        <article class="card card--row">
          <div class="cover-frame"><img src="${post.cover || ""}" alt="${
          post.title
        }"></div>
          <div class="card-body">
            <p class="eyebrow">${post.category || "Blog"}</p>
            <h3>${post.title}</h3>
            <p class="muted">${post.description || ""}</p>
            <a class="btn btn--ghost" href="${post.url}" target="_blank" rel="noreferrer">Leer</a>
          </div>
        </article>
      `
      )
      .join("");
  }
  if (gridEl) {
    gridEl.innerHTML = posts
      .map(
        (post) => `
        <article class="card">
          <div class="cover-frame"><img src="${post.cover || ""}" alt="${
          post.title
        }"></div>
          <div class="card-body">
            <p class="eyebrow">${post.category || "Blog"}</p>
            <h3>${post.title}</h3>
            <p class="muted">${post.description || ""}</p>
            <a class="btn btn--ghost" href="${post.url}" target="_blank" rel="noreferrer">Leer</a>
          </div>
        </article>
      `
      )
      .join("");
  }
};

const renderAdminList = (container, items, collectionName) => {
  if (!container) return;
  if (!items.length) {
    container.innerHTML = `<p class="muted">Sin registros.</p>`;
    return;
  }
  container.innerHTML = items
    .map(
      (item) => `
      <div class="admin-row">
        <div>
          <p class="eyebrow">${item.author || item.category || collectionName}</p>
          <strong>${item.title}</strong>
          <p class="muted">${item.description || ""}</p>
        </div>
        <div class="row-actions">
          <a class="chip" href="${item.url || "#"}" target="_blank" rel="noreferrer">Ver</a>
          <button class="chip chip--warning" data-id="${item.id}" data-collection="${collectionName}">Eliminar</button>
        </div>
      </div>
    `
    )
    .join("");
};

const hydrateFromFirestore = async (collectionName, onData, fallback = []) => {
  try {
    return onSnapshot(collection(db, collectionName), (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(items.length ? items : fallback);
    });
  } catch (err) {
    console.warn(`No se pudo leer ${collectionName}, usando demo`, err);
    onData(fallback);
    return null;
  }
};

const initHero = () => {
  if (!heroCover) return;
  const collectionName =
    page === "meditations" ? "meditations" : page === "blog" ? "posts" : "books";
  const fallback =
    collectionName === "meditations"
      ? demoContent.meditations
      : collectionName === "posts"
      ? demoContent.posts
      : demoContent.books;

  hydrateFromFirestore(
    collectionName,
    (items) => {
      const item = items[0] || fallback[0];
      const categoryLabel =
        collectionName === "meditations" ? "Meditación" : collectionName === "posts" ? "Entrada" : "Libro";
      renderHero({ ...item, category: categoryLabel });
    },
    fallback
  );
};

const initBooks = () => {
  const cards = qs("book-cards");
  const adminList = qs("admin-books");
  hydrateFromFirestore(
    "books",
    (items) => {
      renderCards(cards, items, "Carga un libro para verlo aquí.");
      renderAdminList(adminList, items, "books");
    },
    demoContent.books
  );
};

const initMeditations = () => {
  const cards = qs("meditation-cards");
  const adminList = qs("admin-meditations");
  hydrateFromFirestore(
    "meditations",
    (items) => {
      renderCards(cards, items, "Añade una meditación para verla aquí.");
      renderAdminList(adminList, items, "meditations");
    },
    demoContent.meditations
  );
};

const initBlog = () => {
  const list = qs("blog-list");
  const grid = qs("blog-stream");
  const adminList = qs("admin-posts");
  hydrateFromFirestore(
    "posts",
    (items) => {
      renderBlog(list, grid, items.length ? items : demoContent.posts);
      renderAdminList(adminList, items, "posts");
    },
    demoContent.posts
  );
};

const initGallery = () => {
  const gallery = qs("gallery-list");
  hydrateFromFirestore(
    "gallery",
    (items) => {
      if (!gallery) return;
      if (!items.length) {
        gallery.innerHTML = `<p class="muted">Sube imágenes para verlas aquí.</p>`;
        return;
      }
      gallery.innerHTML = items
        .map(
          (item) => `
          <figure class="gallery-card">
            <img src="${item.url}" alt="${item.title}">
            <figcaption>${item.title}</figcaption>
          </figure>
        `
        )
        .join("");
    },
    demoContent.gallery
  );
};

const initWallet = () => {
  const walletContainer = qs("wallet_container");
  if (!walletContainer) return;
  try {
    return onSnapshot(doc(db, "config", "payment"), (snap) => {
      const data = snap.data();
      const preferenceId = data?.preferenceId;
      if (!preferenceId) {
        showStatus(mpStatus, "Agrega preferenceId en config/payment", "warning");
        walletContainer.innerHTML = "";
        return;
      }
      mp.bricks().create("wallet", "wallet_container", { initialization: { preferenceId } });
      showStatus(mpStatus, "Wallet listo", "success");
    });
  } catch (err) {
    showStatus(mpStatus, "No se pudo cargar wallet", "warning");
  }
};

const handleAuth = () => {
  const authStatus = qs("auth-status");
  const authButton = qs("auth-button");
  if (!authButton) return;

  const setState = (user) => {
    currentUser = user;
    isAdmin = !!user && user.email === adminEmail;
    authStatus &&
      (authStatus.textContent = isAdmin
        ? `Admin: ${user.displayName || user.email}`
        : "Solo lectura");
    authButton.textContent = user ? "Salir" : "Ingresar con Google";
    document.body.classList.toggle("admin-enabled", isAdmin);
  };

  authButton.addEventListener("click", async () => {
    if (currentUser) {
      await signOut(auth);
      return;
    }
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("No se pudo iniciar sesión", err);
    }
  });

  onAuthStateChanged(auth, (user) => setState(user));
};

const wireForm = (formId, collectionName) => {
  const form = qs(formId);
  if (!form) return;
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (!isAdmin) {
      alert("Solo el administrador puede publicar.");
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    data.priceMXN = data.priceMXN ? Number(data.priceMXN) : undefined;
    data.priceUSD = data.priceUSD ? Number(data.priceUSD) : undefined;
    data.discount = data.discount ? Number(data.discount) : undefined;
    data.createdAt = serverTimestamp();
    try {
      await addDoc(collection(db, collectionName), data);
      form.reset();
    } catch (err) {
      console.error("No se pudo guardar", err);
      alert("Error guardando en Firebase");
    }
  });
};

const wireGalleryForm = () => {
  const form = qs("gallery-form");
  if (!form) return;
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (!isAdmin) {
      alert("Solo el administrador puede publicar.");
      return;
    }
    const data = new FormData(form);
    const file = data.get("file");
    let url = data.get("url");
    if (file && file.size) {
      const storageRef = ref(storage, `gallery/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      url = await getDownloadURL(storageRef);
    }
    const payload = {
      title: data.get("title"),
      description: data.get("description"),
      url,
      createdAt: serverTimestamp(),
    };
    if (!payload.url) {
      alert("Proporciona un archivo o URL");
      return;
    }
    try {
      await addDoc(collection(db, "gallery"), payload);
      form.reset();
    } catch (err) {
      console.error("No se pudo subir imagen", err);
    }
  });
};

const wireAdminDeletes = () => {
  document.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("button[data-collection]");
    if (!btn || !isAdmin) return;
    const id = btn.dataset.id;
    const collectionName = btn.dataset.collection;
    if (!id) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err) {
      console.error("No se pudo eliminar", err);
    }
  });
};

const initPage = () => {
  showStatus(firebaseStatus, "Firebase listo", "success");
  handleAuth();
  initHero();

  if (page === "home") {
    initBooks();
    initMeditations();
    initBlog();
    initGallery();
  }
  if (page === "books") {
    initBooks();
    initWallet();
    initGallery();
  }
  if (page === "meditations") {
    initMeditations();
  }
  if (page === "blog") {
    initBlog();
  }
  if (page === "admin") {
    initBooks();
    initMeditations();
    initBlog();
    initGallery();
    wireForm("book-form", "books");
    wireForm("meditation-form", "meditations");
    wireForm("post-form", "posts");
    wireGalleryForm();
    wireAdminDeletes();
    initWallet();
  }
};

initPage();
