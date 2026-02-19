import React from 'react';
import { Clock3, Trash2, DollarSign, Receipt, Check } from 'lucide-react';
import { Order, ExecutionStatus, PaymentStatus } from '../types';
import { AppState } from '../hooks/useAppState';
import { saveOrderToFirestore, deleteOrderFromFirestore } from '../services/storage';

type Props = Pick<AppState, 'orders' | 'orderFilter' | 'setOrderFilter' | 'setView' | 'setSelectedOrder' | 'showToast' | 'setLoading' | 'loadData' | 'logoutAdmin'>;

const getStatusColor = (status: ExecutionStatus) => {
    switch (status) {
        case 'pending': return 'bg-gray-100 text-gray-600';
        case 'in_progress': return 'bg-orange-100 text-orange-600';
        case 'ready': return 'bg-yellow-100 text-yellow-700';
        case 'delivered': return 'bg-blue-100 text-blue-800';
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
    orders, orderFilter, setOrderFilter, setView, setSelectedOrder, showToast, setLoading, loadData, logoutAdmin
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
        <div className="min-h-screen bg-rose-50/30 flex flex-col pb-24">
            {/* Sub-header: title + filter chips */}
            <div className="sticky top-0 bg-white/95 backdrop-blur z-20 shadow-sm">
                {/* Title row */}
                <div className="flex justify-between items-center px-4 pt-4 pb-2">
                    <h2 className="font-heading font-bold text-2xl text-coffee-800">ניהול הזמנות</h2>

                </div>

                {/* Filter chips row */}
                <div className="flex gap-2 overflow-x-auto pb-3 px-4 hide-scrollbar">
                    {[
                        { id: 'all', label: 'הכל' },
                        { id: 'week', label: 'השבוע' },
                        { id: 'unpaid', label: '⚠️ לא שולם' },
                        { id: 'no_invoice', label: 'ממתין לקבלה' }
                    ].map(chip => (
                        <button
                            key={chip.id}
                            onClick={() => setOrderFilter(chip.id as any)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${orderFilter === chip.id
                                ? 'bg-coffee-800 text-white shadow-md'
                                : 'bg-white text-coffee-800/70 border border-rose-100'
                                }`}
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Order Cards */}
            <div className="p-4 space-y-4">
                {filteredOrders.length === 0 && (
                    <div className="text-center py-10 text-coffee-800/40">
                        <p>אין הזמנות להצגה</p>
                    </div>
                )}

                {filteredOrders.map(order => (
                    <div
                        key={order.id}
                        className="bg-white rounded-3xl p-5 shadow-soft border border-rose-50/50 relative overflow-hidden"
                    >
                        {/* Top Row */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2 text-coffee-800/80 font-medium text-sm">
                                <Clock3 size={16} className="text-rose-400" />
                                {new Date(order.eventDate).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'short' })}
                                {order.delivery.time && ` • ${order.delivery.time}`}
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(order.executionStatus)}`}>
                                {getStatusLabel(order.executionStatus)}
                            </span>
                        </div>

                        {/* Middle - clickable to go to details */}
                        <div
                            className="mb-4 cursor-pointer"
                            onClick={() => {
                                setSelectedOrder(order);
                                setView('ORDER_DETAILS');
                            }}
                        >
                            <h3 className="font-heading font-bold text-lg text-coffee-800 mb-1">{order.customer.name}</h3>
                            <div className="text-sm text-coffee-800/60 line-clamp-2">
                                {order.items.map(i => i.productName).join(', ')}
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="flex items-center justify-between border-t border-rose-50 pt-3">
                            <span className="font-heading font-bold text-lg text-coffee-800">₪{order.totalPrice}</span>

                            <div className="flex gap-2 items-center">
                                {/* Payment Badge */}
                                {order.paymentStatus === 'paid_full' ? (
                                    <span className="bg-green-50 text-green-600 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1">
                                        <Check size={10} /> שולם
                                    </span>
                                ) : order.paymentStatus === 'deposit' ? (
                                    <span className="bg-yellow-50 text-yellow-600 px-2 py-1 rounded-md text-[10px] font-bold">מקדמה</span>
                                ) : (
                                    <span className="bg-red-50 text-red-500 px-2 py-1 rounded-md text-[10px] font-bold">לא שולם</span>
                                )}

                                {order.isInvoiceIssued && (
                                    <span className="bg-blue-50 text-blue-500 px-2 py-1 rounded-md text-[10px] font-bold">קבלה</span>
                                )}

                                {/* Delete */}
                                <button
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="p-2 rounded-full bg-rose-50 text-rose-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
