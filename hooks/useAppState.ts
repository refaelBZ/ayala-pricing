import { useState, useEffect, useCallback } from 'react';
import { AppData, Product, Order, OrderItem, ViewState } from '../types';
import { fetchProducts, fetchOrders } from '../services/storage';

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

const ADMIN_LS_KEY = 'ayala_is_admin';

// ─── URL ↔ ViewState mapping ─────────────────────────────────────────────────

/** Build a URL path for a given ViewState + optional payload IDs. */
function viewToPath(view: ViewState, payload?: { orderId?: string; productId?: string }): string {
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
        default: return '/';
    }
}

/** Parse the current URL into a ViewState + any extracted IDs. */
function parsePath(): { view: ViewState; orderId?: string; productId?: string; isPublic?: boolean } {
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

    return { view: 'HOME' };
}

// ─────────────────────────────────────────────────────────────────────────────

export const useAppState = () => {
    // --- Core State ---
    const [data, setData] = useState<AppData>({ products: [] });
    const [loading, setLoading] = useState(true);
    const [toastMsg, setToastMsg] = useState('');
    const [isPublicView, setIsPublicView] = useState(false);

    // Resolve initial view from current URL (once, on module init)
    const initialParsed = parsePath();
    const [view, setViewInternal] = useState<ViewState>(initialParsed.view);

    // --- Admin State (persisted in localStorage) ---
    const [isAdmin, setIsAdmin] = useState<boolean>(() => {
        return localStorage.getItem(ADMIN_LS_KEY) === 'true';
    });

    const loginAsAdmin = () => {
        localStorage.setItem(ADMIN_LS_KEY, 'true');
        setIsAdmin(true);
    };

    const logoutAdmin = () => {
        localStorage.removeItem(ADMIN_LS_KEY);
        setIsAdmin(false);
    };

    // --- Orders State ---
    const [orders, setOrders] = useState<Order[]>([]);
    const [orderFilter, setOrderFilter] = useState<'all' | 'week' | 'unpaid' | 'no_invoice'>('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // --- Calculator State ---
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [selections, setSelections] = useState<Record<string, string | string[]>>({});

    // --- Product Editor State ---
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // --- Order Form State ---
    const [pendingOrder, setPendingOrder] = useState<{ items: OrderItem[]; totalPrice: number } | null>(null);
    const [dynamicDetails, setDynamicDetails] = useState<Record<string, string[]>>({});
    const [orderForm, setOrderForm] = useState<OrderFormState>(EMPTY_ORDER_FORM);

    // --- Admin Login Input (ephemeral, not persisted) ---
    const [adminPasswordInput, setAdminPasswordInput] = useState('');

    // --- Data Loading ---
    const loadData = async () => {
        setLoading(true);
        const [products, fetchedOrders] = await Promise.all([fetchProducts(), fetchOrders()]);
        setData({ products });
        setOrders(fetchedOrders.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()));
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // --- Navigate function: updates view state AND URL ────────────────────────
    const navigate = useCallback((
        newView: ViewState,
        payload?: { orderId?: string; productId?: string; order?: Order; product?: Product }
    ) => {
        const urlPath = viewToPath(newView, payload);
        window.history.pushState({}, '', urlPath);
        setViewInternal(newView);

        // Set related state if payload provided
        if (payload?.order) setSelectedOrder(payload.order);
        if (payload?.product) setEditingProduct(payload.product);
    }, []);

    // --- On-mount: resolve view from URL and set related state once data loads ─
    useEffect(() => {
        const parsed = parsePath();

        // Handle public ?orderId= URL
        if (parsed.isPublic) {
            setIsPublicView(true);
        }

        // For protected admin views, redirect to login if not authenticated
        if (
            (parsed.view === 'ORDERS_DASHBOARD' || parsed.view === 'ADMIN_DASHBOARD' ||
                parsed.view === 'ORDER_DETAILS' || parsed.view === 'ORDER_EDIT' ||
                parsed.view === 'PRODUCT_EDITOR') &&
            !localStorage.getItem(ADMIN_LS_KEY) &&
            !parsed.isPublic // don't redirect public order views
        ) {
            // Protect admin-only routes; redirect to login
            if (parsed.view !== 'ORDER_DETAILS') {
                setViewInternal('ADMIN_LOGIN');
                window.history.replaceState({}, '', '/admin');
                return;
            }
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
    }, []);

    // --- Resolve pending IDs once orders/products are loaded ─────────────────
    useEffect(() => {
        if (loading) return;

        const pendingOrderId = sessionStorage.getItem('_pendingOrderId');
        if (pendingOrderId) {
            const order = orders.find(o => o.id === pendingOrderId);
            if (order) {
                setSelectedOrder(order);
            } else {
                // Order not found (e.g. deleted); fall back
                setViewInternal('HOME');
                window.history.replaceState({}, '', '/');
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
    }, [loading]);

    // --- Browser Back/Forward (popstate) ─────────────────────────────────────
    useEffect(() => {
        const handlePopState = () => {
            const parsed = parsePath();

            // Transient views fall back to HOME
            if (parsed.view === 'ORDER_FORM' || parsed.view === 'CALCULATOR') {
                setViewInternal('HOME');
                return;
            }

            // Admin protection
            if (
                (parsed.view === 'ORDERS_DASHBOARD' || parsed.view === 'ADMIN_DASHBOARD' ||
                    parsed.view === 'ORDER_EDIT' || parsed.view === 'PRODUCT_EDITOR') &&
                !localStorage.getItem(ADMIN_LS_KEY)
            ) {
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
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [orders, data.products]);

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
        adminPasswordInput, setAdminPasswordInput,

        // Orders
        orderFilter, setOrderFilter,
        selectedOrder, setSelectedOrder,

        // Calculator
        selectedProductId, setSelectedProductId,
        selections, setSelections,

        // Product Editor
        editingProduct, setEditingProduct,

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
