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
import { Product, Order, GlobalCategory } from '../types';

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
      { name: "Classic", price: 180 },
      { name: "Plus", price: 210 },
      { name: "Extra", price: 290 }
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
      { name: "Mini", price: 450 },
      { name: "Classic", price: 520 },
      { name: "Extra", price: 700 }
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
      { name: "Basic", price: 215 },
      { name: "Classic", price: 260 },
      { name: "Premium", price: 320 }
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

const GLOBAL_CATEGORIES_COLLECTION = 'global_categories';

export const fetchGlobalCategories = async (): Promise<GlobalCategory[]> => {
  const snap = await getDocs(collection(db, GLOBAL_CATEGORIES_COLLECTION));
  return snap.docs.map(d => d.data() as GlobalCategory);
};

export const saveGlobalCategoryToFirestore = async (gc: GlobalCategory): Promise<void> => {
  const clean = JSON.parse(JSON.stringify(gc));
  await setDoc(doc(db, GLOBAL_CATEGORIES_COLLECTION, gc.id), clean);
};

export const deleteGlobalCategoryFromFirestore = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, GLOBAL_CATEGORIES_COLLECTION, id));
};

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
    // Write public fields to the main document
    await setDoc(orderRef, publicDoc);
    // Write internalNotes to the private sub-collection (admin-only by Firestore rules)
    await setDoc(doc(orderRef, 'private', 'data'), { internalNotes: order.internalNotes ?? '' });
  } else {
    const newRef = await addDoc(ordersCollection, publicDoc);
    await setDoc(doc(newRef, 'private', 'data'), { internalNotes: order.internalNotes ?? '' });
  }
};

// Fetch all orders + their private notes (admin only — list permission required).
export const fetchOrders = async (): Promise<Order[]> => {
  const querySnapshot = await getDocs(collection(db, 'orders'));
  const orders: Order[] = [];

  await Promise.all(
    querySnapshot.docs.map(async (orderDoc) => {
      const order = orderDoc.data() as Order;
      // Fetch the private sub-document for internalNotes
      try {
        const privateSnap = await getDoc(doc(db, 'orders', orderDoc.id, 'private', 'data'));
        if (privateSnap.exists()) {
          order.internalNotes = (privateSnap.data() as { internalNotes: string }).internalNotes;
        }
      } catch {
        // If the private doc is missing, internalNotes stays undefined — not a fatal error
      }
      orders.push(order);
    })
  );

  return orders;
};

// Fetch a single order by ID (allowed for public users by Firestore rules).
// internalNotes is NOT fetched here — public view never receives it.
export const fetchOrderById = async (orderId: string): Promise<Order | null> => {
  const snap = await getDoc(doc(db, 'orders', orderId));
  if (!snap.exists()) return null;
  return snap.data() as Order;
};

export const deleteOrderFromFirestore = async (orderId: string): Promise<void> => {
  // Delete the private sub-document first, then the main document
  await deleteDoc(doc(db, 'orders', orderId, 'private', 'data'));
  await deleteDoc(doc(db, 'orders', orderId));
};
