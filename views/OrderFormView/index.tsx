import React, { useState } from 'react';
import { Sparkles, Edit2, Calendar, User, MapPin, FileText, Check } from 'lucide-react';
import { Order } from '../../types';
import { AppState } from '../../hooks/useAppState';
import { Button } from '../../components/Button';
import { Input, TextArea, BaseSelect } from '../../components/Input';
import { SubHeader } from '../../components/SubHeader';
import { StickyFooter } from '../../components/StickyFooter';
import { SectionHeader } from '../../components/SectionHeader';
import { BaseCard } from '../../components/BaseCard';
import { ToggleGroup } from '../../components/ToggleGroup';
import { saveOrderToFirestore, generateOrderId } from '../../services/storage';
import styles from './style.module.scss';

type Props = Pick<AppState, 'data' | 'pendingOrder' | 'setPendingOrder' | 'dynamicDetails' | 'setDynamicDetails' | 'orderForm' | 'setOrderForm' | 'navigate' | 'showToast' | 'setLoading' | 'loadData' | 'resetOrderForm' | 'setSelectedOrder'>;

export const OrderFormView: React.FC<Props> = ({
    data, pendingOrder, setPendingOrder, dynamicDetails, setDynamicDetails, orderForm, setOrderForm, navigate, showToast, setLoading, loadData, resetOrderForm, setSelectedOrder
}) => {
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
                label: req.field.label || 'פרטים',
                values: dynamicDetails[req.id] || []
            }));
            // Strip internal UI-only fields before saving
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _inputRequests, _isLinked, ...cleanItem } = item;
            return { ...cleanItem, selectedDetails };
        });

        const newOrder: Order = {
            id: generateOrderId(),
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
            navigate('ORDER_DETAILS', { orderId: newOrder.id, order: newOrder });
        } catch (e) {
            console.error(e);
            showToast('שגיאה בשמירת ההזמנה');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <SubHeader title="סיכום והזמנה" onBack={() => navigate('HOME')} />

            <div className={styles.content}>

                {/* 1. Order Summary */}
                <BaseCard variant="outlined">
                    <SectionHeader icon={<Sparkles size={18} />}>סיכום הזמנה</SectionHeader>
                    <div className={styles.summaryList}>
                        {pendingOrder.items.map((item, idx) => (
                            <div key={idx} className={styles.summaryItem}>
                                <div className={styles.summaryHeader}>
                                    <div className={styles.summaryTitle}>
                                        <span>{item.productName}</span>
                                        {item._isLinked && (
                                            <span className={styles.addonBadge}>תוספת</span>
                                        )}
                                    </div>
                                    <span>₪{item.price * item.quantity}</span>
                                </div>
                                <div className={styles.summaryDetails}>
                                    {item.details}
                                </div>
                                {!item._isLinked && (
                                    <div className={styles.qtyRow}>
                                        <span className={styles.qtyLabel}>כמות</span>
                                        <div className={styles.qtyControls}>
                                            <button onClick={() => updateQuantity(idx, -1)} disabled={item.quantity <= 1} className={styles.qtyBtn}>−</button>
                                            <span className={styles.qtyValue}>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(idx, 1)} className={styles.qtyBtn}>+</button>
                                        </div>
                                    </div>
                                )}
                                {!item._isLinked && item.quantity > 1 && (
                                    <div className={styles.itemTotal}>₪{item.price} × {item.quantity}</div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className={styles.totalRow}>
                        <span className={styles.totalLabel}>סה"כ לתשלום</span>
                        <span className={styles.totalPrice}>₪{pendingOrder.totalPrice}</span>
                    </div>
                </BaseCard>

                {/* 1.5 Dynamic Inputs */}
                {pendingOrder.items.some(i => i._inputRequests && i._inputRequests.length > 0) && (
                    <BaseCard variant="outlined" className={styles.dynamicSection}>
                        <SectionHeader icon={<Edit2 size={18} />}>פרטים נוספים למוצר</SectionHeader>
                        {pendingOrder.items.map((item) =>
                            item._inputRequests?.map((req) => {
                                const effectiveCount = req.effectiveCount ?? req.field.count;
                                const dictChoices = req.field.type === 'dictionary' && req.field.dictionaryId
                                    ? data.globalDictionaries?.find(d => d.id === req.field.dictionaryId)?.choices
                                    : undefined;
                                const hasChoices = dictChoices && dictChoices.length > 0;

                                return (
                                    <div key={req.id} className={styles.dynamicItem}>
                                        <h4 className={styles.dynamicHeader}>
                                            {req.sourceName}
                                            <span className={styles.dynamicBadge}>{req.field.label}</span>
                                        </h4>
                                        <div className={styles.dynamicFields}>
                                            {Array.from({ length: effectiveCount || 1 }).map((_, i) => {
                                                const fieldKey = `${req.id}_${i}`;
                                                const storedValue = dynamicDetails[req.id]?.[i] || '';
                                                const isOther = otherMode[fieldKey] ?? false;

                                                const setValue = (val: string) => setDynamicDetails(prev => {
                                                    const updated = [...(prev[req.id] || [])];
                                                    updated[i] = val;
                                                    return { ...prev, [req.id]: updated };
                                                });

                                                if (hasChoices) {
                                                    return (
                                                        <div key={i} className={styles.fieldGroup}>
                                                            <BaseSelect
                                                                label={`${req.field.label} ${effectiveCount > 1 ? i + 1 : ''}`}
                                                                className={styles.formInput}
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
                                                                <option value="" disabled>בחר {req.field.label}...</option>
                                                                {dictChoices!.map(choice => (
                                                                    <option key={choice} value={choice}>{choice}</option>
                                                                ))}
                                                                <option value="__other__">אחר / הקלד בעצמך...</option>
                                                            </BaseSelect>
                                                            {isOther && (
                                                                <Input
                                                                    placeholder={`הכנס ${req.field.label} בחופשיות...`}
                                                                    className={styles.formInput}
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
                                                        label={effectiveCount > 1 ? `${req.field.label} ${i + 1}` : req.field.label}
                                                        placeholder={`הכנס ${req.field.label}...`}
                                                        className={styles.formInput}
                                                        value={storedValue}
                                                        onChange={e => setValue(e.target.value)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </BaseCard>
                )}

                {/* 2. Event Details */}
                <div className={styles.section}>
                    <SectionHeader icon={<Calendar size={20} />} size="lg">מתי האירוע?</SectionHeader>
                    <div className={styles.row}>
                        <div className={styles.colFlex}>
                            <Input type="date" label="תאריך *" required className={styles.formInput} value={orderForm.eventDate} onChange={e => setOrderForm({ ...orderForm, eventDate: e.target.value })} />
                        </div>
                        <div className={styles.colSmall}>
                            <Input type="time" label="שעה" className={styles.formInput} value={orderForm.eventTime} onChange={e => setOrderForm({ ...orderForm, eventTime: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* 3. Customer Info */}
                <div className={styles.section}>
                    <SectionHeader icon={<User size={20} />} size="lg">פרטים אישיים</SectionHeader>
                    <Input placeholder="שם מלא *" value={orderForm.customerName} onChange={e => setOrderForm({ ...orderForm, customerName: e.target.value })} className={styles.formInput} />
                    <Input type="tel" placeholder="טלפון *" value={orderForm.customerPhone} onChange={e => setOrderForm({ ...orderForm, customerPhone: e.target.value })} className={styles.formInput} />
                    <Input type="email" placeholder="אימייל (אופציונלי)" value={orderForm.customerEmail} onChange={e => setOrderForm({ ...orderForm, customerEmail: e.target.value })} className={styles.formInput} />
                    <BaseSelect value={orderForm.customerSource} onChange={e => setOrderForm({ ...orderForm, customerSource: e.target.value })}>
                        <option value="" disabled>איך הגעת אלינו?</option>
                        <option value="instagram">אינסטגרם</option>
                        <option value="facebook">פייסבוק</option>
                        <option value="whatsapp">וואטסאפ</option>
                        <option value="friend">חבר/ה</option>
                        <option value="other">אחר</option>
                    </BaseSelect>
                </div>

                {/* 4. Delivery */}
                <div className={styles.section}>
                    <SectionHeader icon={<MapPin size={20} />} size="lg">משלוח / איסוף</SectionHeader>
                    <ToggleGroup
                        options={[{ value: 'pickup', label: 'איסוף עצמי' }, { value: 'delivery', label: 'משלוח' }]}
                        value={orderForm.deliveryType}
                        onChange={(v) => setOrderForm({ ...orderForm, deliveryType: v as 'pickup' | 'delivery' })}
                    />
                    {orderForm.deliveryType === 'delivery' && (
                        <Input placeholder="כתובת למשלוח (עיר, רחוב ומספר בית)" value={orderForm.deliveryAddress} onChange={e => setOrderForm({ ...orderForm, deliveryAddress: e.target.value })} className={styles.formInput} />
                    )}
                </div>

                {/* 5. Notes */}
                <div className={styles.section}>
                    <SectionHeader icon={<FileText size={20} />} size="lg">הערות נוספות</SectionHeader>
                    <TextArea placeholder="בקשות מיוחדות, אלרגיות, וכו'..." rows={3} className={styles.inputWhite} value={orderForm.orderNotes} onChange={e => setOrderForm({ ...orderForm, orderNotes: e.target.value })} />
                </div>

                <StickyFooter>
                    <Button fullWidth size="lg" onClick={handleSubmitOrder}>
                        <Check className={styles.iconSpacer} />שמור הזמנה
                    </Button>
                </StickyFooter>
            </div>
        </div>
    );
};
