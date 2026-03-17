import { useState, useEffect, useCallback } from 'react';
import { AppData, Product, Order, OrderItem, ViewState, GlobalCategory } from '../types';
import { fetchProducts, fetchOrders, fetchOrderById, fetchGlobalCategories, auth, onAuthStateChanged, loginAdmin, logoutAdmin as firebaseLogout, User } from '../services/storage';

export type OrderFormState = {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerSource: string;
    eventDate: string;
    eventTime: string;
    deliveryType: 'pickup' | 'delivery';
    deliveryAddress: string;
    orderNotes: string;
};

const EMPTY_ORDER_FORM: OrderFormState = {
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerSource: '',
    eventDate: '',
    eventTime: '',
    deliveryType: 'pickup',
    deliveryAddress: '',
    orderNotes: '',
};

// ─── URL ↔ ViewState mapping ─────────────────────────────────────────────────

/** Build a URL path for a given ViewState + optional payload IDs. */
function viewToPath(view: ViewState, payload?: { orderId?: string; productId?: string; globalCategoryId?: string }): string {
    switch (view) {
        case 'HOME': return '/';
        case 'CALCULATOR': return '/calculator';
        case 'ORDER_FORM': return '/order';
        case 'ORDERS_DASHBOARD': return '/orders';
        case 'ORDER_DETAILS': return payload?.orderId ? `/orders/${payload.orderId}` : '/orders';
        case 'ORDER_EDIT': return payload?.orderId ? `/orders/${payload.orderId}/edit` : '/orders';
        case 'ADMIN_LOGIN': return '/admin';
        case 'ADMIN_DASHBOARD': return '/admin/products';
        case 'PRODUCT_EDITOR': return payload?.productId ? `/admin/products/${payload.productId}` : '/admin/products';
        case 'GLOBAL_CATEGORY_EDITOR': return payload?.globalCategoryId
            ? `/admin/global-categories/${payload.globalCategoryId}` : '/admin/products';
        default: return '/';
    }
}

/** Parse the current URL into a ViewState + any extracted IDs. */
function parsePath(): { view: ViewState; orderId?: string; productId?: string; globalCategoryId?: string; isPublic?: boolean } {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const publicOrderId = params.get('orderId');

    // Public share URL: /?orderId=<uuid>
    if (publicOrderId) {
        return { view: 'ORDER_DETAILS', orderId: publicOrderId, isPublic: true };
    }

    if (path === '/' || path === '') return { view: 'HOME' };
    if (path === '/calculator') return { view: 'CALCULATOR' };
    if (path === '/order') return { view: 'ORDER_FORM' };
    if (path === '/orders') return { view: 'ORDERS_DASHBOARD' };
    if (path === '/admin') return { view: 'ADMIN_LOGIN' };
    if (path === '/admin/products') return { view: 'ADMIN_DASHBOARD' };

    // /orders/:id/edit
    const orderEditMatch = path.match(/^\/orders\/([^/]+)\/edit$/);
    if (orderEditMatch) return { view: 'ORDER_EDIT', orderId: orderEditMatch[1] };

    // /orders/:id
    const orderDetailMatch = path.match(/^\/orders\/([^/]+)$/);
    if (orderDetailMatch) return { view: 'ORDER_DETAILS', orderId: orderDetailMatch[1] };

    // /admin/products/:id
    const productEditorMatch = path.match(/^\/admin\/products\/([^/]+)$/);
    if (productEditorMatch) return { view: 'PRODUCT_EDITOR', productId: productEditorMatch[1] };

    // /admin/global-categories/:id
    const globalCatMatch = path.match(/^\/admin\/global-categories\/([^/]+)$/);
    if (globalCatMatch) return { view: 'GLOBAL_CATEGORY_EDITOR', globalCategoryId: globalCatMatch[1] };

    return { view: 'HOME' };
}

// ─────────────────────────────────────────────────────────────────────────────

