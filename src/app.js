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
const highlightTitle = document.getElementById("highlight-title");
const highlightList = document.getElementById("highlight-list");

firebaseStatus.textContent = "Firebase listo";
firebaseStatus.classList.add("status--primary");

const resourceLists = {
  books: document.getElementById("book-list"),
  meditations: document.getElementById("meditation-list"),
  gallery: document.getElementById("gallery-list"),
};

const forms = {
  book: document.getElementById("book-form"),
  meditation: document.getElementById("meditation-form"),
  gallery: document.getElementById("gallery-form"),
};

const drawer = document.querySelector("[data-drawer]");
const openButtons = document.querySelectorAll("[data-open]");
const closeButton = document.querySelector("[data-close]");
openButtons.forEach((btn) => btn.addEventListener("click", () => drawer.scrollIntoView({ behavior: "smooth" })));
closeButton?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

const renderLinkCard = (data) => {
  const li = document.createElement("li");
  li.className = "resource-item";
  li.innerHTML = `
    <h4>${data.title ?? "Sin título"}</h4>
    ${data.description ? `<p>${data.description}</p>` : ""}
    ${data.url ? `<a href="${data.url}" target="_blank" rel="noopener">Abrir</a>` : ""}
  `;
  return li;
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

const updateHighlights = (items) => {
  highlightList.innerHTML = "";
  if (!items.length) {
    highlightList.innerHTML = '<li class="mini-item">Carga tus recursos en el panel y se mostrarán aquí automáticamente.</li>';
    return;
  }
  const sorted = [...items].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 4);
  highlightTitle.textContent = "Selección recién cargada";
  sorted.forEach((item) => {
    const li = document.createElement("li");
    li.className = "mini-item";
    li.textContent = `${item.title ?? "Recurso"} · ${item.category}`;
    highlightList.appendChild(li);
  });
};

const listenCollection = (name, renderer) => {
  const col = collection(db, name);
  const items = [];
  onSnapshot(col, (snapshot) => {
    const listEl = resourceLists[name];
    listEl.innerHTML = "";
    items.length = 0;
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({ ...data, id: docSnap.id, category: name });
      listEl.appendChild(renderer(data));
    });
    updateHighlights(items);
  });
};

listenCollection("books", renderLinkCard);
listenCollection("meditations", renderLinkCard);
listenCollection("gallery", renderGalleryCard);

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

handleSubmit("books", forms.book, false);
handleSubmit("meditations", forms.meditation, false);
handleSubmit("gallery", forms.gallery, true);

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
