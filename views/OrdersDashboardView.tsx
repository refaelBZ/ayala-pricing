import React from 'react';
import { Clock3, Trash2, Check } from 'lucide-react';
import { Order, ExecutionStatus } from '../types';
import { AppState } from '../hooks/useAppState';
import { saveOrderToFirestore, deleteOrderFromFirestore } from '../services/storage';
import { BaseCard } from '../components/BaseCard';
import { StatusBadge } from '../components/StatusBadge';
import { FilterChip } from '../components/FilterChip';
import { IconButton } from '../components/IconButton';

type Props = Pick<AppState, 'orders' | 'orderFilter' | 'setOrderFilter' | 'navigate' | 'setSelectedOrder' | 'showToast' | 'setLoading' | 'loadData' | 'logoutAdmin'>;

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const getStatusVariant = (status: ExecutionStatus): BadgeVariant => {
    switch (status) {
        case 'pending': return 'neutral';
        case 'in_progress': return 'warning';
        case 'ready': return 'info';
        case 'delivered': return 'success';
    }
};

const getStatusLabel = (status: ExecutionStatus) => {
    switch (status) {
        case 'pending': return 'טרם התחיל';
        case 'in_progress': return 'בהכנה';
        case 'ready': return 'מוכן לאיסוף';
        case 'delivered': return 'נמסר';
    }
};

export const OrdersDashboardView: React.FC<Props> = ({
    orders, orderFilter, setOrderFilter, navigate, setSelectedOrder, showToast, setLoading, loadData, logoutAdmin
}) => {
    const filteredOrders = orders.filter(order => {
        if (orderFilter === 'all') return true;
        if (orderFilter === 'unpaid') return order.paymentStatus !== 'paid_full';
        if (orderFilter === 'no_invoice') return !order.isInvoiceIssued;
        if (orderFilter === 'week') {
            const orderDate = new Date(order.eventDate);
            const today = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 7);
            return orderDate >= today && orderDate <= nextWeek;
        }
        return true;
    });

    const updateOrderStatus = async (order: Order, updates: Partial<Order>) => {
        setLoading(true);
        try {
            const updatedOrder = { ...order, ...updates };
            await saveOrderToFirestore(updatedOrder);
            showToast('הזמנה עודכנה');
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
            {/* Sub-header: title + filter chips */}
            <div className="sticky top-0 bg-white/95 backdrop-blur z-20 shadow-sm">
                {/* Title row */}
                <div className="flex justify-between items-center px-4 pt-4 pb-2">
                    <h2 className="text-heading-2">ניהול הזמנות</h2>
                </div>

                {/* Filter chips row */}
                <div className="flex gap-2 overflow-x-auto pb-3 px-4 hide-scrollbar">
                    {[
                        { id: 'all', label: 'הכל' },
                        { id: 'week', label: 'השבוע' },
                        { id: 'unpaid', label: '⚠️ לא שולם' },
                        { id: 'no_invoice', label: 'ממתין לקבלה' }
                    ].map(chip => (
                        <FilterChip
                            key={chip.id}
                            active={orderFilter === chip.id}
                            onClick={() => setOrderFilter(chip.id as any)}
                        >
                            {chip.label}
                        </FilterChip>
                    ))}
                </div>
            </div>

            {/* Order Cards */}
            <div className="p-4 space-y-4">
                {filteredOrders.length === 0 && (
                    <div className="text-center py-10 text-muted">
                        <p>אין הזמנות להצגה</p>
                    </div>
                )}

                {filteredOrders.map(order => (
                    <BaseCard key={order.id} variant="elevated" className="relative overflow-hidden">
                        {/* Top Row */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2 text-secondary font-medium text-sm">
                                <Clock3 size={16} className="text-accent-soft" />
                                {new Date(order.eventDate).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'short' })}
                                {order.delivery.time && ` • ${order.delivery.time}`}
                            </div>
                            <StatusBadge variant={getStatusVariant(order.executionStatus)}>
                                {getStatusLabel(order.executionStatus)}
                            </StatusBadge>
                        </div>

                        {/* Middle - clickable to go to details */}
                        <div
                            className="mb-4 cursor-pointer"
                            onClick={() => navigate('ORDER_DETAILS', { orderId: order.id, order })}
                        >
                            <h3 className="font-heading font-bold text-lg text-primary mb-1">{order.customer.name}</h3>
                            <div className="text-sm text-secondary line-clamp-2">
                                {order.items.map(i => i.productName).join(', ')}
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="flex items-center justify-between border-t border-subtle pt-3">
                            <span className="font-heading font-bold text-lg text-primary">₪{order.totalPrice}</span>

                            <div className="flex gap-2 items-center">
                                {/* Payment Badge */}
                                {order.paymentStatus === 'paid_full' ? (
                                    <StatusBadge variant="success">
                                        <Check size={10} /> שולם
                                    </StatusBadge>
                                ) : order.paymentStatus === 'deposit' ? (
                                    <StatusBadge variant="warning">מקדמה</StatusBadge>
                                ) : (
                                    <StatusBadge variant="danger">לא שולם</StatusBadge>
                                )}

                                {order.isInvoiceIssued && (
                                    <StatusBadge variant="info">קבלה</StatusBadge>
                                )}

                                {/* Delete */}
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
