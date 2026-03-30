import React, { useEffect, useState } from 'react';
import { Settings, Check, Package } from 'lucide-react';
import { ExecutionStatus, PaymentStatus, OrderItem, FormField } from '../../types';
import { AppState } from '../../hooks/useAppState';
import { Input, TextArea, BaseSelect } from '../../components/Input';
import { Button } from '../../components/Button';
import { SubHeader } from '../../components/SubHeader';
import { StickyFooter } from '../../components/StickyFooter';
import { SectionHeader } from '../../components/SectionHeader';
import { BaseCard } from '../../components/BaseCard';
import { ToggleGroup } from '../../components/ToggleGroup';
import { saveOrderToFirestore } from '../../services/storage';
import styles from './style.module.scss';

type Props = Pick<AppState, 'data' | 'selectedOrder' | 'setSelectedOrder' | 'orderForm' | 'setOrderForm' | 'navigate' | 'showToast' | 'setLoading' | 'loadData'>;

export const OrderEditView: React.FC<Props> = ({
    data, selectedOrder, setSelectedOrder, orderForm, setOrderForm, navigate, showToast, setLoading, loadData
}) => {
    const [localItems, setLocalItems] = useState<OrderItem[]>([]);
    // detailOtherMode key: `${itemIdx}_${dIdx}_${vIdx}`
    const [detailOtherMode, setDetailOtherMode] = useState<Record<string, boolean>>({});

    /** Collect all FormFields defined for a product (base + all tiers + all option triggers). */
    const getProductFields = (productId: string): FormField[] => {
        const product = data.products.find(p => p.id === productId);
        if (!product) return [];
        const fields: FormField[] = [
            ...(product.baseFields ?? []),
            ...product.tiers.flatMap(t => t.inheritedFields ?? []),
            ...product.categories.flatMap(c =>
                c.options.flatMap(o => o.triggeredFields ?? [])
            ),
        ];
        return fields;
    };

    /** Returns dictionary choices for a given product + field label, or null if it's a plain text field. */
    const getDictChoices = (productId: string, label: string): string[] | null => {
        const field = getProductFields(productId).find(f => f.label === label);
        if (!field || field.type !== 'dictionary' || !field.dictionaryId) return null;
        const dict = data.globalDictionaries.find(d => d.id === field.dictionaryId);
        return dict?.choices ?? null;
    };

    if (!selectedOrder) return null;

    // Pre-fill form and items from the selected order
    useEffect(() => {
        setLocalItems(selectedOrder.items || []);
        setOrderForm({
            customerName: selectedOrder.customer.name,
            customerPhone: selectedOrder.customer.phone,
            customerEmail: selectedOrder.customer.email || '',
            customerSource: selectedOrder.customer.source || '',
            eventDate: selectedOrder.eventDate,
            eventTime: selectedOrder.delivery.time || '',
            deliveryType: selectedOrder.delivery.type,
            deliveryAddress: selectedOrder.delivery.address || '',
            orderNotes: selectedOrder.internalNotes || '',
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedOrder.id]);

    const totalPrice = localItems.reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0);

    const updateItem = (idx: number, patch: Partial<OrderItem>) => {
        setLocalItems(prev => prev.map((item, i) => i === idx ? { ...item, ...patch } : item));
    };

    const updateDetailValue = (itemIdx: number, detailIdx: number, valueIdx: number, val: string) => {
        setLocalItems(prev => prev.map((item, i) => {
            if (i !== itemIdx) return item;
            const updatedDetails = (item.selectedDetails ?? []).map((detail, dIdx) => {
                if (dIdx !== detailIdx) return detail;
                const updatedValues = [...detail.values];
                updatedValues[valueIdx] = val;
                return { ...detail, values: updatedValues };
            });
            return { ...item, selectedDetails: updatedDetails };
        }));
    };

    const handleUpdateOrder = async () => {
        setLoading(true);
        try {
            const updatedOrder = {
                ...selectedOrder,
                items: localItems,
                totalPrice,
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
            };

            await saveOrderToFirestore(updatedOrder);
            showToast('הזמנה עודכנה בהצלחה');
            await loadData();
            setSelectedOrder(updatedOrder);
            navigate('ORDER_DETAILS', { orderId: updatedOrder.id, order: updatedOrder });
        } catch (e) {
            console.error(e);
            showToast('שגיאה בעדכון');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <SubHeader
                title="עריכת הזמנה"
                onBack={() => navigate('ORDER_DETAILS', { orderId: selectedOrder.id, order: selectedOrder })}
                backIcon="close"
            />

            <div className={styles.content}>

                {/* Status Management */}
                <BaseCard variant="outlined" className={styles.statusSection}>
                    <SectionHeader icon={<Settings size={18} />}>ניהול סטטוסים</SectionHeader>
                    <div className={styles.statusGrid}>
                        <BaseSelect
                            label="סטטוס ביצוע"
                            value={selectedOrder.executionStatus}
                            onChange={(e) => setSelectedOrder({ ...selectedOrder, executionStatus: e.target.value as ExecutionStatus })}
                        >
                            <option value="pending">טרם התחיל</option>
                            <option value="in_progress">בהכנה</option>
                            <option value="ready">מוכן</option>
                            <option value="delivered">נמסר</option>
                        </BaseSelect>
                        <BaseSelect
                            label="סטטוס תשלום"
                            value={selectedOrder.paymentStatus}
                            onChange={(e) => setSelectedOrder({ ...selectedOrder, paymentStatus: e.target.value as PaymentStatus })}
                        >
                            <option value="unpaid">לא שולם</option>
                            <option value="deposit">שולמה מקדמה</option>
                            <option value="paid_full">שולם מלא</option>
                        </BaseSelect>
                        <BaseSelect
                            label="חשבונית מס"
                            value={selectedOrder.isInvoiceIssued ? 'true' : 'false'}
                            onChange={(e) => setSelectedOrder({ ...selectedOrder, isInvoiceIssued: e.target.value === 'true' })}
                        >
                            <option value="false">לא הופקה</option>
                            <option value="true">הופקה</option>
                        </BaseSelect>
                    </div>
                </BaseCard>

                {/* Order Items */}
                <div className={styles.section}>
                    <SectionHeader icon={<Package size={18} />} size="lg">פריטי הזמנה</SectionHeader>

                    {localItems.map((item, idx) => (
                        <BaseCard key={idx} variant="outlined" className={styles.itemCard}>
                            {item._isLinked && <span className={styles.addonBadge}>תוספת</span>}

                            <Input
                                label="שם מוצר"
                                value={item.productName}
                                className={styles.inputWhite}
                                onChange={e => updateItem(idx, { productName: e.target.value })}
                            />

                            <Input
                                label="פרטי הזמנה (אפשרויות שנבחרו)"
                                value={item.details || ''}
                                className={styles.inputWhite}
                                onChange={e => updateItem(idx, { details: e.target.value })}
                            />

                            {/* Quantity + Price row */}
                            <div className={styles.itemPriceRow}>
                                <div className={styles.qtyWrap}>
                                    <span className={styles.qtyLabel}>כמות</span>
                                    <div className={styles.qtyControls}>
                                        <button
                                            className={styles.qtyBtn}
                                            onClick={() => updateItem(idx, { quantity: Math.max(1, (item.quantity ?? 1) - 1) })}
                                            disabled={(item.quantity ?? 1) <= 1}
                                        >−</button>
                                        <span className={styles.qtyValue}>{item.quantity ?? 1}</span>
                                        <button
                                            className={styles.qtyBtn}
                                            onClick={() => updateItem(idx, { quantity: (item.quantity ?? 1) + 1 })}
                                        >+</button>
                                    </div>
                                </div>
                                <div className={styles.priceWrap}>
                                    <Input
                                        type="number"
                                        label="מחיר ליחידה (₪)"
                                        value={String(item.price)}
                                        className={styles.inputWhite}
                                        onChange={e => updateItem(idx, { price: Number(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            {/* Dynamic selected details (flavors, colors, etc.) */}
                            {item.selectedDetails && item.selectedDetails.length > 0 && (
                                <div className={styles.detailsSection}>
                                    <span className={styles.detailsTitle}>פרטים דינמיים</span>
                                    {item.selectedDetails.map((detail, dIdx) => {
                                        const choices = getDictChoices(item.productId, detail.label);
                                        return (
                                            <div key={dIdx} className={styles.detailGroup}>
                                                {detail.values.map((val, vIdx) => {
                                                    const modeKey = `${idx}_${dIdx}_${vIdx}`;
                                                    const isOther = detailOtherMode[modeKey] ?? false;
                                                    const fieldLabel = detail.values.length > 1
                                                        ? `${detail.label} ${vIdx + 1}`
                                                        : detail.label;

                                                    if (choices) {
                                                        return (
                                                            <div key={vIdx} className={styles.detailGroup}>
                                                                <BaseSelect
                                                                    label={fieldLabel}
                                                                    className={styles.inputWhite}
                                                                    value={isOther ? '__other__' : (val || '')}
                                                                    onChange={e => {
                                                                        if (e.target.value === '__other__') {
                                                                            setDetailOtherMode(prev => ({ ...prev, [modeKey]: true }));
                                                                            updateDetailValue(idx, dIdx, vIdx, '');
                                                                        } else {
                                                                            setDetailOtherMode(prev => ({ ...prev, [modeKey]: false }));
                                                                            updateDetailValue(idx, dIdx, vIdx, e.target.value);
                                                                        }
                                                                    }}
                                                                >
                                                                    <option value="" disabled>בחר {detail.label}...</option>
                                                                    {choices.map(choice => (
                                                                        <option key={choice} value={choice}>{choice}</option>
                                                                    ))}
                                                                    <option value="__other__">אחר / הקלד בעצמך...</option>
                                                                </BaseSelect>
                                                                {isOther && (
                                                                    <Input
                                                                        placeholder={`הכנס ${detail.label} בחופשיות...`}
                                                                        className={styles.inputWhite}
                                                                        value={val}
                                                                        onChange={e => updateDetailValue(idx, dIdx, vIdx, e.target.value)}
                                                                        autoFocus
                                                                    />
                                                                )}
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <Input
                                                            key={vIdx}
                                                            label={fieldLabel}
                                                            value={val}
                                                            className={styles.inputWhite}
                                                            onChange={e => updateDetailValue(idx, dIdx, vIdx, e.target.value)}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </BaseCard>
                    ))}

                    <div className={styles.totalRow}>
                        <span className={styles.totalLabel}>סה"כ לתשלום</span>
                        <span className={styles.totalPrice}>₪{totalPrice}</span>
                    </div>
                </div>

                {/* Event Details */}
                <div className={styles.section}>
                    <SectionHeader size="lg">פרטי אירוע</SectionHeader>
                    <div className={styles.row}>
                        <div className={styles.colFlex}>
                            <Input type="date" label="תאריך" className={styles.inputWhite} value={orderForm.eventDate} onChange={e => setOrderForm({ ...orderForm, eventDate: e.target.value })} />
                        </div>
                        <div className={styles.colSmall}>
                            <Input type="time" label="שעה" className={styles.inputWhite} value={orderForm.eventTime} onChange={e => setOrderForm({ ...orderForm, eventTime: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Customer Info */}
                <div className={styles.section}>
                    <SectionHeader size="lg">פרטי לקוח</SectionHeader>
                    <Input label="שם מלא" value={orderForm.customerName} onChange={e => setOrderForm({ ...orderForm, customerName: e.target.value })} className={styles.inputWhite} />
                    <Input label="טלפון" value={orderForm.customerPhone} onChange={e => setOrderForm({ ...orderForm, customerPhone: e.target.value })} className={styles.inputWhite} />
                    <Input label="אימייל" value={orderForm.customerEmail} onChange={e => setOrderForm({ ...orderForm, customerEmail: e.target.value })} className={styles.inputWhite} />
                    <BaseSelect
                        label="איך הגעת אלינו?"
                        value={orderForm.customerSource}
                        onChange={e => setOrderForm({ ...orderForm, customerSource: e.target.value })}
                    >
                        <option value="" disabled>בחר מקור...</option>
                        <option value="instagram">אינסטגרם</option>
                        <option value="facebook">פייסבוק</option>
                        <option value="whatsapp">וואטסאפ</option>
                        <option value="friend">חבר/ה</option>
                        <option value="other">אחר</option>
                    </BaseSelect>
                </div>

                {/* Delivery */}
                <div className={styles.section}>
                    <SectionHeader size="lg">משלוח / איסוף</SectionHeader>
                    <ToggleGroup
                        options={[
                            { value: 'pickup', label: 'איסוף עצמי' },
                            { value: 'delivery', label: 'משלוח' },
                        ]}
                        value={orderForm.deliveryType}
                        onChange={(v) => setOrderForm({ ...orderForm, deliveryType: v as 'pickup' | 'delivery' })}
                    />
                    {orderForm.deliveryType === 'delivery' && (
                        <Input placeholder="כתובת למשלוח" value={orderForm.deliveryAddress} onChange={e => setOrderForm({ ...orderForm, deliveryAddress: e.target.value })} className={styles.inputWhite} />
                    )}
                </div>

                {/* Internal Notes */}
                <div className={styles.section}>
                    <SectionHeader size="lg">הערות פנימיות</SectionHeader>
                    <TextArea rows={4} className={styles.inputWhite} value={orderForm.orderNotes} onChange={e => setOrderForm({ ...orderForm, orderNotes: e.target.value })} />
                </div>
            </div>

            <StickyFooter>
                <Button fullWidth size="lg" onClick={handleUpdateOrder}>
                    <Check className={styles.iconSpacer} />
                    שמור שינויים
                </Button>
            </StickyFooter>
        </div>
    );
};
