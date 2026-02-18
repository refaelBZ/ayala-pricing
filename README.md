# Smart Pastry Pricing & Order System (Ayala Cakes)

A sophisticated, mobile-first CRM and KDS (Kitchen Display System) designed for professional pastry chefs. This application streamlines the complex pricing of custom cakes and manages orders with a luxury "French Patisserie" aesthetic.

![Status](https://img.shields.io/badge/Status-Active-success)
![Stack](https://img.shields.io/badge/Stack-React_|_Firebase_|_Tailwind-pink)

## 🍰 Project Overview

**Goal:** To automate the complex quoting process for custom cakes. Instead of manual calculations, the system determines the price based on selected tiers (size, design complexity, packaging) and generates detailed digital orders.

**Target Audience:** 
1.  **The Chef (Admin):** Manages products, updates prices, and receives standardized orders.
2.  **The Customer:** Explores options, receives instant price quotes, and submits detailed orders.

**Design Philosophy:** 
The UI follows a **"French Patisserie"** design language—clean, elegant, and using a palette of soft pastels (Rose, Cream, Coffee) to evoke a premium feel.

---

## 🛠️ Technology Stack

*   **Frontend:** React 19 (Vite), TypeScript
*   **Styling:** TailwindCSS (Custom configuration for colors/typography)
*   **Icons:** Lucide React
*   **Backend / Database:** Google Firebase (Firestore)
*   **Deployment:** Vercel

---

## 🧠 Core Pricing Logic

This system uses a unique **"Max Tier Strategy"** rather than simple addition.

### 1. Max Tier Pricing
Unlike a pizza builder (Base + Topping 1 + Topping 2), custom cakes often work on "Tier Levels" (e.g., Basic, Classis, Premium).
*   **The Algorithm:** The system collects all selected options. Each option is linked to a specific **Tier Price** (or has a manual price).
*   **Calculation:** `Final Price = MAX(Option_A_Price, Option_B_Price, ...)`
*   **Example:** A customer selects a small size (Tier 1: $200) but chooses complex fondue art (Tier 3: $400). The final price jumps to **$400** immediately, covering the complexity of the entire cake.

### 2. Versionable Products
Products are defined with an array of **Tiers** (e.g., `['Basic', 'Extra', 'Premium']`). 
*   **Linking:** Options in the database don't store hardcoded prices. Instead, they store a pointer: `linkTier: 2`. This means "This option costs whatever Tier 2 is currently priced at."
*   **Benefit:** Changing the price of "Premium" instantly updates thousands of dependent options.

---

## 📂 Data Structure (Firestore Schema)

### `products` Collection
Stores the calculator logic and UI configuration.

```typescript
interface Product {
  id: string;
  name: string; // e.g., "Bento Cake"
  tiers: [
    { name: "Basic", price: 200 },
    { name: "Premium", price: 350 }
  ];
  categories: [
    {
      name: "Flavor",
      type: "radio" | "checkbox",
      options: [
        {
          name: "Vanilla",
          linkTier: 0, // Links to "Basic" price (200)
          
          // DYNAMIC INPUT LOGIC
          formInputs?: { 
             count: 2,           // Ask for 2 inputs
             label: "Flavor",    // Label: "Flavor 1", "Flavor 2"
             type: "text"
          }
        }
      ]
    }
  ];
}
```

### `orders` Collection
Stores submitted orders.

```typescript
interface Order {
  id: string;
  executionStatus: 'pending' | 'in_progress' | 'ready' | 'delivered';
  paymentStatus: 'unpaid' | 'deposit' | 'paid_full';
  isInvoiceIssued: boolean;
  
  customer: {
    name: string;
    phone: string;
    source: string; // "Instagram", "Whatsapp"...
  };
  eventDate: string; // ISO Date
  items: [
    {
      productName: "Bento Cake",
      price: 350,
      details: "Small\nVanilla", // Generated summary
      selectedDetails: [ // Result of Dynamic Inputs
        { label: "Flavor", values: ["Chocolate", "Strawberry"] }
      ]
    }
  ];
  totalPrice: number;
}
```

---

## 🚀 Features & User Flow

### 1. Smart Calculator
*   **Visual Selection:** Users choose options via beautiful cards.
*   **Live Updates:** Price updates instantly based on the "Max Tier" logic.
*   **Copy to Clipboard:** Generates a formatted Whatsapp message with the quote.

### 2. Dynamic Order Form
*   **Context Aware:** The form adapts based on calculator selections.
*   **Logic:** If a user selects "3 Fillings" in the calculator, the Order Form automatically renders **3 text inputs** to capture those specific flavors.
*   **Validation:** Prevents submission without contact info and event date.

### 3. Kitchen Dashboard (Order Management)
*   **The "Brain" of the Business:** A dedicated view for the chef to manage incoming orders.
*   **Visual Board:** Orders are displayed as elegant cards with status indicators (Payment, Execution, Invoice).
*   **Quick Actions:** 
    *   Update Status: Pending -> In Prep -> Ready -> Delivered.
    *   Track Payment: Unpaid -> Deposit -> Paid Full.
    *   Invoice Tracking: Mark if a receipt was sent.
*   **Smart Filters:** "This Week", "Unpaid", "Waiting for Invoice".

### 4. Admin Dashboard
*   **Security:** Protected by a simple environment-variable password.
*   **Product Editor:** robust UI to create products, define tiers, and manage categories/options.
*   **Configuration:** Admins can flag an option as "Requires Input" to trigger the dynamic form logic.

---

## 💻 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/ayala-pricing.git
    cd ayala-pricing
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Variables**
    Create a `.env` or `.env.local` file in the root directory:
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    
    # Admin Protection
    VITE_ADMIN_PASSWORD=208755959
    ```

4.  **Run Locally**
    ```bash
    npm run dev
    ```

5.  **Build**
    ```bash
    npm run build
    ```

---

Developed with ❤️ for **Ayala Cakes**.
