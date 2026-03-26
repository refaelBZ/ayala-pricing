import React from 'react';
import { Clock3, Trash2, Pencil, X } from 'lucide-react';
import { Order, ExecutionStatus, PaymentStatus } from '../types';
import { AppState } from '../hooks/useAppState';
import { saveOrderToFirestore, deleteOrderFromFirestore } from '../services/storage';
import { BaseCard } from '../components/BaseCard';
import { IconButton } from '../components/IconButton';

type Props = Pick<AppState, 'orders' | 'orderFilter' | 'setOrderFilter' | 'navigate' | 'setSelectedOrder' | 'showToast' | 'setLoading' | 'loadData' | 'logoutAdmin'>;

// ─── Filter chip definitions ──────────────────────────────────────────────────
const FILTER_CHIPS = [
    { id: 'week',       label: '📅 השבוע' },
    { id: 'unpaid',     label: '⚠️ לא שולם' },
    { id: 'deposit',    label: '🔶 מקדמה בלבד' },
    { id: 'no_invoice', label: '🧾 ממתין לקבלה' },
    { id: 'delivered',  label: '✅ הושלמו' },
];

// ─── Inline select styles ─────────────────────────────────────────────────────
const selectBase = 'appearance-none cursor-pointer rounded-xl border text-xs font-semibold px-2.5 py-1.5 transition-colors duration-base focus:outline-none focus:ring-2 focus:ring-offset-1';

const executionClass = (s: ExecutionStatus) => {
    const map: Record<ExecutionStatus, string> = {
        pending:     'bg-neutral-bg text-neutral-text border-neutral-border focus:ring-neutral-border',
        in_progress: 'bg-warning-bg text-warning-text border-warning-border focus:ring-warning-border',
        ready:       'bg-info-bg text-info-text border-info-border focus:ring-info-border',
        delivered:   'bg-success-bg text-success-text border-success-border focus:ring-success-border',
    };
    return `${selectBase} ${map[s]}`;
};

const paymentClass = (s: PaymentStatus) => {
    const map: Record<PaymentStatus, string> = {
        unpaid:    'bg-danger-bg text-danger-text border-danger-border focus:ring-danger-border',
        deposit:   'bg-warning-bg text-warning-text border-warning-border focus:ring-warning-border',
        paid_full: 'bg-success-bg text-success-text border-success-border focus:ring-success-border',
    };
    return `${selectBase} ${map[s]}`;
};

