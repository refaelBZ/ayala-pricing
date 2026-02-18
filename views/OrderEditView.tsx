import React from 'react';
import { Settings } from 'lucide-react';
import { ExecutionStatus, PaymentStatus } from '../types';
import { AppState } from '../hooks/useAppState';
import { Input, TextArea } from '../components/Input';
import { saveOrderToFirestore } from '../services/storage';

type Props = Pick<AppState, 'selectedOrder' | 'setSelectedOrder' | 'orderForm' | 'setOrderForm' | 'setView' | 'showToast' | 'setLoading' | 'loadData'>;

export const OrderEditView: React.FC<Props> = ({
    selectedOrder, setSelectedOrder, orderForm, setOrderForm, setView, showToast, setLoading, loadData
}) => {
    if (!selectedOrder) return null;

    const handleUpdateOrder = async () => {
        setLoading(true);
        try {
            const updatedOrder = {
                ...selectedOrder,
                customer: {
                    ...selectedOrder.customer,
                    name: orderForm.customerName,
                    phone: orderForm.customerPhone,
                    email: orderForm.customerEmail,
                    source: orderForm.customerSource
                },
                eventDate: orderForm.eventDate,
                delivery: {
                    ...selectedOrder.delivery,
                    type: orderForm.deliveryType,
                    address: orderForm.deliveryAddress,
                    time: orderForm.eventTime
                },
                internalNotes: orderForm.orderNotes,
                // Status fields are updated via the dropdowns directly on selectedOrder
            };

            await saveOrderToFirestore(updatedOrder);
            showToast('הזמנה עודכנה בהצלחה');
            await loadData();
            setSelectedOrder(updatedOrder);
            setView('ORDER_DETAILS');
        } catch (e) {
            console.error(e);
            showToast('שגיאה בעדכון');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-rose-50/50 flex flex-col pb-32">
            {/* Sub-header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur z-20 px-4 py-3 border-b border-rose-100 flex items-center justify-between shadow-sm">
                <button onClick={() => setView('ORDER_DETAILS')} className="text-coffee-800 font-medium px-3 py-1 rounded-xl hover:bg-rose-50 transition-colors">ביטול</button>
                <span className="font-heading font-bold text-lg text-coffee-800">עריכת הזמנה</span>
                <button onClick={handleUpdateOrder} className="text-rose-500 font-bold px-3 py-1 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors">שמור</button>
            </div>

            <div className="p-6 space-y-6 max-w-2xl mx-auto w-full">

                {/* Status Management - EXCLUSIVE TO EDIT VIEW */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-rose-100/50 space-y-4">
                    <h3 className="font-heading font-bold text-coffee-800 flex items-center gap-2">
                        <Settings size={18} className="text-rose-400" />
                        ניהול סטטוסים
                    </h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <label className="text-xs font-bold text-coffee-800/60 mb-1 block">סטטוס ביצוע</label>
                            <select
                                className="w-full h-10 px-3 rounded-xl border border-rose-100 bg-rose-50/50 font-medium text-coffee-800 outline-none focus:border-rose-400"
                                value={selectedOrder.executionStatus}
                                onChange={(e) => setSelectedOrder({ ...selectedOrder, executionStatus: e.target.value as ExecutionStatus })}
                            >
                                <option value="pending">טרם התחיל</option>
                                <option value="in_progress">בהכנה</option>
                                <option value="ready">מוכן</option>
                                <option value="delivered">נמסר</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-coffee-800/60 mb-1 block">סטטוס תשלום</label>
                            <select
                                className="w-full h-10 px-3 rounded-xl border border-rose-100 bg-rose-50/50 font-medium text-coffee-800 outline-none focus:border-rose-400"
                                value={selectedOrder.paymentStatus}
                                onChange={(e) => setSelectedOrder({ ...selectedOrder, paymentStatus: e.target.value as PaymentStatus })}
                            >
                                <option value="unpaid">לא שולם</option>
                                <option value="deposit">שולמה מקדמה</option>
                                <option value="paid_full">שולם מלא</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-coffee-800/60 mb-1 block">חשבונית מס</label>
                            <select
                                className="w-full h-10 px-3 rounded-xl border border-rose-100 bg-rose-50/50 font-medium text-coffee-800 outline-none focus:border-rose-400"
                                value={selectedOrder.isInvoiceIssued ? "true" : "false"}
                                onChange={(e) => setSelectedOrder({ ...selectedOrder, isInvoiceIssued: e.target.value === "true" })}
                            >
                                <option value="false">לא הופקה</option>
                                <option value="true">הופקה</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Event Details */}
                <div className="space-y-4">
                    <h3 className="font-heading font-bold text-coffee-800 px-1 text-lg">פרטי אירוע</h3>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <Input type="date" label="תאריך" className="bg-white" value={orderForm.eventDate} onChange={e => setOrderForm({ ...orderForm, eventDate: e.target.value })} />
                        </div>
                        <div className="w-1/3">
                            <Input type="time" label="שעה" className="bg-white" value={orderForm.eventTime} onChange={e => setOrderForm({ ...orderForm, eventTime: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-4">
                    <h3 className="font-heading font-bold text-coffee-800 px-1 text-lg">פרטי לקוח</h3>
                    <Input label="שם מלא" value={orderForm.customerName} onChange={e => setOrderForm({ ...orderForm, customerName: e.target.value })} className="bg-white" />
                    <Input label="טלפון" value={orderForm.customerPhone} onChange={e => setOrderForm({ ...orderForm, customerPhone: e.target.value })} className="bg-white" />
                    <Input label="אימייל" value={orderForm.customerEmail} onChange={e => setOrderForm({ ...orderForm, customerEmail: e.target.value })} className="bg-white" />

                    <div className="relative">
                        <label className="block text-sm font-medium mb-1.5 text-coffee-800/80 mr-1">איך הגעת אלינו?</label>
                        <select
                            className="w-full h-12 px-5 rounded-2xl border border-rose-100 bg-white focus:border-rose-300 focus:outline-none appearance-none text-coffee-800/80"
                            value={orderForm.customerSource}
                            onChange={e => setOrderForm({ ...orderForm, customerSource: e.target.value })}
                        >
                            <option value="" disabled>בחר מקור...</option>
                            <option value="instagram">אינסטגרם</option>
                            <option value="facebook">פייסבוק</option>
                            <option value="whatsapp">וואטסאפ</option>
                            <option value="friend">חבר/ה</option>
                            <option value="other">אחר</option>
                        </select>
                    </div>
                </div>

                {/* Delivery Info */}
                <div className="space-y-4">
                    <h3 className="font-heading font-bold text-coffee-800 px-1 text-lg">משלוח / איסוף</h3>
                    <div className="flex gap-4 p-1 bg-white rounded-2xl shadow-sm border border-rose-50">
                        <button
                            onClick={() => setOrderForm({ ...orderForm, deliveryType: 'pickup' })}
                            className={`flex-1 py-3 rounded-xl font-medium transition-all ${orderForm.deliveryType === 'pickup' ? 'bg-rose-400 text-white shadow-md shadow-rose-200' : 'text-coffee-800/60 hover:bg-rose-50'}`}
                        >
                            איסוף עצמי
                        </button>
                        <button
                            onClick={() => setOrderForm({ ...orderForm, deliveryType: 'delivery' })}
                            className={`flex-1 py-3 rounded-xl font-medium transition-all ${orderForm.deliveryType === 'delivery' ? 'bg-rose-400 text-white shadow-md shadow-rose-200' : 'text-coffee-800/60 hover:bg-rose-50'}`}
                        >
                            משלוח
                        </button>
                    </div>
                    {orderForm.deliveryType === 'delivery' && (
                        <Input placeholder="כתובת למשלוח" value={orderForm.deliveryAddress} onChange={e => setOrderForm({ ...orderForm, deliveryAddress: e.target.value })} className="bg-white" />
                    )}
                </div>

                {/* Notes */}
                <div className="space-y-4">
                    <h3 className="font-heading font-bold text-coffee-800 px-1 text-lg">הערות פנימיות</h3>
                    <TextArea rows={4} className="bg-white" value={orderForm.orderNotes} onChange={e => setOrderForm({ ...orderForm, orderNotes: e.target.value })} />
                </div>
            </div>
        </div>
    );
};
