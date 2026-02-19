# 🍰 Ayala Cakes — Smart Pastry Pricing Ecosystem

> **This document is the single source of truth for the entire project.**
> It must always reflect the **complete, current state** of the system — not a changelog.
> See the [Documentation Maintenance Guidelines](#-documentation-maintenance-guidelines) section
> for mandatory rules on how to keep this file up to date.

A full-stack Kitchen Operating System (KOS) for a boutique pastry business.
The platform combines a client-facing smart price calculator, a dynamic order form,
and a full admin command center for managing orders and products — all wrapped in a
luxury "French Patisserie" aesthetic.

![Status](https://img.shields.io/badge/Status-Active_Development-success)
![Stack](https://img.shields.io/badge/Stack-React_19_|_Firebase_|_Vite-pink)
![Design](https://img.shields.io/badge/Design-Glassmorphism_&_Soft_UI-purple)

---

## Table of Contents

1. [Pricing Engine](#-pricing-engine)
2. [Dynamic Form Fields](#-dynamic-form-fields)
3. [User Flow — Calculator to Order](#-user-flow--calculator-to-order)
4. [Orders Dashboard](#-orders-dashboard)
5. [Product Editor (CMS)](#-product-editor-cms)
6. [Data Model](#-data-model)
7. [Admin System](#-admin-system)
8. [Design System & UI](#-design-system--ui)
9. [Technical Architecture](#-technical-architecture)
10. [Setup & Installation](#-setup--installation)
11. [Git Strategy](#-git-strategy)
12. [Documentation Maintenance Guidelines](#-documentation-maintenance-guidelines)

---

## 🧮 Pricing Engine

### Core Principle — Max Tier Algorithm

The system does **not** sum individual option prices. Instead, it operates on a
**"highest tier wins"** principle:

1. Every product defines a list of **base tiers** — e.g., `Basic (180₪)`, `Plus (210₪)`, `Extra (290₪)`.
2. Every selectable option is **linked to a tier** (or has a manual override price).
3. When the customer selects options across multiple categories, the system identifies the **most expensive linked tier** among all selections.
4. **The final price = the price of that highest tier.**

#### Practical Example

Given a Bento Cake with tiers `Classic (180₪)`, `Plus (210₪)`, `Extra (290₪)`:

| Category | Selection | Linked Tier |
|----------|-----------|-------------|
| Size | Diameter 10 (couple) | Classic (180₪) |
| Design | Sugar sheet / Airbrush | Extra (290₪) |
| Packaging | Standard white box | Classic (180₪) |

**Result:** The final price is **290₪** — because Extra is the highest tier selected.

### Price Linking Modes

Each Option has a `linkTier` field that determines how its price is resolved:

| `linkTier` | Meaning | Example |
|-----------|---------|---------|
| `0` | Linked to the 1st (cheapest) tier | "Standard white box" |
| `1` | Linked to the 2nd tier | "Custom text + complex piping" |
| `2` | Linked to the 3rd (most expensive) tier | "Sugar paste sculpting / flowers" |
| `-1` | **Manual price** — not linked to any tier, uses `manualPrice` field | "Special add-on (50₪)" |

### Category Types

Each category has one of two selection modes:

| Type | Behavior | Example |
|------|----------|---------|
| `radio` | **Single selection** — customer picks exactly one option | "Cake size", "Design complexity" |
| `checkbox` | **Multi-selection** — customer can check multiple options | "Special add-ons" |

---

## 📝 Dynamic Form Fields

The system dynamically generates input fields in the order form **based on the customer's calculator selections**.
There are **two sources** for dynamic fields:

### Source 1 — Tier-Level Fields (`includedSpecs`)

Each pricing tier can define **required fields** that appear when that tier is the Max Tier.

**Example:** The "Plus" tier defines `includedSpecs: [{ label: "Flavor", count: 2 }]`
→ If Plus is the highest selected tier, the order form renders **2 text inputs** labeled "Flavor 1" and "Flavor 2".

### Source 2 — Option-Level Fields (`formInputs`)

Each individual option can define **detail fields** that appear when the customer selects that option.

**Example:** The option "Layer cake" defines `formInputs: { label: "Layer flavor", count: 3 }`
→ When the customer selects "Layer cake," the order form renders **3 text inputs** labeled "Layer flavor 1", "Layer flavor 2", "Layer flavor 3".

### Field Object Structure (`OptionFormInput`)

```typescript
interface OptionFormInput {
  label: string;   // Field label (e.g., "Flavor", "Color")
  count: number;   // How many input fields to render
  type?: 'text' | 'color' | 'select';  // Input type
}
```

### How It Works Under the Hood

1. Customer finishes selecting options in the Calculator and clicks "Continue."
2. The system scans all selections and identifies the **Max Tier**.
3. If the Max Tier has `includedSpecs` → corresponding `InputRequest` objects are created.
4. For each selected Option that has `formInputs` → an additional `InputRequest` is created.
5. In the Order Form, each `InputRequest` renders as a group of inputs under the `sourceName` heading.
6. The values the customer fills in are stored in `dynamicDetails` and ultimately saved as `selectedDetails` on the order.

```
┌──────────────────────────────────────────────────────┐
│  CALCULATOR VIEW                                      │
│                                                       │
│  [Size selection]    → linkTier: 0  (Classic)         │
│  [Design selection]  → linkTier: 2  (Extra) ← MAX    │
│  [Packaging]         → linkTier: 1  (Plus)            │
│                                                       │
│  Click "Continue" ↓                                   │
├──────────────────────────────────────────────────────┤
│  ORDER FORM VIEW                                      │
│                                                       │
│  ┌─ Fields from Extra tier (includedSpecs) ─┐        │
│  │  [Flavor 1: ___________]                  │        │
│  │  [Flavor 2: ___________]                  │        │
│  └───────────────────────────────────────────┘        │
│                                                       │
│  ┌─ Fields from "Sugar sheet" option (formInputs) ─┐ │
│  │  [Print description: ___________]                │ │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
│  ┌─ Static fields (always present) ──────────────┐   │
│  │  Name, Phone, Date, Delivery/Pickup, Notes    │   │
│  └───────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

---

## 🔄 User Flow — Calculator to Order

### Step 1 — Home Page (`HomeView`)
- Displays all available products as a card list.
- Each card shows: product name, number of price tiers, and starting price.
- Clicking a card navigates to the Calculator with initial selections pre-set (for radio categories, the first option is auto-selected).

### Step 2 — Price Calculator (`CalculatorView`)
- Categories are displayed with all their options.
- `radio` categories render as single-select buttons with a circular indicator.
- `checkbox` categories render as multi-select buttons with a checkmark indicator.
- **Sticky bottom panel** shows:
  - Real-time calculated price.
  - **"Copy"** button — generates a formatted WhatsApp quote message using the product's `messageTemplate` and copies it to clipboard.
  - **"Continue"** button — navigates to the Order Form.

### Step 3 — Order Form (`OrderFormView`)

The form is divided into sections:

| Section | Fields | Required? |
|---------|--------|-----------|
| Order Summary | Product name, selected options, price | Auto-generated |
| Product Details | Dynamic fields (from `includedSpecs` and `formInputs`) | Depends on product config |
| Event Date | Date (required), Time | Date is required |
| Customer Info | Full name (required), Phone (required), Email, Referral source | Name + Phone required |
| Delivery / Pickup | Toggle between "Self pickup" and "Delivery" + address field (shown only on delivery) | — |
| Additional Notes | Free-text textarea | — |

**Referral source options:** Instagram, Facebook, WhatsApp, Friend, Other.

### Step 4 — Order Submission
- The order is saved to Firestore with:
  - `id` — client-generated UUID.
  - `createdAt` — exact ISO timestamp of creation time.
  - Execution status: `pending`.
  - Payment status: `unpaid`.
  - Invoice issued: `false`.
- On successful save → the form is cleared and the user is immediately navigated to the **Order Details view** (`ORDER_DETAILS`) for the newly created order, where they can view the full receipt and share it via WhatsApp or a direct link.

---

## 📋 Orders Dashboard

### Dashboard View (`OrdersDashboardView`)

Displays all orders as cards, sorted by event date (nearest first).

**Each order card shows:**
- Event date and time (Hebrew locale format: "Sunday, Feb 5").
- Execution status (colored badge).
- Customer name.
- Ordered product names.
- Total price.
- Payment status (colored badge).
- Invoice status.
- Delete button.

**Filter chips:**

| Filter | Logic |
|--------|-------|
| All | Shows all orders |
| This Week | Orders with event dates within the next 7 days |
| ⚠️ Unpaid | Orders where `paymentStatus !== 'paid_full'` |
| Awaiting Receipt | Orders where `isInvoiceIssued === false` |

### Order Details View (`OrderDetailsView`)

A read-only **"Kitchen Slip" (Paper Slip)** view styled as a printed receipt with a zigzag torn edge at the bottom. It is displayed both after order creation (customer flow) and when an admin views an order from the dashboard.

**Always displays:**
- Order ID (first 6 characters).
- Customer name and event date (Hebrew locale: "Sunday, 5 February").
- Event time.
- Ordered items with details and individual prices.
- `selectedDetails` — the dynamic details the customer filled in (flavors, colors, etc.), rendered as `label: value` pairs.
- Delivery type (`Self pickup` / `Delivery`) and address if applicable.
- Total price.
- Status badges: payment, execution, invoice.
- **Share actions** — always visible:
  - **WhatsApp share** — opens a `wa.me` link with a pre-filled message and the direct public URL.
  - **Copy link** — copies the direct public URL to clipboard and triggers a success Toast.

**Admin-only (when `isPublicView` is false):**
- Internal notes (shown in a highlighted box).
- **"Edit Order"** button — navigates to the Order Edit view.
- Back navigation to the Orders Dashboard.

**Public mode (when `isPublicView` is true):**
- The Global Header is hidden entirely.
- Internal notes are hidden.
- Edit controls are hidden.
- A "Create New Order" button is shown at the bottom.

### Order Edit View (`OrderEditView`)

Full editing capability for existing orders:

**Status management (top section):**

| Status Field | Possible Values |
|-------------|-----------------|
| Execution Status (`executionStatus`) | `pending` (Not started) → `in_progress` (In preparation) → `ready` (Ready) → `delivered` (Delivered) |
| Payment Status (`paymentStatus`) | `unpaid` (Unpaid) → `deposit` (Deposit paid) → `paid_full` (Fully paid) |
| Invoice (`isInvoiceIssued`) | `false` (Not issued) / `true` (Issued) |

**Editable fields:**
- Event details: date, time.
- Customer info: name, phone, email, referral source.
- Delivery/pickup + address.
- Internal notes.

---

## 🛠️ Product Editor (CMS)

### Product Management Dashboard (`AdminDashboardView`)

Lists all existing products with:
- Product name.
- Number of price tiers.
- Edit button (navigates to Product Editor).
- Delete button (with confirmation dialog).
- "Add New Product" button (Sticky Footer) — creates a product with 3 default tiers: Basic, Plus, Extra.

### Product Editor (`ProductEditorView`)

A full visual editor for creating and editing products **without writing any code**.

#### Part 1 — Price Tiers

Every product requires at least one tier. Each tier has:
- **Name** — e.g., "Classic", "Plus", "Extra".
- **Price** — price in NIS (₪).
- **Included Specs (optional)** — a list of fields that open in the order form when this tier is the Max Tier.
  - Each spec has: `label` (e.g., "Flavor") and `count` (e.g., 2).

#### Part 2 — Categories & Options

Any number of categories can be created. Each category has:
- **Name** — e.g., "Cake Size", "Design", "Packaging".
- **Type** — `radio` (single selection) or `checkbox` (multi-selection).
- **Options** — a list of selectable options. Each option has:
  - **Name** — what the customer sees.
  - **Tier Link (`linkTier`)** — which tier this option maps to, or "Manual price" (`-1`).
  - **Manual Price (`manualPrice`)** — appears only when linkTier is `-1`.
  - **Requires detail? (`formInputs`)** — a checkbox that enables dynamic fields config:
    - Field label.
    - Count.

#### Part 3 — Message Template

A text template used for the WhatsApp copy feature. Supports placeholders:
- `{details}` — list of selected options.
- `{price}` — final calculated price.

---

## 🗂️ Data Model

### Product

```typescript
interface Product {
  id: string;                    // Unique identifier (e.g., "bento_cake")
  name: string;                  // Product name
  tiers: ProductTier[];          // Price tiers
  messageTemplate: string;       // WhatsApp message template
  categories: Category[];        // Selection categories
}

interface ProductTier {
  name: string;                  // Tier name (Classic, Plus, Extra)
  price: number;                 // Price in NIS
  includedSpecs?: OptionFormInput[];  // Fields that open when this is the Max Tier
}
```

### Category & Option

```typescript
interface Category {
  id: string;
  name: string;                  // Category name
  type: 'radio' | 'checkbox';   // Selection type
  options: Option[];
}

interface Option {
  id: string;
  name: string;                  // Display name (customer-facing)
  linkTier: number;              // 0/1/2 = tier link index, -1 = manual price
  manualPrice?: number;          // Manual price (only when linkTier === -1)
  formInputs?: OptionFormInput;  // Dynamic fields triggered by selecting this option
}

interface OptionFormInput {
  label: string;                 // Field label (e.g., "Flavor")
  count: number;                 // Number of input fields
  type?: 'text' | 'color' | 'select';
}
```

### Order

```typescript
interface Order {
  id: string;                    // Client-generated UUID
  createdAt: string;             // ISO timestamp of creation

  executionStatus: ExecutionStatus;  // pending → in_progress → ready → delivered
  paymentStatus: PaymentStatus;      // unpaid → deposit → paid_full
  isInvoiceIssued: boolean;

  eventDate: string;             // Event date (ISO date string)
  customer: Customer;
  delivery: Delivery;
  items: OrderItem[];
  internalNotes?: string;
  totalPrice: number;
}

interface Customer {
  name: string;
  phone: string;
  email?: string;
  source?: string;               // instagram, facebook, whatsapp, friend, other
}

interface Delivery {
  type: 'pickup' | 'delivery';
  address?: string;              // Present only when type === 'delivery'
  time?: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  details: string;               // Concatenated text of selected options
  selectedDetails?: SelectedDetail[];  // Dynamic details filled by the customer
}

interface SelectedDetail {
  sourceName: string;            // Origin of the field (Option name or Tier name)
  label: string;                 // Label (e.g., "Flavor")
  values: string[];              // Values entered by the customer
}
```

### View States

The application has 9 view states for routing:

```typescript
type ViewState =
  | 'HOME'             // Product listing
  | 'CALCULATOR'       // Price calculator
  | 'ORDER_FORM'       // Order submission form
  | 'ORDERS_DASHBOARD' // Admin: order list
  | 'ORDER_DETAILS'    // Admin: single order view
  | 'ORDER_EDIT'       // Admin: edit order
  | 'ADMIN_LOGIN'      // Admin: PIN login
  | 'ADMIN_DASHBOARD'  // Admin: product management
  | 'PRODUCT_EDITOR';  // Admin: edit/create product
```

---

## 🔐 Admin System

### Authentication
- Login via a **PIN/password** defined in the environment variable `VITE_ADMIN_PASSWORD`.
- The PIN is compared client-side (no authentication server).
- On successful login, admin state is persisted in **`localStorage`** (key: `ayala_is_admin`) to survive page refreshes.
- The **"Logout"** button in the header clears localStorage and returns to Home.

### Navigation (Global Header)

The **GlobalHeader** (sticky top bar) displays:
- "Ayala Cakes" logo — click returns to Home.
- **"Calculator" tab** — always visible.
- **"Orders" tab** — visible only to admins. Navigates to Orders Dashboard.
- **"Management" tab** — visible only to admins. Navigates to Product Management.
- **"Login" button** (for regular users) or **"Logout" button** (for admins).

The active tab receives a highlighted style (primary background + glow shadow).

### Public Read-Only Order URL

Every order has a permanent, shareable public URL in the form:
```
https://<app-domain>?orderId=<uuid>
```

When this URL is loaded:
1. The app reads `orderId` from `window.location.search`.
2. Sets `isPublicView = true` and `view = 'ORDER_DETAILS'`.
3. Fetches all orders, finds the matching one, and sets it as `selectedOrder`.
4. The Global Header is hidden — the user sees only the clean receipt view.
5. No edit controls, internal notes, or admin navigation are shown.

The sharing flow is initiated from the Order Details view via the **WhatsApp** or **Copy Link** buttons, which are visible to all users (admin and customer) after an order is created or viewed.

---

## 🎨 Design System & UI

### Design Language — "French Patisserie"
- Warm color palette: antique rose, cream, and coffee tones.
- Typography: **Varela Round** for headings, **Rubik** for body text.
- RTL-first — all layout is right-to-left (Hebrew).
- Mobile-first with `font-size: 16px !important` on inputs to prevent iOS zoom.

### Design Tokens (`index.css`)

All visual values are defined as CSS Variables on `:root`:

| Category | Examples |
|----------|---------|
| **Brand Palette** | `--color-rose-400` (Primary), `--color-coffee-800` (Text), `--color-cream` (BG Alt) |
| **Semantic Backgrounds** | `--bg-app`, `--bg-surface`, `--bg-surface-alt`, `--bg-input`, `--bg-muted` |
| **Semantic Text** | `--text-primary`, `--text-secondary`, `--text-muted`, `--text-accent`, `--text-on-primary` |
| **Interactive (Primary)** | `--color-primary`, `--color-primary-hover`, `--color-primary-active`, `--color-primary-disabled`, `--color-primary-ghost` |
| **Status Colors** | `success` (green), `warning` (orange), `danger` (red), `info` (blue), `neutral` (gray) — each with `-bg`, `-text`, `-border` |
| **Borders** | `--border-subtle`, `--border-light`, `--border-default`, `--border-focus` |
| **Radii** | `--radius-sm` (8px) → `--radius-2xl` (32px) → `--radius-full` |
| **Spacing** | `--space-1` (4px) → `--space-12` (48px) |
| **Shadows** | `--shadow-soft`, `--shadow-glass`, `--shadow-card`, `--shadow-primary-glow` |
| **Transitions** | `--transition-fast` (150ms), `--transition-base` (200ms), `--transition-slow` (300ms) |

### Typography Scale

| Class | Size | Usage |
|-------|------|-------|
| `.text-heading-1` | 30px, Varela Round, Bold | Main page headings |
| `.text-heading-2` | 24px, Varela Round, Bold | Secondary headings |
| `.text-heading-3` | 18px, Varela Round, Bold | Small headings |
| `.text-body-lg` | 18px | Large body text |
| `.text-body-base` | 16px | Default body text |
| `.text-body-sm` | 14px | Small body text |
| `.text-caption` | 12px | Captions, labels |
| `.text-micro` | 10px | Micro-text |

### Base Component Library (`components/`)

| Component | Purpose | Variants |
|-----------|---------|----------|
| `BaseCard` | Content container card | `elevated`, `outlined`, `flat` |
| `Button` | Global button | `primary`, `secondary`, `outline`, `ghost` |
| `IconButton` | Icon-only button | `primary`, `ghost` |
| `Input` | Text input field | `text`, `number`, `date`, `time`, `email`, `tel`, `password` |
| `TextArea` | Multi-line text input | — |
| `BaseSelect` | Dropdown select | — |
| `SubHeader` | Secondary top bar with back button | `backIcon: 'arrow' \| 'close'` |
| `StickyFooter` | Fixed bottom panel for primary actions | — |
| `SectionHeader` | Section heading with icon support | `size: 'md' \| 'lg'` |
| `StatusBadge` | Colored status indicator | `success`, `warning`, `danger`, `info`, `neutral` |
| `FilterChip` | Filter toggle chip | active / inactive |
| `ToggleGroup` | Toggle group | — |
| `GlobalHeader` | Main sticky navigation header | — |
| `Toast` | Temporary notification message | — |
| `LoadingOverlay` | Full-screen loading layer | — |

### UI Patterns

| Pattern | Implementation |
|---------|---------------|
| **Glassmorphism** | `backdrop-blur(12px)` + `bg-white/70` + `border-white/20` on headers and floating panels |
| **Glass Panel** | Class `.glass-panel` — `bg: rgba(255,255,255,0.7)` + blur |
| **Paper Slip** | `clipPath: polygon(...)` for zigzag torn-edge effect on the kitchen slip view |
| **Sticky Footer** | `fixed bottom-6` with glass effect for price display + action buttons |
| **Hit Targets** | All interactive elements have a minimum 44px touch target |

---

## ⚙️ Technical Architecture

### Stack

| Technology | Version | Usage |
|-----------|---------|-------|
| React | 19.2 | UI Framework |
| TypeScript | 5.8 | Type Safety |
| Vite | 6.2 | Build & Dev Server |
| Firebase Firestore | 12.8 | Database (NoSQL) |
| Lucide React | 0.563 | Icon Library |

### File Structure

```
ayala-pricing/
├── App.tsx                  # View Router — switches on ViewState
├── index.tsx                # Entry Point
├── index.html               # HTML Shell + Google Fonts
├── index.css                # Design Token System
├── types.ts                 # All TypeScript Interfaces
├── metadata.json            # Project metadata
│
├── hooks/
│   └── useAppState.ts       # Centralized State Management (single hook)
│
├── views/                   # Full-Screen Features (9 screens)
│   ├── HomeView.tsx          # Home — product listing
│   ├── CalculatorView.tsx    # Price calculator — MaxTier logic
│   ├── OrderFormView.tsx     # Order form — static + dynamic fields
│   ├── OrdersDashboardView.tsx  # Orders list — filters + cards
│   ├── OrderDetailsView.tsx  # Order details — Paper Slip (read-only)
│   ├── OrderEditView.tsx     # Order editing — statuses + details
│   ├── AdminLoginView.tsx    # Admin login — PIN entry
│   ├── AdminDashboardView.tsx # Product management dashboard
│   └── ProductEditorView.tsx # Product editor — Tiers + Categories + Options
│
├── components/              # Shared UI Components (13 components)
│   ├── BaseCard.tsx
│   ├── Button.tsx
│   ├── IconButton.tsx
│   ├── Input.tsx             # includes Input, TextArea, BaseSelect
│   ├── SubHeader.tsx
│   ├── StickyFooter.tsx
│   ├── SectionHeader.tsx
│   ├── StatusBadge.tsx
│   ├── FilterChip.tsx
│   ├── ToggleGroup.tsx
│   ├── GlobalHeader.tsx
│   ├── Toast.tsx
│   └── LoadingOverlay.tsx
│
├── services/
│   └── storage.ts           # Firebase Abstraction Layer + Default Seeding
│
├── vite.config.ts           # Vite Config (port 3000, path aliases)
├── tsconfig.json
├── vercel.json              # Deployment Config (SPA rewrites)
└── package.json
```

### State Management

All state is managed via a **single custom hook** — `useAppState()` — which returns every state value and function.
There is no Redux, Context API, or external store.

| State Group | Contents |
|-------------|----------|
| **Core** | `data` (products), `loading`, `view` (ViewState), `toastMsg` |
| **Admin** | `isAdmin` (from localStorage), `adminPasswordInput`, `loginAsAdmin()`, `logoutAdmin()` |
| **Public View** | `isPublicView` — `true` when the app is loaded via a `?orderId=` URL; suppresses the header and admin controls |
| **Orders** | `orders`, `orderFilter`, `selectedOrder` |
| **Calculator** | `selectedProductId`, `selections` |
| **Product Editor** | `editingProduct` |
| **Order Form** | `pendingOrder`, `dynamicDetails`, `orderForm` |
| **Helpers** | `loadData()`, `showToast()`, `resetOrderForm()` |

### Routing

There is no React Router. Navigation is implemented via `ViewState` — an enum of 9 states stored in the `useAppState` hook:

```
?orderId= URL → ORDER_DETAILS (isPublicView=true, no header)

HOME → CALCULATOR → ORDER_FORM → (save) → ORDER_DETAILS
                                           ↓
ADMIN_LOGIN → ORDERS_DASHBOARD → ORDER_DETAILS → ORDER_EDIT
           → ADMIN_DASHBOARD → PRODUCT_EDITOR
```

### Firebase Layer (`storage.ts`)

| Function | Purpose |
|---------|---------|
| `fetchProducts()` | Loads products from Firestore. If no products exist — **performs automatic seeding** with 3 default products |
| `saveProductToFirestore(product)` | Saves/updates a product (setDoc — overwrite) |
| `deleteProductFromFirestore(id)` | Deletes a product |
| `fetchOrders()` | Loads all orders |
| `saveOrderToFirestore(order)` | Saves/updates an order. Ensures `createdAt` is set |
| `deleteOrderFromFirestore(id)` | Deletes an order |
| `generateUUID()` | Generates a unique ID (`crypto.randomUUID` with fallback) |

**Firestore Collections:**
- `products` — one document per product, document ID = `product.id`.
- `orders` — one document per order, document ID = `order.id`.

**Automatic Seeding:** On the first launch when no products exist in Firestore, 3 default products are created:
1. **Bento Cake** — Classic/Plus/Extra (180/210/290₪), 3 categories (Size, Design, Packaging).
2. **Designed Cakes** — Mini/Classic/Extra (450/520/700₪), 3 categories (Size, Complexity, Add-ons).
3. **Workshops** — Basic/Classic/Premium (215/260/320₪), 2 categories (Workshop type, Upgrades).

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18+)
- A Firebase project with Firestore enabled

### Install

```bash
git clone <repo-url>
cd ayala-pricing
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_ADMIN_PASSWORD=...
```

### Run

```bash
npm run dev        # Development server on port 3000
npm run build      # Production build
npm run preview    # Preview production build
```

### Deployment

The app is configured for **Vercel** with `vercel.json` providing SPA rewrites to `index.html`.

---

## 🌳 Git Strategy & Workflow

This project strictly follows the **Feature Branch Workflow**.
**Direct commits to `main` or `dev` are forbidden.**

### Branch Roles

| Branch | Role | Description |
|---|---|---|
| **`main`** | **Production** | The stable code currently deployed to users. Only updated via Pull Request. |
| **`dev`** | **Development** | The integration branch for current work. All features merge here first. |
| **`feature/*`** | **New Features** | Temporary branches for specific tasks (e.g., `feature/add-coupon`). |
| **`hotfix/*`** | **Hotfixes** | Urgent fixes for production bugs (merge to `main` & `dev`). |

### Adding a New Feature

1.  **Start from `dev`:** Always ensure you have the latest code.
    ```bash
    git checkout dev
    git pull origin dev
    ```

2.  **Create a Feature Branch:** Name it clearly.
    ```bash
    git checkout -b feature/my-new-feature
    ```

3.  **Work & Commit:**
    - Commit small, logical changes.
    - Write clear commit messages.

4.  **Push & PR:**
    - Push your branch to GitHub.
    - Open a Pull Request (PR) to merge into `dev`.
    - **Wait for review/approval** (if applicable).
    - Merge and delete the feature branch.

---

## 📌 Documentation Maintenance Guidelines

> **MANDATORY: Every code change must be accompanied by an update to this README.**

### Purpose

This README serves as the **living, authoritative documentation** of the system.
It is **not** a changelog or version history — it always describes the **current, complete state**
of the application as a factual, present-tense document.

### Rules for Updating

1. **Every feature, fix, or architectural change** that modifies the system's behavior, data model,
   UI, or capabilities **must** be reflected in this README before the work is considered done.

2. **Never add changelog-style entries.** Do not write things like:
   - ❌ "Added support for X" / "Now supports X" / "NEW: X feature"
   - ❌ "v2.1 — Added coupon system"

   Instead, update the relevant section so it reads as a **timeless fact**:
   - ✅ "The system supports X." / "X is available." / "Each order has an X field."

3. **Update, don't append.** If a feature is modified, find the existing description and edit it
   in place. If a feature is removed, delete its documentation. If a new feature is added, insert
   it into the appropriate existing section — or create a new section if it represents an entirely
   new domain.

4. **Keep counts and lists accurate.** If you add a new component, update the component count
   in the File Structure diagram and add the component to the Base Component Library table.
   If you add a new view, update the view count and add it to the File Structure tree.
   If you add a new state field, add it to the State Management table.

5. **Keep the Data Model section in sync with `types.ts`.** Any new interface, new field on an
   existing interface, or type change must be reflected in the Data Model section with accurate
   TypeScript definitions.

6. **Keep the File Structure tree accurate.** New files, renamed files, and deleted files must
   be reflected in the tree diagram.

### What to Update — Quick Reference

| Change Type | README Sections to Update |
|-------------|--------------------------|
| New product feature (e.g., new category type) | Pricing Engine, Data Model, Product Editor |
| New order form field | Dynamic Form Fields, User Flow, Data Model |
| New view/screen | File Structure, Routing diagram, relevant feature section |
| New component | File Structure, Base Component Library table |
| New state field in `useAppState` | State Management table |
| New Firestore function | Firebase Layer table |
| New design token / CSS variable | Design Tokens table |
| New status value | Orders Dashboard, Order Edit, Data Model |
| New environment variable | Setup & Installation |
| Changed pricing logic | Pricing Engine |

### Tone & Style

- Write in **English only**.
- Use **present tense** throughout (the system "supports", "displays", "renders" — not "will support").
- Be **precise and technical** — include field names, type annotations, and exact behavior.
- Use **tables** for structured information.
- Use **code blocks** for TypeScript interfaces, file trees, and flow diagrams.
- Keep a **neutral, factual tone** — this is reference documentation, not marketing copy.

---

*Built with React 19, Firebase, and Passion. 🍰*
