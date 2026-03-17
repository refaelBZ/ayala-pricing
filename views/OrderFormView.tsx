import React, { useState } from 'react';
import { Sparkles, Edit2, Calendar, User, MapPin, FileText, Check } from 'lucide-react';
import { Order } from '../types';
import { AppState } from '../hooks/useAppState';
import { Button } from '../components/Button';
import { Input, TextArea, BaseSelect } from '../components/Input';
import { SubHeader } from '../components/SubHeader';
import { StickyFooter } from '../components/StickyFooter';
import { SectionHeader } from '../components/SectionHeader';
import { BaseCard } from '../components/BaseCard';
import { ToggleGroup } from '../components/ToggleGroup';
import { saveOrderToFirestore, generateUUID } from '../services/storage';

type Props = Pick<AppState, 'pendingOrder' | 'setPendingOrder' | 'dynamicDetails' | 'setDynamicDetails' | 'orderForm' | 'setOrderForm' | 'navigate' | 'showToast' | 'setLoading' | 'loadData' | 'resetOrderForm' | 'setSelectedOrder'>;

export const OrderFormView: React.FC<Props> = ({
    pendingOrder, setPendingOrder, dynamicDetails, setDynamicDetails, orderForm, setOrderForm, navigate, showToast, setLoading, loadData, resetOrderForm, setSelectedOrder
}) => {
    // Tracks which dropdown fields are in free-text "Other" mode: { [reqId_index]: true }
    const [otherMode, setOtherMode] = useState<Record<string, boolean>>({});

    const updateQuantity = (itemIndex: number, delta: number) => {
        if (!pendingOrder) return;
        const updatedItems = pendingOrder.items.map((item, i) => {
            if (i !== itemIndex) return item;
            return { ...item, quantity: Math.max(1, item.quantity + delta) };
        });
        const newTotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setPendingOrder({ items: updatedItems, totalPrice: newTotal });
    };
    if (!pendingOrder) return null;

    const handleSubmitOrder = async () => {
        if (!orderForm.customerName || !orderForm.customerPhone || !orderForm.eventDate) {
            showToast('נא למלא שדות חובה (שם, טלפון, תאריך)');
            return;
        }

        setLoading(true);

        const finalItems = pendingOrder.items.map(item => {
            const selectedDetails = (item._inputRequests || []).map(req => ({
                sourceName: req.sourceName,
                label: req.specs.label || 'פרטים',
                values: dynamicDetails[req.id] || []
            }));
            // Strip internal UI-only fields before saving
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _inputRequests, _isLinked, ...cleanItem } = item;
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

            // Navigate to the newly created order
            navigate('ORDER_DETAILS', { orderId: newOrder.id, order: newOrder });
        } catch (e) {
            console.error(e);
            showToast('שגיאה בשמירת ההזמנה');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col pb-32">
            {/* Sub-header */}
            <SubHeader title="סיכום והזמנה" onBack={() => navigate('HOME')} />

            <div className="p-6 space-y-6 max-w-2xl mx-auto w-full">

                {/* 1. Order Summary */}
                <BaseCard variant="outlined">
                    <SectionHeader icon={<Sparkles size={18} />}>
                        סיכום הזמנה
                    </SectionHeader>
                    <div className="mt-3 space-y-3">
                        {pendingOrder.items.map((item, idx) => (
                            <div key={idx} className="bg-accent-ghost/50 p-4 rounded-2xl text-body-sm space-y-3">
                                <div className="flex justify-between items-start font-bold text-primary">
                                    <div className="flex items-center gap-2">
                                        <span>{item.productName}</span>
                                        {item._isLinked && (
                                            <span className="text-micro font-semibold bg-accent-ghost text-accent px-2 py-0.5 rounded-full border border-light">
                                                תוספת
                                            </span>
                                        )}
                                    </div>
                                    <span>₪{item.price * item.quantity}</span>
                                </div>
                                <div className="text-secondary whitespace-pre-wrap leading-relaxed pl-4 border-r-2 border-default text-caption">
                                    {item.details}
                                </div>
                                {/* Quantity control — hidden for linked (add-on) items */}
                                {!item._isLinked && (
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-caption text-muted">כמות</span>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => updateQuantity(idx, -1)}
                                                disabled={item.quantity <= 1}
                                                className="w-8 h-8 rounded-full border border-default flex items-center justify-center text-lg font-bold text-secondary hover:bg-white disabled:opacity-30 transition-colors"
                                            >−</button>
                                            <span className="w-6 text-center font-bold text-primary">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(idx, 1)}
                                                className="w-8 h-8 rounded-full border border-default flex items-center justify-center text-lg font-bold text-secondary hover:bg-white transition-colors"
                                            >+</button>
                                        </div>
                                    </div>
                                )}
                                {!item._isLinked && item.quantity > 1 && (
                                    <div className="text-caption text-muted text-left">
                                        ₪{item.price} × {item.quantity}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-subtle flex justify-between items-center px-2">
                        <span className="font-medium text-primary">סה"כ לתשלום</span>
                        <span className="font-heading font-bold text-xl text-primary">₪{pendingOrder.totalPrice}</span>
                    </div>
                </BaseCard>

                {/* 1.5 Dynamic Inputs */}
                {pendingOrder.items.some(i => i._inputRequests && i._inputRequests.length > 0) && (
                    <BaseCard variant="outlined" className="space-y-4">
                        <SectionHeader icon={<Edit2 size={18} />}>
                            פרטים נוספים למוצר
                        </SectionHeader>
                        {pendingOrder.items.map((item) =>
                            item._inputRequests?.map((req) => (
                                <div key={req.id} className="bg-accent-ghost/30 p-4 rounded-2xl border border-light">
                                    <h4 className="font-bold text-primary mb-3 text-body-sm flex justify-between">
                                        {req.sourceName}
                                        <span className="text-caption font-normal text-accent bg-white/50 px-2 rounded-full">{req.specs.label}</span>
                                    </h4>
                                    <div className="space-y-3">
                                        {Array.from({ length: req.specs.count || 1 }).map((_, i) => {
                                            const fieldKey = `${req.id}_${i}`;
                                            const storedValue = dynamicDetails[req.id]?.[i] || '';
                                            const isOther = otherMode[fieldKey] ?? false;
                                            const hasChoices = req.specs.choices && req.specs.choices.length > 0;

                                            const setValue = (val: string) => setDynamicDetails(prev => {
                                                const updated = [...(prev[req.id] || [])];
                                                updated[i] = val;
                                                return { ...prev, [req.id]: updated };
                                            });

                                            if (hasChoices) {
                                                return (
                                                    <div key={i} className="space-y-2">
                                                        <BaseSelect
                                                            label={`${req.specs.label} ${i + 1}`}
                                                            className="bg-white h-10 text-body-sm"
                                                            value={isOther ? '__other__' : (storedValue || '')}
                                                            onChange={e => {
                                                                if (e.target.value === '__other__') {
                                                                    setOtherMode(prev => ({ ...prev, [fieldKey]: true }));
                                                                    setValue('');
                                                                } else {
                                                                    setOtherMode(prev => ({ ...prev, [fieldKey]: false }));
                                                                    setValue(e.target.value);
                                                                }
                                                            }}
                                                        >
                                                            <option value="" disabled>בחר {req.specs.label}...</option>
                                                            {req.specs.choices!.map(choice => (
                                                                <option key={choice} value={choice}>{choice}</option>
                                                            ))}
                                                            <option value="__other__">אחר / הקלד בעצמך...</option>
                                                        </BaseSelect>
                                                        {isOther && (
                                                            <Input
                                                                placeholder={`הכנס ${req.specs.label} בחופשיות...`}
                                                                className="bg-white h-10 text-body-sm"
                                                                value={storedValue}
                                                                onChange={e => setValue(e.target.value)}
                                                                autoFocus
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            }

                                            return (
                                                <Input
                                                    key={i}
                                                    label={`${req.specs.label} ${i + 1}`}
                                                    placeholder={`הכנס ${req.specs.label}...`}
                                                    className="bg-white h-10 text-body-sm"
                                                    value={storedValue}
                                                    onChange={e => setValue(e.target.value)}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </BaseCard>
                )}

                {/* 2. Event Details */}
                <div className="space-y-4">
                    <SectionHeader icon={<Calendar size={20} />} size="lg">
                        מתי האירוע?
                    </SectionHeader>
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
                    <SectionHeader icon={<User size={20} />} size="lg">
                        פרטים אישיים
                    </SectionHeader>
                    <Input placeholder="שם מלא *" value={orderForm.customerName} onChange={e => setOrderForm({ ...orderForm, customerName: e.target.value })} className="bg-white" />
                    <Input type="tel" placeholder="טלפון *" value={orderForm.customerPhone} onChange={e => setOrderForm({ ...orderForm, customerPhone: e.target.value })} className="bg-white" />
                    <Input type="email" placeholder="אימייל (אופציונלי)" value={orderForm.customerEmail} onChange={e => setOrderForm({ ...orderForm, customerEmail: e.target.value })} className="bg-white" />
                    <BaseSelect
                        value={orderForm.customerSource}
                        onChange={e => setOrderForm({ ...orderForm, customerSource: e.target.value })}
                    >
                        <option value="" disabled>איך הגעת אלינו?</option>
                        <option value="instagram">אינסטגרם</option>
                        <option value="facebook">פייסבוק</option>
                        <option value="whatsapp">וואטסאפ</option>
                        <option value="friend">חבר/ה</option>
                        <option value="other">אחר</option>
                    </BaseSelect>
                </div>

                {/* 4. Delivery */}
                <div className="space-y-4">
                    <SectionHeader icon={<MapPin size={20} />} size="lg">
                        משלוח / איסוף
                    </SectionHeader>
                    <ToggleGroup
                        options={[
                            { value: 'pickup', label: 'איסוף עצמי' },
                            { value: 'delivery', label: 'משלוח' },
                        ]}
                        value={orderForm.deliveryType}
                        onChange={(v) => setOrderForm({ ...orderForm, deliveryType: v as 'pickup' | 'delivery' })}
                    />
                    {orderForm.deliveryType === 'delivery' && (
                        <Input placeholder="כתובת למשלוח (עיר, רחוב ומספר בית)" value={orderForm.deliveryAddress} onChange={e => setOrderForm({ ...orderForm, deliveryAddress: e.target.value })} className="bg-white" />
                    )}
                </div>

                {/* 5. Notes */}
                <div className="space-y-4">
                    <SectionHeader icon={<FileText size={20} />} size="lg">
                        הערות נוספות
                    </SectionHeader>
                    <TextArea placeholder="בקשות מיוחדות, אלרגיות, וכו'..." rows={3} className="bg-white" value={orderForm.orderNotes} onChange={e => setOrderForm({ ...orderForm, orderNotes: e.target.value })} />
                </div>

                {/* Sticky Footer */}
                <StickyFooter>
                    <Button fullWidth size="lg" onClick={handleSubmitOrder}>
                        <Check className="ml-2" />
                        שמור הזמנה
                    </Button>
                </StickyFooter>
            </div>
        </div>
    );
};
