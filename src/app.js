import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  getDoc,
  doc,
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

const firebaseStatus = document.querySelector("#firebase-status");
const mpStatus = document.querySelector("#mp-status");

let db;
let storage;

function setStatus(el, text, state = "pending") {
  el.textContent = text;
  el.className = `status status--${state}`;
}

function renderList(listEl, items, type) {
  listEl.innerHTML = "";

  if (!items.length) {
    listEl.innerHTML = `<li class="list__item">Aún no hay ${type}. Agrega el primero.</li>`;
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "list__item";

    const title = document.createElement("h3");
    title.textContent = item.title;

    const desc = document.createElement("p");
    desc.textContent = item.description || "Sin descripción";

    if (item.url) {
      const link = document.createElement("a");
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = item.url;
      li.append(title, desc, link);
    } else {
      li.append(title, desc);
    }

    if (item.imageUrl) {
      const img = document.createElement("img");
      img.src = item.imageUrl;
      img.alt = item.title;
      img.loading = "lazy";
      img.style.maxWidth = "100%";
      img.style.borderRadius = "10px";
      img.style.marginTop = "8px";
      li.appendChild(img);
    }

    listEl.appendChild(li);
  });
}

async function handleFormSubmission(formEl, collectionName, extraHandler) {
  formEl.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(formEl);

    const payload = {
      title: formData.get("title"),
      url: formData.get("url"),
      description: formData.get("description"),
      createdAt: serverTimestamp(),
    };

    try {
      const enriched = extraHandler ? await extraHandler(payload, formData) : payload;
      await addDoc(collection(db, collectionName), enriched);
      formEl.reset();
    } catch (error) {
      alert(`No se pudo guardar: ${error.message}`);
    }
  });
}

async function setupRealtimeLists() {
  const bookList = document.querySelector("#book-list");
  const meditationList = document.querySelector("#meditation-list");
  const galleryList = document.querySelector("#gallery-list");

  onSnapshot(query(collection(db, "books"), orderBy("createdAt", "desc")), (snap) => {
    const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderList(bookList, items, "libros");
  });

  onSnapshot(query(collection(db, "meditations"), orderBy("createdAt", "desc")), (snap) => {
    const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderList(meditationList, items, "meditaciones");
  });

  onSnapshot(query(collection(db, "gallery"), orderBy("createdAt", "desc")), (snap) => {
    const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    renderList(galleryList, items, "imágenes");
  });
}

async function uploadFileIfNeeded(payload, formData) {
  const file = formData.get("file");
  const url = payload.url?.trim();

  if (file && file.size > 0) {
    const imageRef = ref(
      storage,
      `gallery/${Date.now()}-${file.name.replace(/\s+/g, "-")}`
    );
    await uploadBytes(imageRef, file);
    const downloadUrl = await getDownloadURL(imageRef);
    return { ...payload, imageUrl: downloadUrl, url: url || downloadUrl };
  }

  if (url) {
    return { ...payload, imageUrl: url };
  }

  throw new Error("Sube una imagen o proporciona una URL");
}

async function initMercadoPago() {
  try {
    const mp = new window.MercadoPago(
      "APP_USR-7d17980f-c2ee-47d1-990c-de2e3d4c4fc0",
      { locale: "es-AR" }
    );

    const paymentDoc = await getDoc(doc(db, "config", "payment"));
    const preferenceId = paymentDoc.exists() ? paymentDoc.data().preferenceId : null;

    if (!preferenceId) {
      setStatus(mpStatus, "Configura un preferenceId en Firestore (config/payment)", "pending");
      return;
    }

    const bricksBuilder = mp.bricks();
    await bricksBuilder.create("wallet", "wallet_container", {
      initialization: {
        preferenceId,
      },
      callbacks: {
        onError: (error) => {
          console.error("Mercado Pago error", error);
          setStatus(mpStatus, `Error en wallet: ${error?.message ?? error}`, "error");
        },
        onReady: () => setStatus(mpStatus, "Wallet lista con preferencia activa", "ok"),
      },
    });
  } catch (error) {
    console.error(error);
    setStatus(mpStatus, `No se pudo cargar Mercado Pago: ${error.message}`, "error");
  }
}

function initFirebase() {
  try {
    const app = initializeApp(firebaseConfig);
    getAnalytics(app);
    db = getFirestore(app);
    storage = getStorage(app);
    setStatus(firebaseStatus, "Firebase inicializado", "ok");
    return true;
  } catch (error) {
    console.error(error);
    setStatus(firebaseStatus, `No se pudo iniciar Firebase: ${error.message}`, "error");
    return false;
  }
}

function main() {
  if (!initFirebase()) return;

  handleFormSubmission(document.querySelector("#book-form"), "books");
  handleFormSubmission(document.querySelector("#meditation-form"), "meditations");
  handleFormSubmission(
    document.querySelector("#gallery-form"),
    "gallery",
    uploadFileIfNeeded
  );

  setupRealtimeLists();
  initMercadoPago();
}

main();
