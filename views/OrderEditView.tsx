import React from 'react';
import { Settings, Check } from 'lucide-react';
import { ExecutionStatus, PaymentStatus } from '../types';
import { AppState } from '../hooks/useAppState';
import { Input, TextArea, BaseSelect } from '../components/Input';
import { Button } from '../components/Button';
import { SubHeader } from '../components/SubHeader';
import { StickyFooter } from '../components/StickyFooter';
import { SectionHeader } from '../components/SectionHeader';
import { BaseCard } from '../components/BaseCard';
import { ToggleGroup } from '../components/ToggleGroup';
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
        <div className="min-h-screen flex flex-col pb-32">
            {/* Sub-header */}
            <SubHeader
                title="עריכת הזמנה"
                onBack={() => setView('ORDER_DETAILS')}
                backIcon="close"
            />

            <div className="p-6 space-y-6 max-w-2xl mx-auto w-full">

                {/* Status Management */}
                <BaseCard variant="outlined" className="space-y-4">
                    <SectionHeader icon={<Settings size={18} />}>
                        ניהול סטטוסים
                    </SectionHeader>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <BaseSelect
                            label="סטטוס ביצוע"
                            className="h-10 bg-accent-ghost/50"
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
                            className="h-10 bg-accent-ghost/50"
                            value={selectedOrder.paymentStatus}
                            onChange={(e) => setSelectedOrder({ ...selectedOrder, paymentStatus: e.target.value as PaymentStatus })}
                        >
                            <option value="unpaid">לא שולם</option>
                            <option value="deposit">שולמה מקדמה</option>
                            <option value="paid_full">שולם מלא</option>
                        </BaseSelect>
                        <BaseSelect
                            label="חשבונית מס"
                            className="h-10 bg-accent-ghost/50"
                            value={selectedOrder.isInvoiceIssued ? "true" : "false"}
                            onChange={(e) => setSelectedOrder({ ...selectedOrder, isInvoiceIssued: e.target.value === "true" })}
                        >
                            <option value="false">לא הופקה</option>
                            <option value="true">הופקה</option>
                        </BaseSelect>
                    </div>
                </BaseCard>

                {/* Event Details */}
                <div className="space-y-4">
                    <SectionHeader size="lg">פרטי אירוע</SectionHeader>
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
                    <SectionHeader size="lg">פרטי לקוח</SectionHeader>
                    <Input label="שם מלא" value={orderForm.customerName} onChange={e => setOrderForm({ ...orderForm, customerName: e.target.value })} className="bg-white" />
                    <Input label="טלפון" value={orderForm.customerPhone} onChange={e => setOrderForm({ ...orderForm, customerPhone: e.target.value })} className="bg-white" />
                    <Input label="אימייל" value={orderForm.customerEmail} onChange={e => setOrderForm({ ...orderForm, customerEmail: e.target.value })} className="bg-white" />
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
                <div className="space-y-4">
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
                        <Input placeholder="כתובת למשלוח" value={orderForm.deliveryAddress} onChange={e => setOrderForm({ ...orderForm, deliveryAddress: e.target.value })} className="bg-white" />
                    )}
                </div>

                {/* Notes */}
                <div className="space-y-4">
                    <SectionHeader size="lg">הערות פנימיות</SectionHeader>
                    <TextArea rows={4} className="bg-white" value={orderForm.orderNotes} onChange={e => setOrderForm({ ...orderForm, orderNotes: e.target.value })} />
                </div>
            </div>

            {/* Sticky Footer */}
            <StickyFooter>
                <Button fullWidth size="lg" onClick={handleUpdateOrder}>
                    <Check className="ml-2" />
                    שמור שינויים
                </Button>
            </StickyFooter>
        </div>
    );
};