export const useAppState = () => {
    // --- Core State ---
    const [data, setData] = useState<AppData>({ products: [], globalCategories: [] });
    const [loading, setLoading] = useState(true);
    const [toastMsg, setToastMsg] = useState('');
    const [isPublicView, setIsPublicView] = useState(false);

    // Resolve initial view from current URL (once, on module init)
    const initialParsed = parsePath();
    const [view, setViewInternal] = useState<ViewState>(initialParsed.view);

    // --- Admin State (Firebase Auth) ---
    // null = not yet resolved, User = authenticated, false = unauthenticated
    const [firebaseUser, setFirebaseUser] = useState<User | null | false>(null);
    const isAdmin = !!firebaseUser;
    // authReady: true once onAuthStateChanged fires for the first time
    const [authReady, setAuthReady] = useState(false);

    // Subscribe to Firebase Auth state on mount
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
            setFirebaseUser(user ?? false);
            setAuthReady(true);
        });
        return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Login: call Firebase Auth, no longer touches localStorage
    const loginAsAdmin = async (email: string, password: string): Promise<void> => {
        await loginAdmin(email, password);
        // onAuthStateChanged will update firebaseUser automatically
    };

    // Logout: call Firebase Auth signOut (navigation handled by route guard and/or caller)
    const logoutAdmin = async () => {
        await firebaseLogout();
    };

    // --- Orders State ---
    const [orders, setOrders] = useState<Order[]>([]);
    const [orderFilter, setOrderFilter] = useState<string[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // --- Calculator State ---
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [selections, setSelections] = useState<Record<string, string | string[]>>({});

    // --- Product Editor State ---
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // --- Global Category Editor State ---
    const [editingGlobalCategory, setEditingGlobalCategory] = useState<GlobalCategory | null>(null);

    // --- Order Form State ---
    const [pendingOrder, setPendingOrder] = useState<{ items: OrderItem[]; totalPrice: number } | null>(null);
    const [dynamicDetails, setDynamicDetails] = useState<Record<string, string[]>>({});
    const [orderForm, setOrderForm] = useState<OrderFormState>(EMPTY_ORDER_FORM);


    // --- Data Loading ---
    const loadData = async () => {
        setLoading(true);
        // Products and global categories are publicly readable; orders require admin auth.
        const [products, globalCategories] = await Promise.all([fetchProducts(), fetchGlobalCategories()]);
        setData({ products, globalCategories });

        if (isAdmin) {
            try {
                const fetchedOrders = await fetchOrders();
                setOrders(fetchedOrders.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()));
            } catch (e) {
                console.error('Failed to fetch orders (permission denied?):', e);
                setOrders([]);
            }
        } else {
            setOrders([]);
        }

        setLoading(false);
    };

    // Load data once auth state is resolved
    useEffect(() => {
        if (!authReady) return;
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authReady, isAdmin]);

    // --- Navigate function: updates view state AND URL ────────────────────────
    const navigate = useCallback((
        newView: ViewState,
        payload?: { orderId?: string; productId?: string; globalCategoryId?: string; order?: Order; product?: Product; globalCategory?: GlobalCategory }
    ) => {
        const urlPath = viewToPath(newView, payload);
        window.history.pushState({}, '', urlPath);
        setViewInternal(newView);

        // Set related state if payload provided
        if (payload?.order) setSelectedOrder(payload.order);
        if (payload?.product) setEditingProduct(payload.product);
        if (payload?.globalCategory) setEditingGlobalCategory(payload.globalCategory);
    }, []);

    // --- On-mount: resolve view from URL and set related state once data loads ─
    useEffect(() => {
        const parsed = parsePath();

        // Handle public ?orderId= URL
        if (parsed.isPublic) {
            setIsPublicView(true);
        }

        // For transient views (ORDER_FORM, CALCULATOR) that can't be restored from URL alone,
        // fall back to HOME gracefully
        if (parsed.view === 'ORDER_FORM' || parsed.view === 'CALCULATOR') {
            setViewInternal('HOME');
            window.history.replaceState({}, '', '/');
            return;
        }

        // Persist the parsed IDs for resolving once data is loaded
        if (parsed.orderId) {
            sessionStorage.setItem('_pendingOrderId', parsed.orderId);
        }
        if (parsed.productId) {
            sessionStorage.setItem('_pendingProductId', parsed.productId);
        }
        if (parsed.globalCategoryId) {
            sessionStorage.setItem('_pendingGlobalCategoryId', parsed.globalCategoryId);
        }
    }, []);

    // --- Resolve pending IDs once orders/products are loaded ─────────────────
    useEffect(() => {
        if (loading) return;

        const pendingOrderId = sessionStorage.getItem('_pendingOrderId');
        if (pendingOrderId) {
            // Try to find the order in the loaded list (admin path)
            const order = orders.find(o => o.id === pendingOrderId);
            if (order) {
                setSelectedOrder(order);
            } else {
                // Public path: fetch the single order by ID (allowed by Firestore rules)
                fetchOrderById(pendingOrderId).then(fetchedOrder => {
                    if (fetchedOrder) {
                        setSelectedOrder(fetchedOrder);
                    } else {
                        setViewInternal('HOME');
                        window.history.replaceState({}, '', '/');
                    }
                });
            }
            sessionStorage.removeItem('_pendingOrderId');
        }

        const pendingProductId = sessionStorage.getItem('_pendingProductId');
        if (pendingProductId) {
            const product = data.products.find(p => p.id === pendingProductId);
            if (product) {
                setEditingProduct(JSON.parse(JSON.stringify(product)));
            } else {
                setViewInternal('ADMIN_DASHBOARD');
                window.history.replaceState({}, '', '/admin/products');
            }
            sessionStorage.removeItem('_pendingProductId');
        }

        const pendingGlobalCategoryId = sessionStorage.getItem('_pendingGlobalCategoryId');
        if (pendingGlobalCategoryId) {
            const gc = data.globalCategories.find(g => g.id === pendingGlobalCategoryId);
            if (gc) {
                setEditingGlobalCategory(JSON.parse(JSON.stringify(gc)));
            } else {
                setViewInternal('ADMIN_DASHBOARD');
                window.history.replaceState({}, '', '/admin/products');
            }
            sessionStorage.removeItem('_pendingGlobalCategoryId');
        }
    }, [loading]);

    // --- Route guard: redirect unauthenticated users away from admin views ────
    // Runs whenever auth state resolves or the view changes
    useEffect(() => {
        if (!authReady) return; // don't redirect before auth is resolved

        const parsed = parsePath();
        const adminOnlyViews: ViewState[] = ['ORDERS_DASHBOARD', 'ADMIN_DASHBOARD', 'ORDER_EDIT', 'PRODUCT_EDITOR', 'GLOBAL_CATEGORY_EDITOR'];

        if (adminOnlyViews.includes(view) && !isAdmin) {
            setViewInternal('ADMIN_LOGIN');
            window.history.replaceState({}, '', '/admin');
        }

        // ORDER_DETAILS is allowed for both admin and public (share link)
        // but only if isPublic is detected correctly above — no redirect needed
        if (parsed.view === 'ADMIN_LOGIN' && isAdmin) {
            // Already logged in, send to dashboard
            setViewInternal('ORDERS_DASHBOARD');
            window.history.replaceState({}, '', '/orders');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authReady, isAdmin, view]);

    // --- Browser Back/Forward (popstate) ─────────────────────────────────────
    useEffect(() => {
        const handlePopState = () => {
            const parsed = parsePath();

            // Transient views fall back to HOME
            if (parsed.view === 'ORDER_FORM' || parsed.view === 'CALCULATOR') {
                setViewInternal('HOME');
                return;
            }

            // Admin protection (client-side layer; Firestore rules are the real guard)
            const adminOnlyViews: ViewState[] = ['ORDERS_DASHBOARD', 'ADMIN_DASHBOARD', 'ORDER_EDIT', 'PRODUCT_EDITOR', 'GLOBAL_CATEGORY_EDITOR'];
            if (adminOnlyViews.includes(parsed.view) && !isAdmin) {
                setViewInternal('ADMIN_LOGIN');
                window.history.replaceState({}, '', '/admin');
                return;
            }

            setViewInternal(parsed.view);
            setIsPublicView(!!parsed.isPublic);

            // Resolve related state from the restored URL
            if (parsed.orderId) {
                const order = orders.find(o => o.id === parsed.orderId);
                if (order) setSelectedOrder(order);
            }
            if (parsed.productId) {
                const product = data.products.find(p => p.id === parsed.productId);
                if (product) setEditingProduct(JSON.parse(JSON.stringify(product)));
            }
            if (parsed.globalCategoryId) {
                const gc = data.globalCategories.find(g => g.id === parsed.globalCategoryId);
                if (gc) setEditingGlobalCategory(JSON.parse(JSON.stringify(gc)));
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [orders, data.products, data.globalCategories, isAdmin]);

    // --- Toast ---
    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 2500);
    };

    // --- Reset Order Form ---
    const resetOrderForm = () => {
        setOrderForm(EMPTY_ORDER_FORM);
        setPendingOrder(null);
        setDynamicDetails({});
    };

    return {
        // Data
        data, setData,
        loading, setLoading,
        orders, setOrders,

        // Navigation
        view,
        navigate,
        /** @deprecated Use navigate() instead. Only kept for compatibility during migration. */
        setView: navigate as (v: ViewState) => void,

        // Admin
        isAdmin, loginAsAdmin, logoutAdmin,
        authReady,

        // Orders
        orderFilter, setOrderFilter,
        selectedOrder, setSelectedOrder,

        // Calculator
        selectedProductId, setSelectedProductId,
        selections, setSelections,

        // Product Editor
        editingProduct, setEditingProduct,

        // Global Category Editor
        editingGlobalCategory, setEditingGlobalCategory,

        // Order Form
        pendingOrder, setPendingOrder,
        dynamicDetails, setDynamicDetails,
        orderForm, setOrderForm,

        // Helpers
        loadData,
        showToast,
        resetOrderForm,
        toastMsg,
        isPublicView,
    };
};

export type AppState = ReturnType<typeof useAppState>;
