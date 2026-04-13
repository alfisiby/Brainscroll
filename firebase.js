// ============================================================
// firebase.js — Firebase layer (Auth + Firestore)
// All Firebase operations are exported from here.
// app.js imports and calls these — never touches Firebase directly.
// ============================================================

// CDN version — if you see import errors, check the latest version at:
// https://firebase.google.com/docs/web/setup#available-libraries
// Then update the version string in the three import URLs below.

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where }
  from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// ── Config (safe to expose — security comes from Firestore rules) ──
const firebaseConfig = {
  apiKey:            "AIzaSyCu8Lmxmj7jWt1vPQVlMDk5UG5Wv1Du15Q",
  authDomain:        "task-manager-2382f.firebaseapp.com",
  projectId:         "task-manager-2382f",
  storageBucket:     "task-manager-2382f.firebasestorage.app",
  messagingSenderId: "841718620802",
  appId:             "1:841718620802:web:0754e30817ea748b480a9b",
};

const _app = initializeApp(firebaseConfig);
export const auth = getAuth(_app);
export const db   = getFirestore(_app);

// ============================================================
// AUTH
// ============================================================

export const fbSignIn    = (email, pw) => signInWithEmailAndPassword(auth, email, pw);
export const fbSignOut   = ()          => signOut(auth);
export const onAuthChange = cb         => onAuthStateChanged(auth, cb);

// ============================================================
// HELPERS
// ============================================================

// Convert Firestore Timestamp (or Date) to ISO string
function tsToIso(ts) {
  if (!ts)        return new Date().toISOString();
  if (ts.toDate)  return ts.toDate().toISOString();
  return new Date(ts).toISOString();
}

// ============================================================
// PRODUCTS  — /products/{productId}
// ============================================================

export async function loadProducts() {
  const snap = await getDocs(collection(db, 'products'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveProduct(product) {
  await setDoc(doc(db, 'products', product.id), {
    name:        product.name,
    colourIndex: product.colourIndex,
  });
}

// ============================================================
// SECTIONS  — /sections/{sectionId}
// (flat collection — easier to query than nested subcollections)
// ============================================================

export async function loadSections() {
  const snap = await getDocs(collection(db, 'sections'));
  const result = {};
  snap.docs.forEach(d => {
    const data = { id: d.id, ...d.data() };
    if (!result[data.productId]) result[data.productId] = [];
    result[data.productId].push(data);
  });
  // Sort each product's sections by their order field
  Object.keys(result).forEach(pid => {
    result[pid].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  });
  return result;
}

export async function saveSection(section) {
  await setDoc(doc(db, 'sections', section.id), {
    productId:  section.productId,
    name:       section.name,
    order:      section.order ?? 0,
    shareToken: section.shareToken ?? null,
  });
}

export async function updateSectionToken(sectionId, token) {
  await updateDoc(doc(db, 'sections', sectionId), { shareToken: token });
}

export async function deleteSectionDoc(sectionId) {
  await deleteDoc(doc(db, 'sections', sectionId));
}

// ============================================================
// CARDS  — /cards/{cardId}
// ============================================================

function cardToFirestore(card) {
  return {
    productId:     card.productId,
    section:       card.section,
    title:         card.title,
    body:          card.body,
    priority:      card.priority,
    status:        card.status,
    attachmentUrl: card.attachmentUrl ?? null,
    shareToken:    card.shareToken    ?? null,
    createdAt:     card.createdAt ? new Date(card.createdAt) : serverTimestamp(),
    updatedAt:     serverTimestamp(),
  };
}

function cardFromFirestore(d) {
  const data = d.data ? d.data() : d; // handle both DocumentSnapshot and plain object
  const id   = d.id || data.id;
  return {
    ...data,
    id,
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}

export async function loadCards() {
  const snap = await getDocs(collection(db, 'cards'));
  return snap.docs.map(cardFromFirestore);
}

export async function saveCard(card) {
  await setDoc(doc(db, 'cards', card.id), cardToFirestore(card));
}

export async function updateCardFields(cardId, fields) {
  await updateDoc(doc(db, 'cards', cardId), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCardDoc(cardId) {
  await deleteDoc(doc(db, 'cards', cardId));
}

export async function updateCardToken(cardId, token) {
  await updateDoc(doc(db, 'cards', cardId), { shareToken: token });
}

export async function getCardDoc(cardId) {
  const snap = await getDoc(doc(db, 'cards', cardId));
  if (!snap.exists()) return null;
  return cardFromFirestore(snap);
}

// Load cards for a specific product+section (for board viewer — no auth required)
export async function loadBoardCards(productId, sectionName) {
  const q    = query(collection(db, 'cards'), where('productId', '==', productId));
  const snap = await getDocs(q);
  return snap.docs
    .map(cardFromFirestore)
    .filter(c => c.section === sectionName);
}

// ============================================================
// SHARE LINKS  — /shareLinks/{token}
// Public read (no auth required) — write requires auth
// ============================================================

export async function createShareLink(token, data) {
  await setDoc(doc(db, 'shareLinks', token), data);
}

export async function getShareLink(token) {
  const snap = await getDoc(doc(db, 'shareLinks', token));
  return snap.exists() ? snap.data() : null;
}
