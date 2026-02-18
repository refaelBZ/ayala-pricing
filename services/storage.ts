import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, addDoc } from "firebase/firestore";
import { Product, Order } from '../types';

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
const PRODUCTS_COLLECTION = 'products';

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
    // Return empty array on error, app handles fallback visually
    return [];
  }
};

export const saveProductToFirestore = async (product: Product): Promise<void> => {
  // Uses setDoc to overwrite if exists (update) or create if new
  await setDoc(doc(db, PRODUCTS_COLLECTION, product.id), product);
};

export const deleteProductFromFirestore = async (productId: string): Promise<void> => {
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
};

export const saveOrderToFirestore = async (order: Order): Promise<void> => {
  const ordersCollection = collection(db, 'orders');
  // If the order has an ID, use it (for updates), otherwise let Firestore generate one or use our generated one
  if (order.id) {
    await setDoc(doc(ordersCollection, order.id), order);
  } else {
    await addDoc(ordersCollection, order);
  }
};

export const fetchOrders = async (): Promise<Order[]> => {
  const querySnapshot = await getDocs(collection(db, 'orders'));
  const orders: Order[] = [];
  querySnapshot.forEach((doc) => {
    orders.push(doc.data() as Order);
  });
  return orders;
};

export const deleteOrderFromFirestore = async (orderId: string): Promise<void> => {
  await deleteDoc(doc(db, 'orders', orderId));
};