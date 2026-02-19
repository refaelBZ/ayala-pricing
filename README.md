# 🍰 Smart Pastry Pricing Ecosystem (Ayala Cakes V2)

A state-of-the-art **Kitchen Operating System (KOS)** built for high-end pastry chefs.
This platform bridges the gap between client-facing price quotes and back-of-house production management, wrapped in a luxury "French Patisserie" aesthetic.

![Status](https://img.shields.io/badge/Status-Active_Development-success)
![Stack](https://img.shields.io/badge/Stack-React_19_|_Firebase_|_Tailwind-pink)
![Design](https://img.shields.io/badge/Design-Glassmorphism_&_Soft_UI-purple)

---

## 🌟 Comprehensive Features

### 🛍️ Client Experience (Frontend)
1.  **Smart Price Calculator:**
    *   **Max Tier Algorithm:** Automatically calculates the final price based on the most expensive component (e.g., complex decor overrides base size price).
    *   **Visual Menu:** Rich UI with card-based selections for sizes, flavors, and add-ons.
    *   **Dynamic Inputs:** Intelligently asks for specific details (e.g., "Choose 2 flavors") *only* when relevant to the selected tier.
2.  **Instant Quotes:**
    *   Real-time price updates as options are toggled.
    *   **WhatsApp Integration:** One-click generation of a formatted, professional quote message.
3.  **Seamless Ordering:**
    *   Converts the quote directly into a structured order.
    *   Collects delivery/pickup details, event time, and manufacturing notes.

### 👨‍🍳 Chef Command Center (Admin Backend)
1.  **Secure Access:**
    *   **Global Header:** Persistent navigation bar with smart context (Admin tabs appear only after login).
    *   **Biometric-style Login:** Fast, PIN-based access protected by environment variables.
2.  **Orders Dashboard (KDS):**
    *   **Kanban-style Filtering:** Filter by "This Week", "Unpaid", or "No Invoice".
    *   **Quick Actions:** Delete, Edit, or Mark as Ready directly from the card view.
3.  **Order Management Suite:**
    *   **Digital Slip View:** A print-ready, read-only view for the kitchen.
    *   **Full Editing Control:** Modify ANY detail of an existing order (Customer, Dates, Items).
    *   **Status Workflow:** Track `Execution Status` (Pending → In Prep → Ready → Delivered) and `Payment Status`.
4.  **Product Studio:**
    *   **Live Editor:** Create and edit products without code.
    *   **Tier Logic:** Define base prices (Tiers) and link them to add-ons.
    *   **Input Config:** Graphically configure which inputs are required for each tier.

---

## 🎨 Design System & UI Architecture

The application enforces a strict **"French Patisserie"** design language, implemented via a robust CSS Variable system.

### 1. Global Color Palette (`index.css`)
We use semantic CSS variables mapped to Tailwind configurations:

*   **Primary (Rose):** `var(--color-rose-400)` (#C08081) - Used for primary actions and highlights.
*   **Base (Cream):** `var(--color-cream)` (#FDFBF7) - The canvas background, evoking flour and vanilla.
*   **Text (Coffee):** `var(--color-coffee-800)` (#4A4040) - High-contrast, warm text color replacing harsh black.
*   **Surface (Glass):** `backdrop-blur-xl bg-white/70` - Used for headers and floating panels.

### 2. UI Patterns
*   **Sticky Action Bars:** Critical actions ("Save Order", "Add Product") are fixed to the bottom of the viewport, ensuring they are always accessible on mobile devices.
*   **Glassmorphism:** Headers and modals use backdrop blurs to create depth.
*   **Soft Shadows:** Custom `shadow-soft` utility to create a floating, airy feel.

### 3. Reusable Components
*   `Button.tsx`: A polymorphic button component supporting `primary`, `secondary`, and `ghost` variants with consistent pill-shape styling.
*   `GlobalHeader.tsx`: A responsive, state-aware navigation bar.
*   `LoadingOverlay.tsx`: A branded loading spinner with a rose animation.

---

## 🛠️ Technical Architecture

### File Structure
The project follows a **Feature-First** architecture:
```
src/
├── hooks/
│   └── useAppState.ts       # Centralized State Management (Login, Data Fetching)
├── views/                   # Full-Screen Features
│   ├── HomeView.tsx         # Landing Page / Calculator
│   ├── AdminLoginView.tsx   # Security Gate
│   ├── ProductEditorView.tsx# CMS for Products
│   ├── OrdersDashboardView.tsx # Kitchen Display System
│   └── OrderEditView.tsx    # Order Management
├── services/
│   └── storage.ts           # Firebase Firestore Abstraction Layer
└── components/              # Shared UI (Buttons, Inputs, Headers)
```

### Data Flow
1.  **State:** `useAppState` loads products and orders from Firestore on mount.
2.  **Persistence:** Admin session is persisted via `localStorage` to prevent frequent relogins.
3.  **Creation:** New orders are stamped with exact `createdAt` ISO timestamps for auditing.

---

## 🌳 Git Strategy

We maintain a disciplined version control workflow:
*   **`master`**: Stable, production-ready code.
*   **`qa`**: Pre-production testing environment.
*   **`dev`**: Active development branch.

**Convention:** `feat/feature-name` → merge to `dev` → merge to `qa` → release to `master`.

---

## 🚀 Setup & Installation

1.  **Clone & Install**
    ```bash
    git clone https://github.com/your-username/ayala-pricing.git
    npm install
    ```

2.  **Environment Setup**
    Create `.env` with Firebase credentials:
    ```env
    VITE_FIREBASE_API_KEY=...
    VITE_ADMIN_PASSWORD=...
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

---
*Built with React 19, TailwindCSS, and Passion.*
