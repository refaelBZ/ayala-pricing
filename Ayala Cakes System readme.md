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
   - [Global Categories](#global-categories-globalcategoryeditorview)
   - [Global Dictionaries](#global-dictionaries-dictionarymanagerview)
6. [Data Model](#-data-model)
7. [Admin System](#-admin-system)
8. [Design System & UI](#-design-system--ui)
9. [Technical Architecture](#-technical-architecture)
10. [Setup & Installation](#-setup--installation)
11. [Git Strategy](#-git-strategy--workflow)
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

**Manual-price options** (`linkTier: -1`) are added on top of the tier price — their `manualPrice` value is summed into the total independently.

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

The system enforces a strict **separation of concerns**: pricing is handled exclusively by Tiers and Options; data collection is handled exclusively by `FormField` objects. A `FormField` is always free — it never affects pricing. If a customer must pay extra for a specific flavor, that must be an `Option`, not a choice inside a `FormField`.

Fields are injected into the Order Form based on **four distinct scopes**, evaluated in this order:

### Scope 1 — Base Scope (Product-Level)

`baseFields: FormField[]` on a `Product` are always collected, regardless of which tier or option is selected. These represent questions that apply to every order of this product.

**Example:** A "Cake Greeting" text field always appears for every Bento Cake order.

### Scope 2 — Inherited Scope (Tier-Level with Overrides)

Each `ProductTier` holds `inheritedFields: FormField[]` — the fields **introduced** at that specific tier. Higher tiers automatically inherit all fields from lower tiers. The cumulative set of fields for a given Max Tier is computed by collecting `inheritedFields` from every tier from 0 up to and including the Max Tier.

The **only allowed modification** during inheritance is a **Count Override**: a tier can override the `count` of an inherited field via the `overrides: Record<fieldId, number>` map. This changes how many inputs are rendered for that field without duplicating the field definition.

**Example:** A three-tier cake product:
- Tier 0 (Classic) introduces `inheritedFields: [{ label: "Flavor", count: 2 }]`
- Tier 1 (Plus) introduces `inheritedFields: [{ label: "Color", count: 1 }]` and `overrides: { "flavor_field_id": 3 }` (upgrades Classic's flavor count from 2 to 3)
- Tier 2 (Extra) introduces `inheritedFields: [{ label: "Print text", count: 1 }]`

→ If the Max Tier is **Extra (2)**, the order form renders: **3 Flavor inputs** (Tier 0 introduced, Tier 1 overrode to 3) + **1 Color input** (Tier 1) + **1 Print text input** (Tier 2).

→ If the Max Tier is **Classic (0)**, the order form renders: **2 Flavor inputs** only.

### Scope 3 — Triggered Scope (Option-Level)

Each `Option` can define `triggeredFields: FormField[]` — fields that **only appear if that option is selected**. These replace the old `formInputs` system.

**Example:** The "Delivery" option defines `triggeredFields: [{ label: "Address", type: "text", count: 1 }]`.
→ Selecting "Delivery" renders one "Address" input in the order form. Other options do not trigger it.

### Scope 4 — Global Scope (Store-Level)

Global Categories (see [Global Categories](#global-categories-globalcategoryeditorview)) are appended after all product-level categories. Their options can also carry `triggeredFields`, contributing to the same dynamic input pipeline.

### The Universal Form Field (`FormField`)

A single, universal interface for any data collection input, regardless of scope:

```typescript
interface FormField {
  id: string;
  label: string;                    // e.g., "Piping Color", "Cake Greeting"
  type: 'text' | 'dictionary';      // Input type
  dictionaryId?: string;            // Points to a GlobalDictionary if type === 'dictionary'
  count: number;                    // How many times this input is requested (e.g., 2 colors)
  isRequired: boolean;
}
```

When `type === 'dictionary'`, the order form looks up the referenced `GlobalDictionary` and renders a `<select>` dropdown using that dictionary's `choices` array. The dropdown always includes an **"Other / type your own..."** option at the end, which reveals a free-text input. When `type === 'text'`, a plain text input is rendered.

### How It Works Under the Hood

1. Customer finishes selecting options in the Calculator and clicks "Continue."
2. The system computes the **Max Tier index** (`maxTierIdx`) — the highest-priced linked tier across all selections.
3. `buildEffectiveFields(product, maxTierIdx)` collects `inheritedFields` from tiers 0..maxTierIdx into a `Map<fieldId, {field, effectiveCount}>` and then applies all `overrides` in order. The result is a deduplicated list of tier-scope fields with their final counts.
4. One `InputRequest` is created per: base field + effective tier field + each triggered field from selected options.
5. In the Order Form, each `InputRequest` renders as a labeled group. Dictionary fields render as a dropdown; text fields render as plain inputs. The `effectiveCount` determines how many numbered slots appear.
6. Customer-entered values are stored in `dynamicDetails: Record<string, string[]>` (keyed by `req.id`) and saved as `selectedDetails` on the order.

```
┌──────────────────────────────────────────────────────┐
│  CALCULATOR VIEW                                      │
│                                                       │
│  [Size selection]    → linkTier: 0  (Classic)         │
│  [Design selection]  → linkTier: 2  (Extra) ← MAX    │
│  [Delivery option]   → manualPrice: 50 + triggeredFields │
│                                                       │
│  Click "Continue" ↓                                   │
├──────────────────────────────────────────────────────┤
│  ORDER FORM VIEW                                      │
│                                                       │
│  ┌─ Base fields (always) ────────────────────────────┐ │
│  │  [Greeting: ____]                                 │ │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
│  ┌─ Inherited tier fields (0 → 1 → 2) ──────────────┐ │
│  │  Classic: [Flavor 1: ____] [Flavor 2: ____]       │ │
│  │  Plus:    [Color: ____]  (count overridden to 1)  │ │
│  │  Extra:   [Print text: ____]                      │ │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
│  ┌─ Triggered fields from "Delivery" option ─────────┐ │
│  │  [Address: ____]                                  │ │
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
- Options that have a linked product show a subtle **"+ תוספת נפרדת"** hint below their name.
- **Sticky bottom panel** shows:
  - Real-time calculated price.
  - **"Copy"** button — generates a formatted WhatsApp quote message using the product's `messageTemplate` and copies it to clipboard.
  - **"Continue"** button — evaluates any linked products in the selection (see Step 2.5), then navigates to the Order Form.

### Step 2.5 — Linked Product Modal (`LinkedProductModal`) _(conditional)_

If one or more of the customer's selected options has a `linkedProductId`, clicking "Continue" **does not immediately navigate to the Order Form**. Instead:

1. A **bottom-sheet modal** slides up for the first linked product.
2. The modal renders a **full Calculator UI** (categories, radio/checkbox options, live price) for the linked product.
3. The customer configures the linked product and clicks **"אישור" (Confirm)**.
4. If multiple linked products are queued, the next modal opens automatically.
5. Once all linked products are confirmed, the system navigates to the Order Form with **all items** assembled.
6. If the customer clicks **✕ (Cancel)**, they remain on the Calculator with no changes.

> **Key behaviour:** The linked product always has `quantity: 1` in the order, completely independent of the main product's quantity.

### Step 3 — Order Form (`OrderFormView`)

The form is divided into sections:

| Section | Fields | Required? |
|---------|--------|-----------|
| Order Summary | Product name, selected options, quantity control, price | Auto-generated |
| Product Details | Dynamic fields (base + tier + triggered scopes) | Depends on product config |
| Event Date | Date (required), Time | Date is required |
| Customer Info | Full name (required), Phone (required), Email, Referral source | Name + Phone required |
| Delivery / Pickup | Toggle between "Self pickup" and "Delivery" + address field (shown only on delivery) | — |
| Additional Notes | Free-text textarea | — |

**Referral source options:** Instagram, Facebook, WhatsApp, Friend, Other.

Each **main** item in the Order Summary includes a **quantity selector** (−/+ controls, minimum 1). The total price updates in real time as quantity changes (`totalPrice = unitPrice × quantity`). **Linked add-on items** are shown with a `תוספת` badge and have **no quantity controls** — they are always counted as 1.

### Step 4 — Order Submission
- The order is saved to Firestore with:
  - `id` — client-generated friendly order code in `AY-DDMMYY-HMM` format (e.g. `AY-300326-1430`), generated by `generateOrderId()`. Serves as both the Firestore document ID and the display code shown to customers.
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
- Event date and time.
- Customer name and ordered product names (tappable → Order Details).
- **Inline status dropdowns** (save directly to Firestore on change):
  - **Execution status** — טרם התחיל / בהכנה / מוכן לאיסוף / נמסר (color-coded chip).
  - **Payment status** — לא שולם / מקדמה / שולם במלואו (color-coded chip).
  - **Invoice toggle button** — flips `isInvoiceIssued`; shows "✓ קבלה" when issued.
- Total price.
- **Quick Edit button** (✏️) — navigates directly to `ORDER_EDIT` without opening the order details first.
- **Delete button** (🗑️).

**Filter bar:**

The filter bar has two modes controlled by a **"שלב סינונים"** checkbox at the end of the row:

| Mode | Behavior |
|------|----------|
| **Tab mode** (default) | Chips behave like tabs — clicking one deselects the previous |
| **Multi-filter mode** (checkbox on) | Chips toggle independently; results must match **all** active chips simultaneously (AND logic) |

Available filter chips:

| Chip | Logic |
|------|-------|
| 📅 השבוע | Event date within the next 7 days |
| ⚠️ לא שולם | `paymentStatus === 'unpaid'` |
| 🔶 מקדמה בלבד | `paymentStatus === 'deposit'` |
| 🧾 ממתין לקבלה | `isInvoiceIssued === false` |
| ✅ הושלמו | `executionStatus === 'delivered'` only |

> **Delivered orders are always hidden** from all filters except ✅ הושלמו, keeping the active workload view clean. A **"נקה סינון"** clear button appears whenever any filter is active.


### Order Details View (`OrderDetailsView`)

A read-only **"Kitchen Slip" (Paper Slip)** view styled as a printed receipt with a zigzag torn edge at the bottom. It is displayed both after order creation (customer flow) and when an admin views an order from the dashboard.

**Always displays:**
- Order ID (first 6 characters).
- Customer name and event date (Hebrew locale: "Sunday, 5 February").
- Event time.
- Ordered items with details, quantity (shown as "× N" when > 1), and individual prices.
- `selectedDetails` — the dynamic details the customer filled in (flavors, colors, etc.), rendered as `label: value` pairs.
- Delivery type (`Self pickup` / `Delivery`) and address if applicable.
- Total price.
- Status badges: payment, execution, invoice.
- **Share actions** — always visible:
  - **WhatsApp share** — opens a `wa.me` link with a pre-filled message containing the `/api/order-preview?orderId=<id>` URL. When WhatsApp (or any social crawler) fetches this URL it receives an HTML page with `og:title`, `og:description`, and `og:image` meta tags (customer name, event date, total price, and the Ayala Cakes logo). Real users are instantly JS-redirected from that page to the SPA at `?orderId=<id>`.
  - **Copy link** — copies the `/api/order-preview?orderId=<id>` URL to clipboard and triggers a success Toast.

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

Full editing capability for existing orders. All fields that exist on a newly-created order can be changed after creation.

**Status management (top section):**

| Status Field | Possible Values |
|-------------|-----------------|
| Execution Status (`executionStatus`) | `pending` (Not started) → `in_progress` (In preparation) → `ready` (Ready) → `delivered` (Delivered) |
| Payment Status (`paymentStatus`) | `unpaid` (Unpaid) → `deposit` (Deposit paid) → `paid_full` (Fully paid) |
| Invoice (`isInvoiceIssued`) | `false` (Not issued) / `true` (Issued) |

**Order items (per item):**
- Product name.
- Details text (free text summary of selected options).
- Quantity — +/− controls, minimum 1.
- Unit price — numeric input.
- **Dynamic selected details** (`selectedDetails`) — each stored detail value is rendered as an editable input. If the detail's field is of type `'dictionary'`, a `BaseSelect` dropdown is shown using the referenced `GlobalDictionary` choices; the dropdown includes an **"Other / type your own..."** option that reveals a free-text input. If the field is plain text (or the product/dictionary can no longer be resolved), a plain `Input` is shown. The total price is auto-recalculated from `price × quantity` across all items.

**Other editable fields:**
- Event details: date, time.
- Customer info: name, phone, email, referral source (dropdown).
- Delivery/pickup toggle + address.
- Internal notes.

---

## 🛠️ Product Editor (CMS)

### Product Management Dashboard (`AdminDashboardView`)

Lists all existing products and global resources with:
- **Products section**: product name, number of price tiers, edit and delete buttons.
- **Global Categories section**: global category name, target product count, option count, edit and delete buttons.
- **Global Dictionaries section**: list of dictionary names and a preview of their choices. A "נהל מילונים גלובליים" button navigates to the Dictionary Manager.
- **Sticky Footer**: "מוצר חדש" button (creates a product with 3 default tiers) + "קטגוריה גלובלית" button (creates a new global category).

### Product Editor (`ProductEditorView`)

A full visual editor for creating and editing products **without writing any code**, structured as a **linear 3-section workflow**.

#### Section 1 — Base Data & Base Fields

- **Product Name** — the customer-facing product name.
- **Description** — optional short description.
- **Message Template** — WhatsApp copy template. Supports `{details}` and `{price}` placeholders.
- **Base Fields Manager** — a list of `FormField` objects that appear in the Order Form for **every** order of this product, regardless of tier or option selection. The admin adds a field, sets its label, type (Text or Dictionary), count, and — if Dictionary — selects the target `GlobalDictionary` from a dropdown.

#### Section 2 — Tier Matrix (Pricing & Inheritance)

Tiers are displayed as an accordion. Each tier has:
- **Name** and **Price**.
- **Inherited Fields** (`inheritedFields: FormField[]`) — fields **introduced** at this specific tier. Added with a "+ הוסף שדה לרמה" button. Each field shows its label, type, and count.
- **Inherited Ghost Blocks** — fields inherited from all lower tiers are shown as read-only blocks with the source tier name. Next to each ghost block is an **"Override Count"** button. Clicking it saves a count override (`overrides[fieldId]`) for this tier without duplicating the field definition. Removing the override restores the original count.

**How inheritance resolves:**
- Tier 0 owns its `inheritedFields` at their defined count.
- Tier 1 sees all of Tier 0's fields (at Tier 0's count, unless Tier 1 has an override) plus its own new fields.
- Tier 2 sees all of Tiers 0 + 1's fields (with any cumulative overrides) plus its own new fields.
- This produces a clean, DRY configuration with no duplication.

#### Section 3 — Categories & Options

Any number of categories can be created per product. Each category has:
- **Name**, **Type** (`radio` or `checkbox`).
- **Options** — each option has:
  - **Name** — what the customer sees.
  - **Tier Link (`linkTier`)** — which tier this option maps to, or "Manual price" (`-1`).
  - **Manual Price (`manualPrice`)** — shown only when `linkTier === -1`.
  - **Triggered Fields (`triggeredFields`)** — an "הוסף שדה" button attaches a `FormField` directly to this option. Multiple triggered fields per option are supported.
  - **Link to Product (`linkedProductId`)** — optionally links this option to another existing product, triggering the Linked Product Modal flow.

---

### Global Categories (`GlobalCategoryEditorView`)

A **Global Category** is a reusable option category that is defined once and can be attached to any subset of products. It works exactly like a product's own category in the Calculator — but lives independently.

**Typical use cases:** Delivery options, allergen notes, gift wrapping.

#### How global categories differ from product categories

| | Product Category | Global Category |
|---|---|---|
| Where defined | Inside a specific product | Independently, in its own editor |
| Appears in Calculator for | That product only | Any product you target |
| Pricing | Linked to product tiers or manual | Always manual price only |
| Managed from | Product Editor | Admin Dashboard → Global Categories section |

#### Global Category Options

Each option in a global category has:
- **Name** and **Manual Price**.
- **Triggered Fields** (`triggeredFields: FormField[]`) — same as product category options; fields that appear in the Order Form only when this option is selected.
- **Linked Product** (`linkedProductId`) — same linked-product modal flow as product options.

#### How it appears in the Calculator

Global categories for the selected product are appended **after** the product's own categories. From the customer's perspective they look and behave identically to any other category.

---

### Global Dictionaries (`DictionaryManagerView`)

A **Global Dictionary** is a named list of choices (e.g., "Base Flavors": ["Chocolate", "Vanilla", "Pistachio"]) that can be referenced by any `FormField` of type `'dictionary'` across all products and global categories.

**Purpose:** Eliminate re-entering common choice lists. Updating a dictionary instantly updates every field that points to it.

**Management:** Admin Dashboard → "נהל מילונים גלובליים" → Dictionary Manager view (CRUD):
- Create a dictionary with a name and comma-separated choices.
- Edit any dictionary's name or choices.
- Delete a dictionary (fields pointing to it will gracefully fall back to a plain text input).

Each dictionary is a Firestore document in the `global_dictionaries` collection. Any `FormField` with `type: 'dictionary'` stores the dictionary's `id` in `dictionaryId`; at runtime the Order Form looks up the dictionary by ID to render the dropdown choices.

---

## 🗂️ Data Model

### Global Dictionary

```typescript
interface GlobalDictionary {
  id: string;       // e.g., "dict_flavors"
  name: string;     // e.g., "Base Flavors"
  choices: string[]; // ["Chocolate", "Vanilla", "Pistachio"]
}
```

### Form Field

```typescript
interface FormField {
  id: string;
  label: string;                    // e.g., "Piping Color", "Cake Greeting"
  type: 'text' | 'dictionary';
  dictionaryId?: string;            // Points to a GlobalDictionary when type === 'dictionary'
  count: number;                    // How many input slots to render
  isRequired: boolean;
}
```

### Product

```typescript
interface Product {
  id: string;
  name: string;
  description?: string;             // Optional product description
  tiers: ProductTier[];
  messageTemplate: string;          // WhatsApp message template
  categories: Category[];
  baseFields?: FormField[];         // Fields that ALWAYS appear for this product (any tier)
}

interface ProductTier {
  name: string;                     // Tier name (Classic, Plus, Extra)
  price: number;                    // Price in NIS
  inheritedFields: FormField[];     // Fields INTRODUCED at this specific tier
  overrides?: Record<string, number>; // fieldId → new count (overrides inherited count)
}
```

### Global Category

A `GlobalCategory` has the same shape as a `Category` plus a `targetProductIds` list that controls which products it appears in. Options in a global category always use manual pricing (`linkTier` is always `-1`).

- **`id`** — unique identifier.
- **`name`** — displayed as the section heading in the Calculator.
- **`type`** — `radio` or `checkbox`.
- **`targetProductIds`** — list of product IDs this category is attached to.
- **`options`** — same `Option` structure as product options; `linkTier` is always `-1` and `manualPrice` is always visible.

### Category & Option

```typescript
interface Category {
  id: string;
  name: string;
  type: 'radio' | 'checkbox';
  options: Option[];
}

interface Option {
  id: string;
  name: string;                     // Display name (customer-facing)
  linkTier: number;                 // 0/1/2 = tier link index, -1 = manual price
  manualPrice?: number;             // Manual price (only when linkTier === -1)
  triggeredFields?: FormField[];    // Fields that appear only when this option is selected
  linkedProductId?: string;         // If set, selecting this option opens a Linked Product Modal
}
```

### Order

```typescript
interface Order {
  id: string;                       // Friendly order code: "AY-DDMMYY-HMM" (e.g. "AY-300326-1430") for new orders; UUID for legacy orders
  createdAt: string;                // ISO timestamp of creation

  executionStatus: ExecutionStatus; // pending → in_progress → ready → delivered
  paymentStatus: PaymentStatus;     // unpaid → deposit → paid_full
  isInvoiceIssued: boolean;

  eventDate: string;                // Event date (ISO date string)
  customer: Customer;
  delivery: Delivery;
  items: OrderItem[];
  internalNotes?: string;           // Admin-only — stored in private Firestore sub-document
  totalPrice: number;
}

interface Customer {
  name: string;
  phone: string;
  email?: string;
  source?: string;                  // instagram, facebook, whatsapp, friend, other
}

interface Delivery {
  type: 'pickup' | 'delivery';
  address?: string;                 // Present only when type === 'delivery'
  time?: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  price: number;                    // Unit price
  quantity: number;                 // Always >= 1; default 1
  details: string;                  // Concatenated text of selected options
  selectedDetails?: SelectedDetail[]; // Dynamic details filled by the customer
  // Internal UI-only fields (stripped before saving to Firestore):
  _inputRequests?: InputRequest[];  // Used during the Order Form flow to render inputs
  _isLinked?: boolean;              // True for items added via the Linked Product Modal
}

interface SelectedDetail {
  sourceName: string;               // Origin of the field (Option name or Tier name)
  label: string;                    // Label (e.g., "Flavor")
  values: string[];                 // Values entered by the customer
}

interface InputRequest {
  id: string;
  sourceName: string;               // e.g., "Base", "Classic (Tier 1)", "Option: Delivery"
  field: FormField;
  effectiveCount?: number;          // After applying tier overrides (may differ from field.count)
}
```

### App Data

```typescript
interface AppData {
  products: Product[];
  globalCategories: GlobalCategory[];
  globalDictionaries: GlobalDictionary[];
}
```

### View States

The application has 11 view states for routing:

| ViewState | URL | Description |
|-----------|-----|-------------|
| `HOME` | `/` | Product listing |
| `CALCULATOR` | `/calculator` | Price calculator |
| `ORDER_FORM` | `/order` | Order submission form |
| `ORDERS_DASHBOARD` | `/orders` | Admin: order list |
| `ORDER_DETAILS` | `/orders/:id` | Admin + public: single order view |
| `ORDER_EDIT` | `/orders/:id/edit` | Admin: edit order |
| `ADMIN_LOGIN` | `/admin` | Firebase Auth login |
| `ADMIN_DASHBOARD` | `/admin/products` | Admin: product + global category + dictionary management |
| `PRODUCT_EDITOR` | `/admin/products/:id` | Admin: edit/create product |
| `GLOBAL_CATEGORY_EDITOR` | `/admin/global-categories/:id` | Admin: edit/create global category |
| `DICTIONARY_MANAGER` | `/admin/dictionaries` | Admin: manage global dictionaries |

---

## 🔐 Admin System

### Authentication

The admin system uses **Firebase Authentication** (email + password). There is no client-side PIN comparison.

- Login is performed via `signInWithEmailAndPassword` — credentials are managed in the Firebase console.
- Auth state is tracked via the `onAuthStateChanged` listener. The `isAdmin` flag is derived from the presence of a live Firebase `User` object — no `localStorage` key is used.
- On successful login, `onAuthStateChanged` fires automatically and the route guard redirects to `ORDERS_DASHBOARD`.
- The **"Logout"** button in the header calls `signOut` and returns to Home.
- A **route guard** in `useAppState` runs whenever `authReady` (first `onAuthStateChanged` resolution) or `isAdmin` changes, redirecting unauthenticated users away from admin-only views.
- `authReady` is exported from `useAppState` and indicates whether the initial Firebase Auth check has completed. Data loading waits for `authReady` before fetching.

### Navigation (Global Header)

The **GlobalHeader** (sticky top bar) displays:
- "Ayala Cakes" logo — click returns to Home.
- **"Calculator" tab** — always visible.
- **"Orders" tab** — visible only to admins. Navigates to Orders Dashboard.
- **"Management" tab** — visible only to admins. Navigates to Product Management. Also highlighted for `GLOBAL_CATEGORY_EDITOR` and `DICTIONARY_MANAGER` views.
- **"Login" button** (for regular users) or **"Logout" button** (for admins).

**On mobile**, navigation tabs and login/logout controls collapse into a **hamburger menu** (☰ / ✕ toggle). The dropdown opens below the header, closes on navigation or outside click, and supports the same tab structure as the desktop layout.

### URL-Based Routing

Navigation is implemented via the **History API** — the `navigate()` function in `useAppState` synchronizes `ViewState` with the browser URL using `window.history.pushState`. Each view maps to a distinct URL:

| ViewState | URL |
|-----------|-----|
| `HOME` | `/` |
| `CALCULATOR` | `/calculator` |
| `ORDER_FORM` | `/order` |
| `ORDERS_DASHBOARD` | `/orders` |
| `ORDER_DETAILS` | `/orders/:id` |
| `ORDER_EDIT` | `/orders/:id/edit` |
| `ADMIN_LOGIN` | `/admin` |
| `ADMIN_DASHBOARD` | `/admin/products` |
| `PRODUCT_EDITOR` | `/admin/products/:id` |
| `GLOBAL_CATEGORY_EDITOR` | `/admin/global-categories/:id` |
| `DICTIONARY_MANAGER` | `/admin/dictionaries` |

The browser Back/Forward buttons (`popstate`) are handled — the app re-parses the URL and restores the correct view. Transient views (`CALCULATOR`, `ORDER_FORM`) cannot be restored from a URL alone and fall back to `HOME`.

### Public Read-Only Order URL

Every order has a permanent, shareable public URL. Sharing routes through a Vercel serverless function:

```
Share URL:  https://<app-domain>/api/order-preview?orderId=<id>
SPA URL:    https://<app-domain>?orderId=<id>
```

**Two-step share flow:**
1. The admin clicks **WhatsApp Share** or **Copy Link** — the copied URL points to `/api/order-preview?orderId=<id>`.
2. When a **social crawler** (WhatsApp, iMessage, Telegram) fetches that URL, the serverless function:
   - Fetches the order from Firestore via the REST API (no SDK, runs server-side).
   - Returns an HTML page with `og:title` (order number), `og:description` (customer name, date, total), `og:image` (Ayala Cakes logo at `/og-image.png`), and a `meta http-equiv="refresh"` redirect to the SPA.
3. When a **real user** opens the link, the JS redirect (`window.location.replace`) fires immediately, sending them to `?orderId=<id>` on the SPA.

**SPA public view (`?orderId=<id>`):**
1. The app reads `orderId` from `window.location.search`.
2. Sets `isPublicView = true` and `view = 'ORDER_DETAILS'`.
3. Calls `fetchOrderById(orderId)` to load the specific order document (permitted by Firestore rules even for unauthenticated users).
4. The Global Header is hidden — the user sees only the clean receipt view.
5. No edit controls, internal notes, or admin navigation are shown.

**`vercel.json`** excludes `/api/` routes from the SPA catch-all rewrite, ensuring the serverless function is reachable:
```json
{ "source": "/((?!api/).*)", "destination": "/index.html" }
```

---

## 🎨 Design System & UI

### Design Language — "French Patisserie"
- Warm color palette: antique rose, cream, and coffee tones.
- Typography: **Varela Round** for headings, **Rubik** for body text.
- RTL-first — all layout is right-to-left (Hebrew).
- Mobile-first with `font-size: 16px !important` on inputs to prevent iOS zoom.

### Styling Architecture

The project uses **SCSS CSS Modules** — no Tailwind CSS. Every component and view has a co-located `style.module.scss` file. Class names are imported as a `styles` object and applied via `className={styles.myClass}`.

The styling system is split across three layers:

| File | Purpose |
|------|---------|
| `index.css` | CSS custom properties (design tokens) — linked from `index.html`, available globally |
| `styles/globals.scss` | Imported once via `index.tsx`. Contains: base reset (`*`, `body`, `button`), typography global classes, form element defaults, and utility classes (`.glass-panel`, `.hide-scrollbar`) |
| `styles/_variables.scss` | SCSS variables — spacing scale, radii, fonts, transitions. Imported by component modules via `@import 'variables'` |
| `styles/_mixins.scss` | SCSS mixins — `flex-center`, `flex-between`, `flex-col`, `interactive`, `absolute-fill`, `respond-to` / `respond-down` breakpoint helpers |

**Vite SCSS config** (`vite.config.ts`) uses the `modern-compiler` API:
```ts
css: {
  preprocessorOptions: {
    scss: { api: 'modern-compiler' }
  }
}
```

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
| `GlobalHeader` | Main sticky navigation header with mobile hamburger | — |
| `LinkedProductModal` | Bottom-sheet modal for configuring a linked product | — |
| `Toast` | Temporary notification message | — |
| `LoadingOverlay` | Full-screen loading layer | — |

### UI Patterns

| Pattern | Implementation |
|---------|---------------|
| **Glassmorphism** | `backdrop-filter: blur(12px)` + `background: rgba(255,255,255,0.7)` + `border: 1px solid rgba(255,255,255,0.5)` on headers and floating panels |
| **Glass Panel** | Global class `.glass-panel` in `globals.scss` — applies the glassmorphism style |
| **Paper Slip** | `clipPath: polygon(...)` for zigzag torn-edge effect on the kitchen slip view |
| **Sticky Footer** | `position: fixed; bottom: 1.5rem` with glass effect for price display + action buttons |
| **Hit Targets** | All interactive elements have a minimum 44px touch target |

---

## ⚙️ Technical Architecture

### Stack

| Technology | Version | Usage |
|-----------|---------|-------|
| React | 19.2 | UI Framework |
| TypeScript | 5.8 | Type Safety |
| Vite | 6.2 | Build & Dev Server |
| SCSS (Sass) | — | Component-scoped CSS Modules + global design system |
| Firebase Firestore | 12.8 | Database (NoSQL) |
| Firebase Auth | 12.8 | Admin Authentication |
| Lucide React | 0.563 | Icon Library |

### File Structure

Each component and view is a **folder** containing `index.tsx` (logic + JSX) and `style.module.scss` (scoped styles). This keeps styling co-located with the component it belongs to.

```
ayala-pricing/
├── App.tsx                  # View Router — switches on ViewState
├── index.tsx                # Entry Point — imports styles/globals.scss
├── index.html               # HTML Shell + Google Fonts (no Tailwind CDN)
├── index.css                # Design Token System (CSS custom properties)
├── types.ts                 # All TypeScript Interfaces
│
├── api/
│   └── order-preview.ts     # Vercel serverless function — OG meta tags + JS redirect for share links
│
├── public/
│   └── og-image.png         # Ayala Cakes logo used as og:image in WhatsApp/social previews
│
├── styles/                  # Global SCSS Design System
│   ├── globals.scss         # Base reset, typography globals, utility classes
│   ├── _variables.scss      # SCSS variables (spacing, radii, fonts, transitions)
│   └── _mixins.scss         # SCSS mixins (flex-center, respond-to, etc.)
│
├── hooks/
│   └── useAppState.ts       # Centralized State Management (single hook)
│
├── views/                   # Full-Screen Features (11 screens)
│   ├── HomeView/
│   │   ├── index.tsx         # Home — product listing
│   │   └── style.module.scss
│   ├── CalculatorView/
│   │   ├── index.tsx         # Price calculator — MaxTier logic + global categories
│   │   └── style.module.scss
│   ├── OrderFormView/
│   │   ├── index.tsx         # Order form — static + dynamic fields (4 scopes)
│   │   └── style.module.scss
│   ├── OrdersDashboardView/
│   │   ├── index.tsx         # Orders list — multi-filter + cards
│   │   └── style.module.scss
│   ├── OrderDetailsView/
│   │   ├── index.tsx         # Order details — Paper Slip (read-only)
│   │   └── style.module.scss
│   ├── OrderEditView/
│   │   ├── index.tsx         # Order editing — statuses + items + dynamic details (dropdown/text)
│   │   └── style.module.scss
│   ├── AdminLoginView/
│   │   ├── index.tsx         # Admin login — Firebase Auth (email + password)
│   │   └── style.module.scss
│   ├── AdminDashboardView/
│   │   ├── index.tsx         # Products + global categories + dictionaries dashboard
│   │   └── style.module.scss
│   ├── ProductEditorView/
│   │   ├── index.tsx         # Product editor — 3-section: base data, tier matrix, categories
│   │   └── style.module.scss
│   ├── GlobalCategoryEditorView/
│   │   ├── index.tsx         # Global category editor — targeting + options + triggered fields
│   │   └── style.module.scss
│   └── DictionaryManagerView/
│       ├── index.tsx         # Global dictionary CRUD
│       └── style.module.scss
│
├── components/              # Shared UI Components (14 components)
│   ├── BaseCard/            ├── index.tsx + style.module.scss
│   ├── Button/              ├── index.tsx + style.module.scss
│   ├── IconButton/          ├── index.tsx + style.module.scss
│   ├── Input/               ├── index.tsx + style.module.scss  (Input, TextArea, BaseSelect)
│   ├── LinkedProductModal/  ├── index.tsx + style.module.scss
│   ├── SubHeader/           ├── index.tsx + style.module.scss
│   ├── StickyFooter/        ├── index.tsx + style.module.scss
│   ├── SectionHeader/       ├── index.tsx + style.module.scss
│   ├── StatusBadge/         ├── index.tsx + style.module.scss
│   ├── FilterChip/          ├── index.tsx + style.module.scss
│   ├── ToggleGroup/         ├── index.tsx + style.module.scss
│   ├── GlobalHeader/        ├── index.tsx + style.module.scss
│   ├── Toast/               ├── index.tsx + style.module.scss
│   └── LoadingOverlay/      └── index.tsx + style.module.scss
│
├── services/
│   └── storage.ts           # Firebase Abstraction Layer + Default Seeding
│
├── firebase.json            # Firebase CLI config (points to firestore.rules)
├── firestore.rules          # Firestore Security Rules (deploy via Firebase CLI)
├── firestore.indexes.json   # Firestore composite indexes
├── vite.config.ts           # Vite Config (port 3000, SCSS modern-compiler, path aliases)
├── vite-env.d.ts            # Vite environment variable type declarations
├── tsconfig.json
├── vercel.json              # Deployment Config (SPA rewrites)
└── package.json
```

### State Management

All state is managed via a **single custom hook** — `useAppState()` — which returns every state value and function.
There is no Redux, Context API, or external store.

| State Group | Contents |
|-------------|----------|
| **Core** | `data` (products + globalCategories + globalDictionaries), `loading`, `view` (ViewState), `toastMsg` |
| **Admin** | `isAdmin` (derived from Firebase Auth), `authReady`, `loginAsAdmin()`, `logoutAdmin()` |
| **Public View** | `isPublicView` — `true` when the app is loaded via a `?orderId=` URL; suppresses the header and admin controls |
| **Orders** | `orders`, `orderFilter` (`string[]` — multi-select active filter IDs), `selectedOrder` |
| **Calculator** | `selectedProductId`, `selections` |
| **Product Editor** | `editingProduct` |
| **Global Category Editor** | `editingGlobalCategory` |
| **Dictionary Editor** | `editingDictionary` |
| **Order Form** | `pendingOrder`, `dynamicDetails`, `orderForm` |
| **Helpers** | `loadData()`, `showToast()`, `resetOrderForm()`, `navigate()` |

### Routing

Navigation is implemented via `navigate()` — a function in `useAppState` that updates `ViewState` and calls `window.history.pushState` to sync the URL. There is no React Router dependency.

```
?orderId= URL → ORDER_DETAILS (isPublicView=true, no header)  [fetchOrderById]

HOME (/) → CALCULATOR (/calculator) → ORDER_FORM (/order) → (save) → ORDER_DETAILS (/orders/:id)

ADMIN_LOGIN (/admin) → ORDERS_DASHBOARD (/orders) → ORDER_DETAILS (/orders/:id) → ORDER_EDIT (/orders/:id/edit)
                     → ADMIN_DASHBOARD (/admin/products) → PRODUCT_EDITOR (/admin/products/:id)
                                                        → GLOBAL_CATEGORY_EDITOR (/admin/global-categories/:id)
                                                        → DICTIONARY_MANAGER (/admin/dictionaries)
```

### Firebase Layer (`storage.ts`)

| Function | Purpose |
|---------|---------|
| `fetchProducts()` | Loads products from Firestore. If no products exist — **performs automatic seeding** with 3 default products |
| `saveProductToFirestore(product)` | Saves/updates a product (setDoc — overwrite). JSON round-trips to strip `undefined` values before writing |
| `deleteProductFromFirestore(id)` | Deletes a product |
| `fetchGlobalCategories()` | Loads all global categories from Firestore (public read, returns `[]` on permission error) |
| `saveGlobalCategoryToFirestore(gc)` | Saves/updates a global category (setDoc — overwrite) |
| `deleteGlobalCategoryFromFirestore(id)` | Deletes a global category |
| `fetchGlobalDictionaries()` | Loads all global dictionaries from Firestore (public read, returns `[]` on permission error) |
| `saveGlobalDictionaryToFirestore(dict)` | Saves/updates a global dictionary (setDoc — overwrite) |
| `deleteGlobalDictionaryFromFirestore(id)` | Deletes a global dictionary |
| `fetchOrders()` | Loads all orders + private `internalNotes` sub-documents (admin only) |
| `fetchOrderById(id)` | Fetches a single order by ID (public — no auth required; no `internalNotes`) |
| `saveOrderToFirestore(order)` | Saves/updates an order. Public fields → main document; `internalNotes` → `orders/{id}/private/data` |
| `deleteOrderFromFirestore(id)` | Deletes the private sub-document first, then the main order document |
| `generateOrderId()` | Generates a friendly order code in `AY-DDMMYY-HMM` format (e.g. `AY-300326-1430`) used as the Firestore document ID and the customer-facing display code |
| `generateUUID()` | Generates a UUID (`crypto.randomUUID` with fallback) — kept for internal use; new orders use `generateOrderId()` instead |
| `loginAdmin(email, password)` | Firebase Auth `signInWithEmailAndPassword` |
| `logoutAdmin()` | Firebase Auth `signOut` |

**Firestore Collections:**
- `products` — one document per product, document ID = `product.id`. Publicly readable.
- `global_categories` — one document per global category, document ID = `globalCategory.id`. Publicly readable; admin write only.
- `global_dictionaries` — one document per dictionary, document ID = `dictionary.id`. Publicly readable; admin write only.
- `orders` — one document per order, document ID = `order.id`. Admin read/write; single-doc public `get` allowed.
- `orders/{id}/private/data` — private sub-document holding `internalNotes`. Admin only.

**Privacy Model:** Public users (share link) can `getDoc` a single order by ID but cannot list the collection. The `internalNotes` field is never included in the public document — it lives exclusively in the private sub-document and is only fetched by `fetchOrders()` (admin-authenticated).

**Automatic Seeding:** On the first launch when no products exist in Firestore, 3 default products are created:
1. **Bento Cake** — Classic/Plus/Extra (180/210/290₪), 3 categories (Size, Design, Packaging).
2. **Designed Cakes** — Mini/Classic/Extra (450/520/700₪), 3 categories (Size, Complexity, Add-ons).
3. **Workshops** — Basic/Classic/Premium (215/260/320₪), 2 categories (Workshop type, Upgrades).

### Firestore Security Rules (`firestore.rules`)

```
products/{productId}
  read:  public
  write: admin only

global_categories/{categoryId}
  read:  public  ← needed for Calculator to show applicable global categories
  write: admin only

global_dictionaries/{dictionaryId}
  read:  public  ← needed for Order Form to resolve dictionary choices
  write: admin only

orders/{orderId}
  read/write: admin only
  get (single doc by ID): public  ← enables share-link fetch

orders/{orderId}/private/{doc}
  read/write: admin only  ← internalNotes never exposed to public
                          ← must be an explicit rule; Firestore rules do NOT inherit from parent collections to subcollections
```

`request.auth != null` — any authenticated Firebase Auth user is an admin. No public sign-up exists; only the business owner holds credentials.

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18+)
- A Firebase project with **Firestore** and **Firebase Authentication** (Email/Password provider) enabled

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
```

> `VITE_ADMIN_PASSWORD` is no longer used. Admin credentials are managed exclusively through the Firebase Authentication console.

### Run

```bash
npm run dev        # Development server on port 3000
npm run build      # Production build
npm run preview    # Preview production build
```

### Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

### Deployment

The app is configured for **Vercel** with `vercel.json` providing SPA rewrites to `index.html`.

---

## 🌳 Git Strategy & Workflow

This project strictly follows the **Feature Branch Workflow**.
**Direct commits to `main` are forbidden.**

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
