Architecture & Requirements: Product Editor & Data Model Refactor
Objective
Refactor the Admin Product Editor and the underlying data model to enforce a strict separation of concerns between Pricing Logic (Categories/Tiers) and Data Collection (Form Fields). The goal is to eliminate data duplication, introduce a DRY (Don't Repeat Yourself) workflow for the admin, and simplify the UX, while keeping the existing client-facing Calculator and "Max Tier" pricing algorithm completely intact.

The Core Philosophy: Separation of Concerns
The current system mixes pricing modifiers with data collection fields, leading to duplicated efforts and UI confusion. Moving forward, the system must adhere to this strict rule:

Pricing & Differentiation (The Money): Handled EXCLUSIVELY by Tiers (base prices) and Options inside Categories (modifiers/add-ons).

Data Collection (The Questions): Handled EXCLUSIVELY by FormFields. Form fields are always free. If a customer needs to pay extra for a specific flavor or color, it must be an Option, not a choice inside a FormField.

1. Data Model Evolution
A. Global Dictionaries (Live Sync)
To prevent the admin from re-typing lists (e.g., "Flavors", "Colors") across multiple products, we introduce Global Dictionaries. A FormField can "point" to a dictionary. Updating the dictionary updates all connected fields across the system instantly.

TypeScript
interface GlobalDictionary {
  id: string;                    // e.g., "dict_flavors"
  name: string;                  // e.g., "Base Flavors"
  choices: string[];             // ["Chocolate", "Vanilla", "Pistachio"]
}
B. The Universal Form Field
A single, universal interface for any data collection input, regardless of where it lives.

TypeScript
interface FormField {
  id: string;                    // Unique identifier
  label: string;                 // e.g., "Piping Color", "Cake Greeting"
  type: 'text' | 'dictionary';   // Input type
  dictionaryId?: string;         // Points to a GlobalDictionary if type === 'dictionary'
  count: number;                 // How many times this input is requested (e.g., 2 colors)
  isRequired: boolean;
}
C. The 4 Scopes of Form Fields
Fields will now be injected into the Order Form based on four distinct scopes:

Global Scope (Store-Level): Fields applied to all orders or specific product IDs (e.g., "Allergy Notes"). Stored in a separate root collection.

Base Scope (Product-Level): Fields that ALWAYS appear for a specific product, regardless of the selected Tier.

Schema change: Add baseFields: FormField[] to the Product interface.

Inherited Scope (Tier-Level with Overrides): Tiers represent incremental upgrades. A higher tier inherits all fields from the lower tiers. The ONLY allowed modification during inheritance is a Count Override.

Schema change: Tiers hold an overrides record mapping Field IDs to a new count.

TypeScript
interface ProductTier {
  name: string;
  price: number;
  inheritedFields: FormField[]; // Fields introduced at this specific tier
  overrides?: Record<string, number>; // e.g., { "color_field_id": 4 } overrides the count of an inherited field
}
Triggered Scope (Option-Level): Fields that only appear if a specific Option is selected inside a Category (e.g., selecting "Sugar Sheet" triggers the "Print Text" field).

Schema change: formInputs is replaced by triggeredFields: FormField[] on the Option interface.

2. Admin UI/UX Restructuring (ProductEditorView)
The Product Editor must be flattened into a linear, modular workflow with 3 distinct sections, replacing the current nested modals approach.

Section 1: Base Data & Base Fields
Inputs: Product Name, Description, Image.

Base Fields Manager: A UI to add FormFields that apply to the entire product.

Action: The admin adds a field, selects the type (Text or Dictionary), and if Dictionary, selects from the existing global dictionaries.

Section 2: The Tier Matrix (Pricing & Inheritance)
Visual Layout: Display the tiers (e.g., Classic, Premium, Extra) side-by-side or in a clear accordion.

Pricing: Set the base price for the tier.

Inheritance UI: * Tier 1 (Base): Admin can add a new FormField (e.g., "Colors", count: 2).

Tier 2 (Upgraded): Automatically displays "Colors (2)" as a read-only inherited ghost block.

The Override Action: Next to the inherited block, a button says "Override Count for this Tier". Clicking it allows the admin to change the count (e.g., to 4). This saves to the overrides object in the database. No field duplication.

Section 3: Categories & Triggers Builder
This section builds the actual customer-facing configuration choices.

Templates (Blueprints): Add a button to "Import Category Template" (e.g., "Delivery Options"). This injects a copied JSON payload of a category so the admin can edit it locally without affecting the source template.

Category Definition: Admin defines Name and Type (Radio/Checkbox).

Options Definition: Admin adds options, setting linkTier or manualPrice.

Triggered Fields: Inside the specific Option block, add a button: "Add specific info field for this option". This attaches a FormField directly to the option (e.g., asking for an address ONLY if "Delivery" is selected).

3. What Stays EXACTLY The Same (Do Not Modify)
The "Max Tier" Algorithm: The core logic where the final price equals the highest linkTier selected across all categories remains the backbone of the Calculator.

Client-Side Calculator UI: The visual rendering of categories, radio buttons, checkboxes, and the sticky footer price calculation in CalculatorView.

Kitchen Slip (Order Details): The read-only receipt view with the zigzag torn edge.

Firebase Auth & State Management: Keep the existing useAppState architecture and Firebase authentication flow.

Execution Strategy for the Agent
Migrate Interfaces: Update types.ts to reflect the new FormField, GlobalDictionary, and the updated Product, ProductTier, and Option interfaces.

Build Dictionary Manager: Create a new admin route/view to manage Global Dictionaries (CRUD operations for choice arrays).

Refactor Product Editor: Rebuild ProductEditorView.tsx according to the 3-section layout outlined above.

Update Form Engine: Refactor the logic inside OrderFormView.tsx that generates the dynamic inputs to respect the new 4 Scopes (Global -> Base -> Inherited w/ Overrides -> Triggered).