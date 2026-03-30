import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { Product, Order, GlobalCategory, GlobalDictionary } from '../types';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const auth = getAuth(app);

const PRODUCTS_COLLECTION = 'products';
const GLOBAL_CATEGORIES_COLLECTION = 'global_categories';
const GLOBAL_DICTIONARIES_COLLECTION = 'global_dictionaries';

// --- Auth helpers ---

export const loginAdmin = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const logoutAdmin = () => firebaseSignOut(auth);

export { onAuthStateChanged };
export type { User };

// --- Default Data for Seeding ---
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "bento_cake",
    name: "עוגת בנטו (Bento)",
    tiers: [
      { name: "Classic", price: 180, inheritedFields: [] },
      { name: "Plus", price: 210, inheritedFields: [] },
      { name: "Extra", price: 290, inheritedFields: [] }
    ],
    messageTemplate: "היי! הצעת מחיר לעוגת בנטו:\n{details}\nסה\"כ: {price} ₪\nאני זמינה לכל שאלה ❤️",
    categories: [
      {
        id: "cat_bento_size",
        name: "גודל וחבילה",
        type: "radio",
        options: [
          { id: "opt_bento_10", name: "קוטר 10 (זוגי) - בסיס", linkTier: 0 },
          { id: "opt_bento_12", name: "קוטר 12 (4 סועדים)", linkTier: 1 }
        ]
      },
      {
        id: "cat_bento_design",
        name: "עיצוב",
        type: "radio",
        options: [
          { id: "opt_bento_des_basic", name: "זילוף קצפת בסיסי (עד 2 צבעים)", linkTier: 0 },
          { id: "opt_bento_des_text", name: "כיתוב אישי + זילוף מורכב", linkTier: 1 },
          { id: "opt_bento_des_print", name: "דף סוכר / איירבראש", linkTier: 2 },
          { id: "opt_bento_des_sculpt", name: "פיסול בצק סוכר / פרחים", linkTier: 2 }
        ]
      },
      {
        id: "cat_bento_pack",
        name: "אריזה",
        type: "radio",
        options: [
          { id: "opt_bento_pack_std", name: "קופסה לבנה סטנדרטית", linkTier: 0 },
          { id: "opt_bento_pack_gift", name: "אריזת מתנה שקופה + סרט", linkTier: 1 },
          { id: "opt_bento_pack_balloon", name: "מארז עם בלון תואם", linkTier: 2 }
        ]
      }
    ]
  },
  {
    id: "designed_cake",
    name: "עוגות מעוצבות (Designed)",
    tiers: [
      { name: "Mini", price: 450, inheritedFields: [] },
      { name: "Classic", price: 520, inheritedFields: [] },
      { name: "Extra", price: 700, inheritedFields: [] }
    ],
    messageTemplate: "היי, הנה פרטי העוגה המעוצבת שבחרנו:\n{details}\nסה\"כ לתשלום: {price} ₪",
    categories: [
      {
        id: "cat_des_size",
        name: "גודל העוגה",
        type: "radio",
        options: [
          { id: "opt_des_18_2", name: "קוטר 18, שתי שכבות (כ-15 סועדים)", linkTier: 0 },
          { id: "opt_des_18_3", name: "קוטר 18, שלוש שכבות (כ-25 סועדים)", linkTier: 1 },
          { id: "opt_des_22_3", name: "קוטר 22, שלוש שכבות (כ-35 סועדים)", linkTier: 2 }
        ]
      },
      {
        id: "cat_des_complex",
        name: "מורכבות עיצוב",
        type: "radio",
        options: [
          { id: "opt_des_comp_basic", name: "עיטורים בסיסיים (עד 2 צבעים)", linkTier: 0 },
          { id: "opt_des_comp_mid", name: "איירבראש / נצנצים / פנינים", linkTier: 1 },
          { id: "opt_des_comp_full", name: "דף סוכר / עיצוב אישי מלא", linkTier: 2 }
        ]
      },
      {
        id: "cat_des_addons",
        name: "תוספות מיוחדות לחבילה",
        type: "checkbox",
        options: [
          { id: "opt_des_gift", name: "כולל מארז קאפקייקס/בנטו מתנה (כלול ב-Extra)", linkTier: 2 }
        ]
      }
    ]
  },
  {
    id: "workshop",
    name: "סדנאות (מחיר למשתתפת)",
    tiers: [
      { name: "Basic", price: 215, inheritedFields: [] },
      { name: "Classic", price: 260, inheritedFields: [] },
      { name: "Premium", price: 320, inheritedFields: [] }
    ],
    messageTemplate: "פרטים על הסדנה:\n{details}\nמחיר למשתתפת (כולל מע\"מ): {price} ₪\n*מינימום משתתפות בהתאם לחבילה*",
    categories: [
      {
        id: "cat_ws_type",
        name: "סוג הסדנה",
        type: "radio",
        options: [
          { id: "opt_ws_basic", name: "בייסיק 🎂 (מינימום 10)", linkTier: 0 },
          { id: "opt_ws_classic", name: "קלאסיק ⭐ (מינימום 8)", linkTier: 1 },
          { id: "opt_ws_prem", name: "פרימיום ✨ (מינימום 6)", linkTier: 2 }
        ]
      },
      {
        id: "cat_ws_addons",
        name: "שדרוגים",
        type: "checkbox",
        options: [
          { id: "opt_ws_ceremony", name: "טקס עוגה מעוצבת בסיום (תוספת תשלום)", linkTier: -1, manualPrice: 0 }
        ]
      }
    ]
  }
];

