import React from 'react';
import { ArrowRight, Edit, Phone, Mail, MapPin, Share2, Copy, Clock } from 'lucide-react';
import { AppState } from '../hooks/useAppState';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { IconButton } from '../components/IconButton';

type Props = Pick<AppState, 'selectedOrder' | 'navigate' | 'isPublicView' | 'showToast'>;

export const OrderDetailsView: React.FC<Props> = ({
    selectedOrder,
    navigate,
    isPublicView,
    showToast
}) => {
    if (!selectedOrder) {
        return (
            <div className="min-h-screen flex items-center justify-center text-muted">
                <p>הזמנה לא נמצאה</p>
            </div>
        );
    }

    const {
        customer,
        eventDate,
        delivery,
        items,
        totalPrice,
        internalNotes,
        executionStatus,
        paymentStatus,
        isInvoiceIssued,
        id
    } = selectedOrder;

    const handleShareWhatsApp = () => {
        const url = `${window.location.origin}/orders/${id}`;
        const text = `היי ${customer.name}, הנה פרטי ההזמנה שלך מאיה קייקס: ${url}`;
        window.open(`https://wa.me/${customer.phone.replace(/^0/, '972')}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/orders/${id}`;
        navigator.clipboard.writeText(url).then(() => {
            showToast('קישור הועתק ללוח');
        });
    };

    return (
        <div className="min-h-screen bg-app p-4 md:p-8 flex flex-col items-center">
            {/* Back Button (Admin only) */}
            {!isPublicView && (
                <div className="w-full max-w-md mb-4">
                    <Button variant="ghost" className="gap-2" onClick={() => navigate('ORDERS_DASHBOARD')}>
                        <ArrowRight size={18} /> חזרה לרשימה
                    </Button>
                </div>
            )}

            {/* Receipt Container */}
            <div className="w-full max-w-md bg-white shadow-card relative flex flex-col">
                {/* Header */}
                <div className="bg-white p-6 pb-8 text-center border-b border-dashed border-subtle">
                    <h2 className="text-heading-2 font-bold text-primary mb-2">Ayala Cakes</h2>
                    <p className="text-sm text-secondary">הזמנה #{id.slice(0, 6)}</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Event Details */}
                    <div className="text-center space-y-1">
                        <h3 className="text-2xl font-bold text-coffee-800">
                            {new Date(eventDate).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h3>
                        {delivery.time && (
                            <div className="flex items-center justify-center gap-2 text-secondary">
                                <Clock size={16} />
                                <span>{delivery.time}</span>
                            </div>
                        )}
                    </div>

                    {/* Customer Info */}
                    <div className="bg-bg-surface p-4 rounded-lg space-y-3">
                        <div className="font-bold text-lg text-center">{customer.name}</div>
                        <div className="flex justify-center gap-4 flex-wrap">
                            <a href={`tel:${customer.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                                <Phone size={14} /> {customer.phone}
                            </a>
                            {customer.email && (
                                <a href={`mailto:${customer.email}`} className="flex items-center gap-1 text-primary hover:underline">
                                    <Mail size={14} /> {customer.email}
                                </a>
                            )}
                        </div>
                        {/* Delivery Info */}
                        <div className="flex items-center justify-center gap-2 text-sm text-secondary pt-2 border-t border-subtle/50 flex-wrap">
                            <span className="font-bold">{delivery.type === 'pickup' ? 'איסוף עצמי' : 'משלוח'}</span>
                            {delivery.address && (
                                <span className="flex items-center gap-1">
                                    <MapPin size={12} /> {delivery.address}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-muted uppercase tracking-wider border-b border-subtle pb-1">פריטים</h4>
                        {items.map((item, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-lg">{item.productName}</span>
                                    <span className="font-bold">₪{item.price}</span>
                                </div>
                                <p className="text-sm text-secondary whitespace-pre-wrap">{item.details}</p>

                                {/* Dynamic Selected Details */}
                                {item.selectedDetails && item.selectedDetails.length > 0 && (
                                    <div className="bg-bg-surface-alt p-3 rounded-md text-sm space-y-1 mt-2">
                                        {item.selectedDetails.map((detail, dIdx) => (
                                            <div key={dIdx} className="flex gap-2 flex-wrap">
                                                <span className="font-semibold text-coffee-800">{detail.label}:</span>
                                                <span className="text-secondary">{detail.values.join(', ')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Internal Notes (Admin Only) */}
                    {!isPublicView && internalNotes && (
                        <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm text-yellow-800">
                            <strong>הערות פנימיות:</strong>
                            <p className="whitespace-pre-wrap mt-1 break-words">{internalNotes}</p>
                        </div>
                    )}

                    {/* Total & Status */}
                    <div className="pt-4 border-t-2 border-primary/20 space-y-4">
                        <div className="flex justify-between items-center text-xl font-bold text-primary">
                            <span>סה"כ לתשלום</span>
                            <span>₪{totalPrice}</span>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center">
                            <StatusBadge variant={
                                paymentStatus === 'paid_full' ? 'success' :
                                    paymentStatus === 'deposit' ? 'warning' : 'danger'
                            }>
                                {paymentStatus === 'paid_full' ? 'שולם מלא' : paymentStatus === 'deposit' ? 'שולמה מקדמה' : 'לא שולם'}
                            </StatusBadge>

                            <StatusBadge variant={
                                executionStatus === 'delivered' ? 'success' :
                                    executionStatus === 'ready' ? 'info' :
                                        executionStatus === 'in_progress' ? 'warning' : 'neutral'
                            }>
                                {executionStatus === 'delivered' ? 'נמסר' : executionStatus === 'ready' ? 'מוכן' : executionStatus === 'in_progress' ? 'בהכנה' : 'טרם התחיל'}
                            </StatusBadge>

                            {isInvoiceIssued && <StatusBadge variant="info">הופקה קבלה</StatusBadge>}
                        </div>
                    </div>
                </div>

                {/* Paper Zigzag Bottom Effect */}
                <div
                    className="h-6 bg-white w-full absolute -bottom-6 left-0"
                    style={{
                        clipPath: 'polygon(0% 0%, 0% 100%, 2% 0%, 4% 100%, 6% 0%, 8% 100%, 10% 0%, 12% 100%, 14% 0%, 16% 100%, 18% 0%, 20% 100%, 22% 0%, 24% 100%, 26% 0%, 28% 100%, 30% 0%, 32% 100%, 34% 0%, 36% 100%, 38% 0%, 40% 100%, 42% 0%, 44% 100%, 46% 0%, 48% 100%, 50% 0%, 52% 100%, 54% 0%, 56% 100%, 58% 0%, 60% 100%, 62% 0%, 64% 100%, 66% 0%, 68% 100%, 70% 0%, 72% 100%, 74% 0%, 76% 100%, 78% 0%, 80% 100%, 82% 0%, 84% 100%, 86% 0%, 88% 100%, 90% 0%, 92% 100%, 94% 0%, 96% 100%, 98% 0%, 100% 100%, 100% 0%)',
                        backgroundColor: 'white'
                    }}
                ></div>
            </div>

            {/* Actions Area */}
            <div className="mt-12 flex flex-col items-center gap-4 w-full max-w-md">

                {/* Share Actions (Visible to everyone) */}
                <div className="flex items-center gap-4">
                    <p className="text-sm font-bold text-muted">שתף הזמנה:</p>
                    <IconButton
                        icon={<Share2 size={18} />}
                        onClick={handleShareWhatsApp}
                        label="שתף בוואטסאפ"
                        variant="success"
                    />
                    <IconButton
                        icon={<Copy size={18} />}
                        onClick={handleCopyLink}
                        label="העתק קישור"
                        variant="ghost"
                    />
                </div>

                {/* Edit Action (Admin Only) */}
                {!isPublicView && (
                    <Button
                        variant="secondary"
                        onClick={() => navigate('ORDER_EDIT', { orderId: id, order: selectedOrder })}
                        className="gap-2 w-full"
                    >
                        <Edit size={16} /> ערוך הזמנה
                    </Button>
                )}

                {/* Back to Home (Public Only) */}
                {isPublicView && (
                    <Button
                        variant="ghost"
                        onClick={() => { window.location.href = '/'; }}
                        className="gap-2 mt-4 text-primary"
                    >
                        ליצירת הזמנה חדשה
                    </Button>
                )}
            </div>

            {/* Public Footer */}
            {isPublicView && (
                <div className="mt-16 text-center text-muted text-sm space-y-2">
                    <p>נוצר באמצעות Ayala Pricing System</p>
                    <p>© כל הזכויות שמורות</p>
                </div>
            )}
        </div>
    );
};
