import React from 'react';
import { ArrowLeft, Sparkles, Edit2, Calendar, User, MapPin, FileText, Check, ChevronRight } from 'lucide-react';
import { Order } from '../types';
import { AppState } from '../hooks/useAppState';
import { Button } from '../components/Button';
import { Input, TextArea } from '../components/Input';
import { saveOrderToFirestore, generateUUID } from '../services/storage';

type Props = Pick<AppState, 'pendingOrder' | 'dynamicDetails' | 'setDynamicDetails' | 'orderForm' | 'setOrderForm' | 'setView' | 'showToast' | 'setLoading' | 'loadData' | 'resetOrderForm'>;

export const OrderFormView: React.FC<Props> = ({
    pendingOrder, dynamicDetails, setDynamicDetails, orderForm, setOrderForm, setView, showToast, setLoading, loadData, resetOrderForm
}) => {
    if (!pendingOrder) return null;

    const handleSubmitOrder = async () => {
        if (!orderForm.customerName || !orderForm.customerPhone || !orderForm.eventDate) {
            showToast('נא למלא שדות חובה (שם, טלפון, תאריך)');
            return;
        }

        setLoading(true);

        const finalItems = pendingOrder.items.map(item => {
            const selectedDetails = (item._inputConfigs || []).map(opt => ({
                optionName: opt.name,
                label: opt.formInputs?.label || 'פרטים',
                values: dynamicDetails[opt.id] || []
            }));
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _inputConfigs, ...cleanItem } = item;
            return { ...cleanItem, selectedDetails };
        });

        const newOrder: Order = {
            id: generateUUID(),
            createdAt: new Date().toISOString(),
            executionStatus: 'pending',
            paymentStatus: 'unpaid',
            isInvoiceIssued: false,
            eventDate: orderForm.eventDate,
            customer: {
                name: orderForm.customerName,
                phone: orderForm.customerPhone,
                email: orderForm.customerEmail,
                source: orderForm.customerSource
            },
            delivery: {
                type: orderForm.deliveryType,
                address: orderForm.deliveryAddress,
                time: orderForm.eventTime
            },
            items: finalItems,
            totalPrice: pendingOrder.totalPrice,
            internalNotes: orderForm.orderNotes
        };

        try {
            await saveOrderToFirestore(newOrder);
            showToast('הזמנה נוצרה בהצלחה!');
            resetOrderForm();
            await loadData();
            setView('HOME');
        } catch (e) {
            console.error(e);
            showToast('שגיאה בשמירת ההזמנה');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-rose-50/50 flex flex-col pb-32">
            {/* Sub-header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur z-20 px-4 py-4 border-b border-rose-100 flex items-center gap-4 shadow-sm">
                <button onClick={() => setView('CALCULATOR')} className="p-2 -mr-2 text-coffee-800/60 hover:text-coffee-800 hover:bg-rose-50 rounded-full transition-colors">
                    <ArrowLeft />
                </button>
                <h2 className="font-heading font-bold text-lg text-coffee-800">סיכום והזמנה</h2>
            </div>

            <div className="p-6 space-y-6 max-w-2xl mx-auto w-full">

                {/* 1. Order Summary */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-rose-100/50">
                    <h3 className="font-heading font-bold text-coffee-800 mb-3 flex items-center gap-2">
                        <Sparkles size={18} className="text-rose-400" />
                        סיכום הזמנה
                    </h3>
                    {pendingOrder.items.map((item, idx) => (
                        <div key={idx} className="bg-rose-50/50 p-4 rounded-2xl text-sm space-y-2">
                            <div className="flex justify-between font-bold text-coffee-800">
                                <span>{item.productName}</span>
                                <span>₪{item.price}</span>
                            </div>
                            <div className="text-coffee-800/70 whitespace-pre-wrap leading-relaxed pl-4 border-r-2 border-rose-200 text-xs">
                                {item.details}
                            </div>
                        </div>
                    ))}
                    <div className="mt-4 pt-4 border-t border-rose-50 flex justify-between items-center px-2">
                        <span className="font-medium text-coffee-800">סה"כ לתשלום</span>
                        <span className="font-heading font-bold text-xl text-coffee-800">₪{pendingOrder.totalPrice}</span>
                    </div>
                </div>

                {/* 1.5 Dynamic Inputs */}
                {pendingOrder.items.some(i => i._inputConfigs && i._inputConfigs.length > 0) && (
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-rose-100/50 space-y-4">
                        <h3 className="font-heading font-bold text-coffee-800 flex items-center gap-2">
                            <Edit2 size={18} className="text-rose-400" />
                            פרטים נוספים למוצר
                        </h3>
                        {pendingOrder.items.map((item) =>
                            item._inputConfigs?.map((opt) => (
                                <div key={opt.id} className="bg-rose-50/30 p-4 rounded-2xl border border-rose-100">
                                    <h4 className="font-bold text-coffee-800 mb-3 text-sm">{opt.name}</h4>
                                    <div className="space-y-3">
                                        {Array.from({ length: opt.formInputs?.count || 1 }).map((_, i) => (
                                            <Input
                                                key={i}
                                                label={`${opt.formInputs?.label || 'פרט'} ${i + 1}`}
                                                placeholder={`הכנס ${opt.formInputs?.label || 'ערך'}...`}
                                                className="bg-white h-10 text-sm"
                                                value={dynamicDetails[opt.id]?.[i] || ''}
                                                onChange={(e) => {
                                                    setDynamicDetails(prev => {
                                                        const current = prev[opt.id] || [];
                                                        const updated = [...current];
                                                        updated[i] = e.target.value;
                                                        return { ...prev, [opt.id]: updated };
                                                    });
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* 2. Event Details */}
                <div className="space-y-4">
                    <h3 className="font-heading font-bold text-coffee-800 px-1 text-lg flex items-center gap-2">
                        <Calendar size={20} className="text-rose-400" />
                        מתי האירוע?
                    </h3>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <Input type="date" label="תאריך *" required className="bg-white" value={orderForm.eventDate} onChange={e => setOrderForm({ ...orderForm, eventDate: e.target.value })} />
                        </div>
                        <div className="w-1/3">
                            <Input type="time" label="שעה" className="bg-white" value={orderForm.eventTime} onChange={e => setOrderForm({ ...orderForm, eventTime: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* 3. Customer Info */}
                <div className="space-y-4">
                    <h3 className="font-heading font-bold text-coffee-800 px-1 text-lg flex items-center gap-2">
                        <User size={20} className="text-rose-400" />
                        פרטים אישיים
                    </h3>
                    <Input placeholder="שם מלא *" value={orderForm.customerName} onChange={e => setOrderForm({ ...orderForm, customerName: e.target.value })} className="bg-white" />
                    <Input type="tel" placeholder="טלפון *" value={orderForm.customerPhone} onChange={e => setOrderForm({ ...orderForm, customerPhone: e.target.value })} className="bg-white" />
                    <Input type="email" placeholder="אימייל (אופציונלי)" value={orderForm.customerEmail} onChange={e => setOrderForm({ ...orderForm, customerEmail: e.target.value })} className="bg-white" />
                    <div className="relative">
                        <select
                            className="w-full h-12 px-5 rounded-2xl border border-rose-100 bg-white focus:border-rose-300 focus:outline-none appearance-none text-coffee-800/80"
                            value={orderForm.customerSource}
                            onChange={e => setOrderForm({ ...orderForm, customerSource: e.target.value })}
                        >
                            <option value="" disabled>איך הגעת אלינו?</option>
                            <option value="instagram">אינסטגרם</option>
                            <option value="facebook">פייסבוק</option>
                            <option value="whatsapp">וואטסאפ</option>
                            <option value="friend">חבר/ה</option>
                            <option value="other">אחר</option>
                        </select>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-coffee-800/40">
                            <ChevronRight className="rotate-90" size={16} />
                        </div>
                    </div>
                </div>

                {/* 4. Delivery */}
                <div className="space-y-4">
                    <h3 className="font-heading font-bold text-coffee-800 px-1 text-lg flex items-center gap-2">
                        <MapPin size={20} className="text-rose-400" />
                        משלוח / איסוף
                    </h3>
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
                        <Input placeholder="כתובת למשלוח (עיר, רחוב ומספר בית)" value={orderForm.deliveryAddress} onChange={e => setOrderForm({ ...orderForm, deliveryAddress: e.target.value })} className="bg-white" />
                    )}
                </div>

                {/* 5. Notes */}
                <div className="space-y-4">
                    <h3 className="font-heading font-bold text-coffee-800 px-1 text-lg flex items-center gap-2">
                        <FileText size={20} className="text-rose-400" />
                        הערות נוספות
                    </h3>
                    <TextArea placeholder="בקשות מיוחדות, אלרגיות, וכו'..." rows={3} className="bg-white" value={orderForm.orderNotes} onChange={e => setOrderForm({ ...orderForm, orderNotes: e.target.value })} />
                </div>

                <Button fullWidth onClick={handleSubmitOrder} className="h-14 text-lg mt-4 shadow-xl shadow-rose-400/20">
                    <Check className="ml-2" />
                    שמור הזמנה
                </Button>
            </div>
        </div>
    );
};
