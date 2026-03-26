import { useState, useEffect, useCallback } from 'react';
import { AppData, Product, Order, OrderItem, ViewState, GlobalCategory, GlobalDictionary } from '../types';
import {
    fetchProducts, fetchOrders, fetchOrderById,
    fetchGlobalCategories, fetchGlobalDictionaries,
    auth, onAuthStateChanged, loginAdmin, logoutAdmin as firebaseLogout, User
} from '../services/storage';

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

function viewToPath(view: ViewState, payload?: {
    orderId?: string;
    productId?: string;
    globalCategoryId?: string;
    dictionaryId?: string;
}): string {
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
        case 'DICTIONARY_MANAGER': return '/admin/dictionaries';
        default: return '/';
    }
}

function parsePath(): {
    view: ViewState;
    orderId?: string;
    productId?: string;
    globalCategoryId?: string;
    isPublic?: boolean;
} {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const publicOrderId = params.get('orderId');

    if (publicOrderId) {
        return { view: 'ORDER_DETAILS', orderId: publicOrderId, isPublic: true };
    }

    if (path === '/' || path === '') return { view: 'HOME' };
    if (path === '/calculator') return { view: 'CALCULATOR' };
    if (path === '/order') return { view: 'ORDER_FORM' };
    if (path === '/orders') return { view: 'ORDERS_DASHBOARD' };
    if (path === '/admin') return { view: 'ADMIN_LOGIN' };
    if (path === '/admin/products') return { view: 'ADMIN_DASHBOARD' };
    if (path === '/admin/dictionaries') return { view: 'DICTIONARY_MANAGER' };

    const orderEditMatch = path.match(/^\/orders\/([^/]+)\/edit$/);
    if (orderEditMatch) return { view: 'ORDER_EDIT', orderId: orderEditMatch[1] };

    const orderDetailMatch = path.match(/^\/orders\/([^/]+)$/);
    if (orderDetailMatch) return { view: 'ORDER_DETAILS', orderId: orderDetailMatch[1] };

    const productEditorMatch = path.match(/^\/admin\/products\/([^/]+)$/);
    if (productEditorMatch) return { view: 'PRODUCT_EDITOR', productId: productEditorMatch[1] };

    const globalCatMatch = path.match(/^\/admin\/global-categories\/([^/]+)$/);
    if (globalCatMatch) return { view: 'GLOBAL_CATEGORY_EDITOR', globalCategoryId: globalCatMatch[1] };

    return { view: 'HOME' };
}

// ─────────────────────────────────────────────────────────────────────────────

