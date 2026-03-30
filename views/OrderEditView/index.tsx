import React, { useEffect } from 'react';
import { Settings, Check } from 'lucide-react';
import { ExecutionStatus, PaymentStatus } from '../../types';
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

type Props = Pick<AppState, 'selectedOrder' | 'setSelectedOrder' | 'orderForm' | 'setOrderForm' | 'navigate' | 'showToast' | 'setLoading' | 'loadData'>;

export const OrderEditView: React.FC<Props> = ({
    selectedOrder, setSelectedOrder, orderForm, setOrderForm, navigate, showToast, setLoading, loadData
}) => {
    if (!selectedOrder) return null;

    // Pre-fill the form with the current order values each time the selected order changes
    useEffect(() => {
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
            {/* Sub-header */}
            <SubHeader
                title="עריכת הזמנה"
                onBack={() => navigate('ORDER_DETAILS', { orderId: selectedOrder.id, order: selectedOrder })}
                backIcon="close"
            />

            <div className={styles.content}>

                {/* Status Management */}
                <BaseCard variant="outlined" className={styles.statusSection}>
                    <SectionHeader icon={<Settings size={18} />}>
                        ניהול סטטוסים
                    </SectionHeader>

                    <div className={styles.statusGrid}>
                        <BaseSelect
                            label="סטטוס ביצוע"
                            className={styles.statusSelect}
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
                            className={styles.statusSelect}
                            value={selectedOrder.paymentStatus}
                            onChange={(e) => setSelectedOrder({ ...selectedOrder, paymentStatus: e.target.value as PaymentStatus })}
                        >
                            <option value="unpaid">לא שולם</option>
                            <option value="deposit">שולמה מקדמה</option>
                            <option value="paid_full">שולם מלא</option>
                        </BaseSelect>
                        <BaseSelect
                            label="חשבונית מס"
                            className={styles.statusSelect}
                            value={selectedOrder.isInvoiceIssued ? "true" : "false"}
                            onChange={(e) => setSelectedOrder({ ...selectedOrder, isInvoiceIssued: e.target.value === "true" })}
                        >
                            <option value="false">לא הופקה</option>
                            <option value="true">הופקה</option>
                        </BaseSelect>
                    </div>
                </BaseCard>

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

                {/* Delivery Info */}
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

                {/* Notes */}
                <div className={styles.section}>
                    <SectionHeader size="lg">הערות פנימיות</SectionHeader>
                    <TextArea rows={4} className={styles.inputWhite} value={orderForm.orderNotes} onChange={e => setOrderForm({ ...orderForm, orderNotes: e.target.value })} />
                </div>
            </div>

            {/* Sticky Footer */}
            <StickyFooter>
                <Button fullWidth size="lg" onClick={handleUpdateOrder}>
                    <Check className={styles.iconSpacer} />
                    שמור שינויים
                </Button>
            </StickyFooter>
        </div>
    );
};
