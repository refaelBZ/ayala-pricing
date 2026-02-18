import React from 'react';
import { ArrowLeft, Clock3, Phone, MapPin } from 'lucide-react';
import { AppState } from '../hooks/useAppState';
import { OrderFormState } from '../hooks/useAppState';

type Props = Pick<AppState, 'selectedOrder' | 'setSelectedOrder' | 'setView' | 'setOrderForm'>;

export const OrderDetailsView: React.FC<Props> = ({ selectedOrder, setView, setOrderForm }) => {
    if (!selectedOrder) return null;
    const order = selectedOrder;

    const handleEditClick = () => {
        // Pre-fill the form state before navigating to edit view
        const form: OrderFormState = {
            customerName: order.customer.name,
            customerPhone: order.customer.phone,
            customerEmail: order.customer.email || '',
            customerSource: order.customer.source || '',
            eventDate: order.eventDate,
            eventTime: order.delivery.time || '',
            deliveryType: order.delivery.type,
            deliveryAddress: order.delivery.address || '',
            orderNotes: order.internalNotes || '',
        };
        setOrderForm(form);
        setView('ORDER_EDIT');
    };

    return (
        <div className="min-h-screen bg-rose-50/30 flex flex-col pb-24">
            {/* Sub-header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur z-20 px-4 py-3 border-b border-rose-100 flex items-center justify-between shadow-sm">
                <button onClick={() => setView('ORDERS_DASHBOARD')} className="p-2 -mr-2 text-coffee-800 hover:bg-rose-50 rounded-full">
                    <ArrowLeft size={20} />
                </button>
                <span className="font-bold text-coffee-800">פרטי הזמנה</span>
                <button onClick={handleEditClick} className="text-rose-500 font-bold text-sm px-3 py-1 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors">
                    ערוך
                </button>
            </div>

            <div className="p-5 space-y-6">
                {/* Paper Slip */}
                <div className="bg-white p-6 shadow-sm border border-gray-100 mx-2 mt-4 rounded-t-2xl" style={{
                    clipPath: 'polygon(0 0, 100% 0, 100% 98%, 98% 100%, 96% 98%, 94% 100%, 92% 98%, 90% 100%, 88% 98%, 86% 100%, 84% 98%, 82% 100%, 80% 98%, 78% 100%, 76% 98%, 74% 100%, 72% 98%, 70% 100%, 68% 98%, 66% 100%, 64% 98%, 62% 100%, 60% 98%, 58% 100%, 56% 98%, 54% 100%, 52% 98%, 50% 100%, 48% 98%, 46% 100%, 44% 98%, 42% 100%, 40% 98%, 38% 100%, 36% 98%, 34% 100%, 32% 98%, 30% 100%, 28% 98%, 26% 100%, 24% 98%, 22% 100%, 20% 98%, 18% 100%, 16% 98%, 14% 100%, 12% 98%, 10% 100%, 8% 98%, 6% 100%, 4% 98%, 2% 100%, 0 98%)'
                }}>
                    {/* Header */}
                    <div className="text-center border-b-2 border-dashed border-gray-200 pb-6 mb-6">
                        <h2 className="font-heading font-bold text-2xl text-coffee-800 mb-2">{order.customer.name}</h2>
                        <div className="flex items-center justify-center gap-2 text-coffee-800/70 font-medium">
                            <Clock3 size={16} />
                            {new Date(order.eventDate).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                        {order.delivery.time && <div className="text-rose-500 font-bold mt-1 text-lg">{order.delivery.time}</div>}
                    </div>

                    {/* Items */}
                    <div className="space-y-6 mb-8">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-bold text-coffee-800 text-lg">{item.productName}</span>
                                    <span className="text-coffee-800 font-medium">₪{item.price}</span>
                                </div>
                                <div className="text-sm text-gray-600 whitespace-pre-wrap pl-4 border-r-2 border-rose-200">
                                    {item.details}
                                </div>
                                {item.selectedDetails?.map((detail, dIdx) => (
                                    <div key={dIdx} className="text-sm bg-rose-50 p-2 rounded-lg text-coffee-800/80 mr-4">
                                        <span className="font-bold block text-xs text-rose-400">{detail.label}:</span>
                                        {detail.values.join(', ')}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Total */}
                    <div className="border-t-2 border-dashed border-gray-200 pt-4 flex justify-between items-center mb-6">
                        <span className="font-bold text-coffee-800">סה"כ לתשלום</span>
                        <span className="font-heading font-bold text-2xl text-coffee-800">₪{order.totalPrice}</span>
                    </div>

                    {/* Contact */}
                    <div className="bg-gray-50 p-4 rounded-xl space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Phone size={14} />
                            <a href={`tel:${order.customer.phone}`} className="underline">{order.customer.phone}</a>
                        </div>

                        {order.customer.email && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <span className="font-bold text-xs text-rose-400">@</span>
                                <a href={`mailto:${order.customer.email}`} className="underline">{order.customer.email}</a>
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-gray-600">
                            <MapPin size={14} />
                            <span className="font-bold">{order.delivery.type === 'delivery' ? 'משלוח' : 'איסוף עצמי'}</span>
                            {order.delivery.type === 'delivery' && (
                                <span>: {order.delivery.address}</span>
                            )}
                        </div>

                        {order.customer.source && (
                            <div className="flex items-center gap-2 text-gray-600 text-xs">
                                <span className="text-gray-400">הגיע דרך:</span>
                                <span>{order.customer.source}</span>
                            </div>
                        )}

                        {order.internalNotes && (
                            <div className="pt-2 border-t border-gray-200 mt-2">
                                <span className="font-bold text-gray-500 text-xs block mb-1">הערות:</span>
                                {order.internalNotes}
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Badges */}
                <div className="flex gap-2 justify-center flex-wrap">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${order.paymentStatus === 'paid_full' ? 'bg-green-50 text-green-700 border-green-200' :
                        order.paymentStatus === 'deposit' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                        {order.paymentStatus === 'paid_full' ? 'שולם מלא' : order.paymentStatus === 'deposit' ? 'שולמה מקדמה' : 'לא שולם'}
                    </div>

                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${order.executionStatus === 'delivered' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        order.executionStatus === 'ready' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            order.executionStatus === 'in_progress' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                        {order.executionStatus === 'delivered' ? 'נמסר' : order.executionStatus === 'ready' ? 'מוכן' : order.executionStatus === 'in_progress' ? 'בהכנה' : 'טרם התחיל'}
                    </div>

                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${order.isInvoiceIssued ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                        {order.isInvoiceIssued ? 'הופקה קבלה' : 'ללא קבלה'}
                    </div>
                </div>
            </div>
        </div>
    );
};