export const OrdersDashboardView: React.FC<Props> = ({
    orders, orderFilter, setOrderFilter, navigate, setSelectedOrder, showToast, setLoading, loadData,
}) => {
    const [multiMode, setMultiMode] = React.useState(false);

    // ─── Toggle a single filter on/off ────────────────────────────────────────
    const toggleFilter = (id: string) => {
        if (!multiMode) {
            // Tab mode: clicking active chip clears it, otherwise set exclusively
            setOrderFilter((prev: string[]) => prev.includes(id) ? [] : [id]);
        } else {
            // Multi mode: toggle independently
            setOrderFilter((prev: string[]) =>
                prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
            );
        }
    };

    // Switching to tab mode: collapse to at most the first active filter
    const handleMultiModeToggle = (enabled: boolean) => {
        setMultiMode(enabled);
        if (!enabled) {
            setOrderFilter((prev: string[]) => prev.length > 1 ? [prev[0]] : prev);
        }
    };

    const activeFilters = orderFilter as string[];
    const showDelivered = activeFilters.includes('delivered');

    // ─── AND filter logic ─────────────────────────────────────────────────────
    const filteredOrders = orders.filter(order => {
        // Delivered orders are only visible when the 'delivered' chip is active
        if (!showDelivered && order.executionStatus === 'delivered') return false;
        if (showDelivered && order.executionStatus !== 'delivered') return false;

        // Apply remaining active chips as AND conditions (skip 'delivered')
        for (const f of activeFilters) {
            if (f === 'delivered') continue;
            if (f === 'week') {
                const orderDate = new Date(order.eventDate);
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
                if (orderDate < today || orderDate > nextWeek) return false;
            }
            if (f === 'unpaid'     && order.paymentStatus !== 'unpaid')    return false;
            if (f === 'deposit'    && order.paymentStatus !== 'deposit')   return false;
            if (f === 'no_invoice' && order.isInvoiceIssued)               return false;
        }
        return true;
    });

    // ─── Firestore helpers ────────────────────────────────────────────────────
    const updateOrderStatus = async (order: Order, updates: Partial<Order>) => {
        setLoading(true);
        try {
            await saveOrderToFirestore({ ...order, ...updates });
            showToast('עודכן');
            await loadData();
        } catch (e) {
            console.error(e);
            showToast('שגיאה בעדכון');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (window.confirm('למחוק את ההזמנה לצמיתות?')) {
            setLoading(true);
            await deleteOrderFromFirestore(orderId);
            await loadData();
            setLoading(false);
            showToast('הזמנה נמחקה');
        }
    };

    return (
        <div className="min-h-screen flex flex-col pb-24">
            {/* Sticky header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur z-20 shadow-sm">
                <div className="flex justify-between items-center px-4 pt-4 pb-2">
                    <h2 className="text-heading-2">ניהול הזמנות</h2>
                    {activeFilters.length > 0 && (
                        <button
                            onClick={() => setOrderFilter([])}
                            className="flex items-center gap-1 text-caption text-accent hover:text-danger-text transition-colors"
                        >
                            <X size={13} />
                            נקה סינון
                        </button>
                    )}
                </div>

                {/* Multi-select filter chips + mode toggle */}
                <div className="flex gap-2 overflow-x-auto pb-3 px-4 hide-scrollbar items-center">
                    {FILTER_CHIPS.map(chip => {
                        const isActive = activeFilters.includes(chip.id);
                        return (
                            <button
                                key={chip.id}
                                onClick={() => toggleFilter(chip.id)}
                                className={`
                                    shrink-0 px-3 py-1.5 rounded-full text-body-sm font-semibold
                                    border transition-all duration-base whitespace-nowrap
                                    ${isActive
                                        ? 'bg-primary text-on-primary border-primary shadow-primary-glow scale-[1.02]'
                                        : 'bg-white text-secondary border-default hover:border-accent-soft hover:text-primary'
                                    }
                                `}
                            >
                                {chip.label}
                            </button>
                        );
                    })}

                    {/* Separator */}
                    <div className="shrink-0 w-px h-5 bg-border-subtle mx-1" />

                    {/* Multi-mode toggle */}
                    <label className="shrink-0 flex items-center gap-1.5 cursor-pointer text-caption text-secondary whitespace-nowrap select-none">
                        <input
                            type="checkbox"
                            checked={multiMode}
                            onChange={e => handleMultiModeToggle(e.target.checked)}
                            className="accent-[var(--color-primary)] rounded"
                        />
                        שלב סינונים
                    </label>
                </div>

                {/* Active filter summary */}
                {activeFilters.length > 1 && (
                    <p className="text-micro text-muted pb-2 px-4">
                        מציג הזמנות שעומדות בכל {activeFilters.length} התנאים יחד
                    </p>
                )}
            </div>

            {/* Order Cards */}
            <div className="p-4 space-y-4">
                {filteredOrders.length === 0 && (
                    <div className="text-center py-10 text-muted space-y-2">
                        <p className="text-body-base">אין הזמנות התואמות את הסינון</p>
                        {activeFilters.length > 0 && (
                            <button
                                onClick={() => setOrderFilter([])}
                                className="text-caption text-accent underline"
                            >
                                הצג הכל
                            </button>
                        )}
                    </div>
                )}

                {filteredOrders.map(order => (
                    <BaseCard key={order.id} variant="elevated" className="relative overflow-hidden space-y-3">

                        {/* Row 1: date + customer name (clickable → details) */}
                        <div
                            className="cursor-pointer"
                            onClick={() => navigate('ORDER_DETAILS', { orderId: order.id, order })}
                        >
                            <div className="flex items-center gap-2 text-secondary font-medium text-sm mb-1">
                                <Clock3 size={15} className="text-accent-soft" />
                                {new Date(order.eventDate).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'short' })}
                                {order.delivery.time && ` • ${order.delivery.time}`}
                            </div>
                            <h3 className="font-heading font-bold text-lg text-primary leading-tight">{order.customer.name}</h3>
                            <div className="text-sm text-secondary line-clamp-1 mt-0.5">
                                {order.items.map(i => i.productName).join(', ')}
                            </div>
                        </div>

                        {/* Row 2: inline status selects */}
                        <div className="flex flex-wrap gap-2 items-center">
                            <select
                                className={executionClass(order.executionStatus)}
                                value={order.executionStatus}
                                onClick={e => e.stopPropagation()}
                                onChange={e => updateOrderStatus(order, { executionStatus: e.target.value as ExecutionStatus })}
                            >
                                <option value="pending">טרם התחיל</option>
                                <option value="in_progress">בהכנה</option>
                                <option value="ready">מוכן לאיסוף</option>
                                <option value="delivered">נמסר</option>
                            </select>

                            <select
                                className={paymentClass(order.paymentStatus)}
                                value={order.paymentStatus}
                                onClick={e => e.stopPropagation()}
                                onChange={e => updateOrderStatus(order, { paymentStatus: e.target.value as PaymentStatus })}
                            >
                                <option value="unpaid">לא שולם</option>
                                <option value="deposit">מקדמה</option>
                                <option value="paid_full">שולם במלואו</option>
                            </select>

                            <button
                                onClick={e => {
                                    e.stopPropagation();
                                    updateOrderStatus(order, { isInvoiceIssued: !order.isInvoiceIssued });
                                }}
                                className={`${selectBase} ${order.isInvoiceIssued
                                    ? 'bg-info-bg text-info-text border-info-border'
                                    : 'bg-neutral-bg text-neutral-text border-neutral-border'
                                }`}
                            >
                                {order.isInvoiceIssued ? '✓ קבלה' : 'לא נשלחה קבלה'}
                            </button>
                        </div>

                        {/* Row 3: price + action buttons */}
                        <div className="flex items-center justify-between border-t border-subtle pt-2">
                            <span className="font-heading font-bold text-lg text-primary">₪{order.totalPrice}</span>
                            <div className="flex gap-1 items-center">
                                <IconButton
                                    icon={<Pencil size={16} />}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedOrder(order);
                                        navigate('ORDER_EDIT', { orderId: order.id, order });
                                    }}
                                    label="ערוך הזמנה"
                                />
                                <IconButton
                                    icon={<Trash2 size={16} />}
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDeleteOrder(order.id)}
                                    label="מחק הזמנה"
                                />
                            </div>
                        </div>

                    </BaseCard>
                ))}
            </div>
        </div>
    );
};