// --- Service Functions ---

export const generateUUID = () => {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Generates a human-friendly order ID, e.g. "AY-300326-1430" (30 Mar 2026, 14:30)
// or "AY-300326-517" (5:17 — no leading zero on hours).
// Used as both the Firestore document ID and the display code.
export const generateOrderId = (): string => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const h = String(now.getHours());            // no leading zero
  const min = String(now.getMinutes()).padStart(2, '0');
  return `AY-${dd}${mm}${yy}-${h}${min}`;
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push(doc.data() as Product);
    });

    if (products.length === 0) {
      console.log('Seeding default data to Firestore...');
      for (const p of DEFAULT_PRODUCTS) {
        await setDoc(doc(db, PRODUCTS_COLLECTION, p.id), p);
      }
      return DEFAULT_PRODUCTS;
    }

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const saveProductToFirestore = async (product: Product): Promise<void> => {
  // JSON round-trip strips undefined values, which Firestore does not accept
  const clean = JSON.parse(JSON.stringify(product));
  await setDoc(doc(db, PRODUCTS_COLLECTION, product.id), clean);
};

export const deleteProductFromFirestore = async (productId: string): Promise<void> => {
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
};

// ─── Global Categories ────────────────────────────────────────────────────────

export const fetchGlobalCategories = async (): Promise<GlobalCategory[]> => {
  try {
    const snap = await getDocs(collection(db, GLOBAL_CATEGORIES_COLLECTION));
    return snap.docs.map(d => d.data() as GlobalCategory);
  } catch (error) {
    console.error("Error fetching global categories:", error);
    return [];
  }
};

export const saveGlobalCategoryToFirestore = async (gc: GlobalCategory): Promise<void> => {
  const clean = JSON.parse(JSON.stringify(gc));
  await setDoc(doc(db, GLOBAL_CATEGORIES_COLLECTION, gc.id), clean);
};

export const deleteGlobalCategoryFromFirestore = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, GLOBAL_CATEGORIES_COLLECTION, id));
};

// ─── Global Dictionaries ──────────────────────────────────────────────────────

export const fetchGlobalDictionaries = async (): Promise<GlobalDictionary[]> => {
  try {
    const snap = await getDocs(collection(db, GLOBAL_DICTIONARIES_COLLECTION));
    return snap.docs.map(d => d.data() as GlobalDictionary);
  } catch (error) {
    console.error("Error fetching global dictionaries:", error);
    return [];
  }
};

export const saveGlobalDictionaryToFirestore = async (dict: GlobalDictionary): Promise<void> => {
  const clean = JSON.parse(JSON.stringify(dict));
  await setDoc(doc(db, GLOBAL_DICTIONARIES_COLLECTION, dict.id), clean);
};

export const deleteGlobalDictionaryFromFirestore = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, GLOBAL_DICTIONARIES_COLLECTION, id));
};

// ─── Orders ───────────────────────────────────────────────────────────────────

// Strips internalNotes from the main document — stored in the private sub-collection instead.
const toPublicOrderDoc = (order: Order): Omit<Order, 'internalNotes'> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { internalNotes: _notes, ...publicFields } = order;
  return publicFields;
};

export const saveOrderToFirestore = async (order: Order): Promise<void> => {
  const ordersCollection = collection(db, 'orders');

  if (!order.createdAt) {
    order.createdAt = new Date().toISOString();
  }

  const publicDoc = toPublicOrderDoc(order);

  if (order.id) {
    const orderRef = doc(ordersCollection, order.id);
    await setDoc(orderRef, publicDoc);
    await setDoc(doc(orderRef, 'private', 'data'), { internalNotes: order.internalNotes ?? '' });
  } else {
    const newRef = await addDoc(ordersCollection, publicDoc);
    await setDoc(doc(newRef, 'private', 'data'), { internalNotes: order.internalNotes ?? '' });
  }
};

export const fetchOrders = async (): Promise<Order[]> => {
  const querySnapshot = await getDocs(collection(db, 'orders'));
  const orders: Order[] = [];

  await Promise.all(
    querySnapshot.docs.map(async (orderDoc) => {
      const order = orderDoc.data() as Order;
      try {
        const privateSnap = await getDoc(doc(db, 'orders', orderDoc.id, 'private', 'data'));
        if (privateSnap.exists()) {
          order.internalNotes = (privateSnap.data() as { internalNotes: string }).internalNotes;
        }
      } catch {
        // Private doc missing — not fatal
      }
      orders.push(order);
    })
  );

  return orders;
};

export const fetchOrderById = async (orderId: string): Promise<Order | null> => {
  const snap = await getDoc(doc(db, 'orders', orderId));
  if (!snap.exists()) return null;
  return snap.data() as Order;
};

export const deleteOrderFromFirestore = async (orderId: string): Promise<void> => {
  await deleteDoc(doc(db, 'orders', orderId, 'private', 'data'));
  await deleteDoc(doc(db, 'orders', orderId));
};
