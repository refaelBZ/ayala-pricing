import { useState, useEffect } from 'react';
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

export const useAppState = () => {
    // --- Core State ---
    const [data, setData] = useState<AppData>({ products: [] });
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<ViewState>('HOME');
    const [toastMsg, setToastMsg] = useState('');

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
        view, setView,

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
    };
};

export type AppState = ReturnType<typeof useAppState>;
