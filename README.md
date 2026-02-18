# Smart Pastry Pricing & Order System (Ayala Cakes)

A sophisticated, mobile-first CRM and KDS (Kitchen Display System) designed for professional pastry chefs. This application streamlines the complex pricing of custom cakes and manages orders with a luxury "French Patisserie" aesthetic.

![Status](https://img.shields.io/badge/Status-Active-success)
![Stack](https://img.shields.io/badge/Stack-React_19_|_Firebase_|_Tailwind-pink)

## 🍰 Project Overview

**Goal:** To automate the complex quoting process for custom cakes and manage the entire order lifecycle from inquiry to delivery.

**Target Audience:**
1.  **The Chef (Admin):** Manages products, updates prices, receives standardized orders, and tracks production status.
2.  **The Customer:** Explores options, receives instant price quotes, and submits detailed orders.

**Design Philosophy:**
The UI follows a **"French Patisserie"** design language—clean, elegant, and using a palette of soft pastels (Rose, Cream, Coffee) to evoke a premium feel.

---

## 🛠️ Technology Stack & Architecture

The codebase has been refactored into a scalable, feature-based React architecture.

### Core Stack
*   **Frontend:** React 19 (Vite), TypeScript
*   **Styling:** TailwindCSS (Custom configuration for colors/typography)
*   **Icons:** Lucide React
*   **Backend / Database:** Google Firebase (Firestore)
*   **Deployment:** Vercel

### File Structure
```
src/
├── hooks/              # Shared state logic (useAppState.ts)
├── components/         # Reusable UI (GlobalHeader, Toast, LoadingOverlay)
├── views/              # Full-screen Feature Components
│   ├── HomeView.tsx
│   ├── CalculatorView.tsx
│   ├── OrderFormView.tsx
│   ├── OrdersDashboardView.tsx (Kitchen Display)
│   ├── OrderDetailsView.tsx    (Digital Slip)
│   ├── OrderEditView.tsx       (Admin Edit)
│   └── ... (Admin Views)
├── services/           # Firebase Storage logic
└── App.tsx             # Main Router
```

---

## 🧠 Core Pricing Logic

This system uses a unique **"Max Tier Strategy"**.
*   **The Algorithm:** `Final Price = MAX(Option_A_Price, Option_B_Price, ...)`
*   **Example:** A customer selects a small size ($200) but chooses complex fondue art ($400). The final price jumps to **$400**, covering the complexity of the entire cake.

---

## 🚀 Features & User Flow

### 1. Smart Calculator (Client Side)
*   **Visual Selection:** Users choose options via beautiful cards.
*   **Live Updates:** Price updates instantly based on the "Max Tier" logic.
*   **Copy to Clipboard:** Generates a formatted Whatsapp message with the quote.

### 2. Dynamic Order Form
*   **Context Aware:** The form adapts based on calculator selections (e.g., asking for specific flavors if "3 Fillings" was chosen).

### 3. Kitchen Dashboard (Admin Side)
*   **Orders Dashboard:** A bird's-eye view of all orders using filter chips (This Week, Unpaid, No Invoice).
*   **Digital Slip (Details View):** A read-only, paper-slip style view for packing and quick reference.
*   **Full Editing Suite:** Admins can edit *any* detail of an order (Customer source, event time, items) and manage strict statuses via dropdowns.
    *   **Execution Status:** Pending -> In Prep -> Ready -> Delivered.
    *   **Payment Status:** Unpaid -> Deposit -> Paid Full.

---

## 🌳 Git Workflow

We follow a strict branching strategy for development:

1.  **`master`**: Production-ready code. Deployed to production.
2.  **`qa`**: Staging/Testing branch. Stable features awaiting final approval.
3.  **`dev`**: Main development branch. All new features are merged here first.

**Workflow:** Feature Branch -> Merge to `dev` -> Merge to `qa` -> Merge to `master`.

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
    Create a `.env` or `.env.local` file:
    ```env
    VITE_FIREBASE_API_KEY=...
    ...
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