export const useAppState = () => {
    // --- Core State ---
    const [data, setData] = useState<AppData>({ products: [], globalCategories: [], globalDictionaries: [] });
    const [loading, setLoading] = useState(true);
    const [toastMsg, setToastMsg] = useState('');
    const [isPublicView, setIsPublicView] = useState(false);

    const initialParsed = parsePath();
    const [view, setViewInternal] = useState<ViewState>(initialParsed.view);

    // --- Admin State (Firebase Auth) ---
    const [firebaseUser, setFirebaseUser] = useState<User | null | false>(null);
    const isAdmin = !!firebaseUser;
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
            setFirebaseUser(user ?? false);
            setAuthReady(true);
        });
        return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loginAsAdmin = async (email: string, password: string): Promise<void> => {
        await loginAdmin(email, password);
    };

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

    // --- Editor States ---
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editingGlobalCategory, setEditingGlobalCategory] = useState<GlobalCategory | null>(null);
    const [editingDictionary, setEditingDictionary] = useState<GlobalDictionary | null>(null);

    // --- Order Form State ---
    const [pendingOrder, setPendingOrder] = useState<{ items: OrderItem[]; totalPrice: number } | null>(null);
    const [dynamicDetails, setDynamicDetails] = useState<Record<string, string[]>>({});
    const [orderForm, setOrderForm] = useState<OrderFormState>(EMPTY_ORDER_FORM);

    // --- Data Loading ---
    const loadData = async () => {
        setLoading(true);
        const [products, globalCategories, globalDictionaries] = await Promise.all([
            fetchProducts(),
            fetchGlobalCategories(),
            fetchGlobalDictionaries()
        ]);
        setData({ products, globalCategories, globalDictionaries });

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

    useEffect(() => {
        if (!authReady) return;
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authReady, isAdmin]);

    // --- Navigate ---
    const navigate = useCallback((
        newView: ViewState,
        payload?: {
            orderId?: string;
            productId?: string;
            globalCategoryId?: string;
            dictionaryId?: string;
            order?: Order;
            product?: Product;
            globalCategory?: GlobalCategory;
            dictionary?: GlobalDictionary;
        }
    ) => {
        const urlPath = viewToPath(newView, payload);
        window.history.pushState({}, '', urlPath);
        setViewInternal(newView);

        if (payload?.order) setSelectedOrder(payload.order);
        if (payload?.product) setEditingProduct(payload.product);
        if (payload?.globalCategory) setEditingGlobalCategory(payload.globalCategory);
        if (payload?.dictionary) setEditingDictionary(payload.dictionary);
    }, []);

    // --- On-mount: resolve view from URL ---
    useEffect(() => {
        const parsed = parsePath();

        if (parsed.isPublic) {
            setIsPublicView(true);
        }

        if (parsed.view === 'ORDER_FORM' || parsed.view === 'CALCULATOR') {
            setViewInternal('HOME');
            window.history.replaceState({}, '', '/');
            return;
        }

        if (parsed.orderId) sessionStorage.setItem('_pendingOrderId', parsed.orderId);
        if (parsed.productId) sessionStorage.setItem('_pendingProductId', parsed.productId);
        if (parsed.globalCategoryId) sessionStorage.setItem('_pendingGlobalCategoryId', parsed.globalCategoryId);
    }, []);

    // --- Resolve pending IDs once data loads ---
    useEffect(() => {
        if (loading) return;

        const pendingOrderId = sessionStorage.getItem('_pendingOrderId');
        if (pendingOrderId) {
            const order = orders.find(o => o.id === pendingOrderId);
            if (order) {
                setSelectedOrder(order);
            } else {
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

    // --- Route guard ---
    useEffect(() => {
        if (!authReady) return;

        const parsed = parsePath();
        const adminOnlyViews: ViewState[] = [
            'ORDERS_DASHBOARD', 'ADMIN_DASHBOARD', 'ORDER_EDIT',
            'PRODUCT_EDITOR', 'GLOBAL_CATEGORY_EDITOR', 'DICTIONARY_MANAGER'
        ];

        if (adminOnlyViews.includes(view) && !isAdmin) {
            setViewInternal('ADMIN_LOGIN');
            window.history.replaceState({}, '', '/admin');
        }

        if (parsed.view === 'ADMIN_LOGIN' && isAdmin) {
            setViewInternal('ORDERS_DASHBOARD');
            window.history.replaceState({}, '', '/orders');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authReady, isAdmin, view]);

    // --- Browser Back/Forward ---
    useEffect(() => {
        const handlePopState = () => {
            const parsed = parsePath();

            if (parsed.view === 'ORDER_FORM' || parsed.view === 'CALCULATOR') {
                setViewInternal('HOME');
                return;
            }

            const adminOnlyViews: ViewState[] = [
                'ORDERS_DASHBOARD', 'ADMIN_DASHBOARD', 'ORDER_EDIT',
                'PRODUCT_EDITOR', 'GLOBAL_CATEGORY_EDITOR', 'DICTIONARY_MANAGER'
            ];
            if (adminOnlyViews.includes(parsed.view) && !isAdmin) {
                setViewInternal('ADMIN_LOGIN');
                window.history.replaceState({}, '', '/admin');
                return;
            }

            setViewInternal(parsed.view);
            setIsPublicView(!!parsed.isPublic);

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
        /** @deprecated Use navigate() instead */
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

        // Editors
        editingProduct, setEditingProduct,
        editingGlobalCategory, setEditingGlobalCategory,
        editingDictionary, setEditingDictionary,

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
