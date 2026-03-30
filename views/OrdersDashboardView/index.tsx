import React from 'react';
import { Clock3, Trash2, Pencil, X } from 'lucide-react';
import { Order, ExecutionStatus, PaymentStatus } from '../../types';
import { AppState } from '../../hooks/useAppState';
import { saveOrderToFirestore, deleteOrderFromFirestore } from '../../services/storage';
import { BaseCard } from '../../components/BaseCard';
import { IconButton } from '../../components/IconButton';
import styles from './style.module.scss';

type Props = Pick<AppState, 'orders' | 'orderFilter' | 'setOrderFilter' | 'navigate' | 'setSelectedOrder' | 'showToast' | 'setLoading' | 'loadData' | 'logoutAdmin'>;

// ─── Filter chip definitions ──────────────────────────────────────────────────
const FILTER_CHIPS = [
    { id: 'week',       label: '📅 השבוע' },
    { id: 'unpaid',     label: '⚠️ לא שולם' },
    { id: 'deposit',    label: '🔶 מקדמה בלבד' },
    { id: 'no_invoice', label: '🧾 ממתין לקבלה' },
    { id: 'delivered',  label: '✅ הושלמו' },
];

const executionClass = (s: ExecutionStatus) => {
    return `${styles.statusSelect} ${styles[s]}`;
};

const paymentClass = (s: PaymentStatus) => {
    return `${styles.statusSelect} ${styles[s]}`;
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
        <div className={styles.container}>
            {/* Sticky header */}
            <div className={styles.stickyHeader}>
                <div className={styles.headerRow}>
                    <h2 className={styles.title}>ניהול הזמנות</h2>
                    {activeFilters.length > 0 && (
                        <button
                            onClick={() => setOrderFilter([])}
                            className={styles.clearFilterBtn}
                        >
                            <X size={13} />
                            נקה סינון
                        </button>
                    )}
                </div>

                {/* Multi-select filter chips + mode toggle */}
                <div className={styles.filtersRow}>
                    {FILTER_CHIPS.map(chip => {
                        const isActive = activeFilters.includes(chip.id);
                        return (
                            <button
                                key={chip.id}
                                onClick={() => toggleFilter(chip.id)}
                                className={`${styles.chip} ${isActive ? styles.active : styles.inactive}`}
                            >
                                {chip.label}
                            </button>
                        );
                    })}

                    {/* Separator */}
                    <div className={styles.separator} />

                    {/* Multi-mode toggle */}
                    <label className={styles.modeToggleLabel}>
                        <input
                            type="checkbox"
                            checked={multiMode}
                            onChange={e => handleMultiModeToggle(e.target.checked)}
                            className={`${styles.checkbox} accent-[var(--color-primary)]`}
                        />
                        שלב סינונים
                    </label>
                </div>

                {/* Active filter summary */}
                {activeFilters.length > 1 && (
                    <p className={styles.filtersSummary}>
                        מציג הזמנות שעומדות בכל {activeFilters.length} התנאים יחד
                    </p>
                )}
            </div>

            {/* Order Cards */}
            <div className={styles.cardsList}>
                {filteredOrders.length === 0 && (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyText}>אין הזמנות התואמות את הסינון</p>
                        {activeFilters.length > 0 && (
                            <button
                                onClick={() => setOrderFilter([])}
                                className={styles.emptyLink}
                            >
                                הצג הכל
                            </button>
                        )}
                    </div>
                )}

                {filteredOrders.map(order => (
                    <BaseCard key={order.id} variant="elevated" className={styles.card}>

                        {/* Row 1: date + customer name (clickable → details) */}
                        <div
                            className={styles.cardClickable}
                            onClick={() => navigate('ORDER_DETAILS', { orderId: order.id, order })}
                        >
                            <div className={styles.cardDateRow}>
                                <Clock3 size={15} />
                                {new Date(order.eventDate).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'short' })}
                                {order.delivery.time && ` • ${order.delivery.time}`}
                            </div>
                            <h3 className={styles.cardCustomer}>{order.customer.name}</h3>
                            <div className={styles.cardItemsPreview}>
                                {order.items.map(i => i.productName).join(', ')}
                            </div>
                        </div>

                        {/* Row 2: inline status selects */}
                        <div className={styles.statusControlsRow}>
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
                                className={`${styles.statusSelect} ${order.isInvoiceIssued ? styles.invoiceIssued : styles.invoiceMissing}`}
                            >
                                {order.isInvoiceIssued ? '✓ קבלה' : 'לא נשלחה קבלה'}
                            </button>
                        </div>

                        {/* Row 3: price + action buttons */}
                        <div className={styles.actionRow}>
                            <span className={styles.actionPrice}>₪{order.totalPrice}</span>
                            <div className={styles.actionButtons}>
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
