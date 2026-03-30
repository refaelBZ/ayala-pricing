import React from 'react';
import { ArrowRight, Edit, Phone, Mail, MapPin, Share2, Copy, Clock } from 'lucide-react';
import { AppState } from '../../hooks/useAppState';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { IconButton } from '../../components/IconButton';
import styles from './style.module.scss';

type Props = Pick<AppState, 'selectedOrder' | 'navigate' | 'isPublicView' | 'isAdmin' | 'showToast'>;

export const OrderDetailsView: React.FC<Props> = ({
    selectedOrder,
    navigate,
    isPublicView,
    isAdmin,
    showToast
}) => {
    if (!selectedOrder) {
        return (
            <div className={styles.notFound}>
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
        <div className={styles.container}>
            {/* Back Button (Admin only) */}
            {!isPublicView && (
                <div className={styles.backButtonWrapper}>
                    <Button variant="ghost" onClick={() => navigate('ORDERS_DASHBOARD')}>
                        <ArrowRight size={18} /> חזרה לרשימה
                    </Button>
                </div>
            )}

            {/* Receipt Container */}
            <div className={styles.receiptContainer}>
                {/* Header */}
                <div className={styles.receiptHeader}>
                    <h2 className={styles.brandTitle}>Ayala Cakes</h2>
                    <p className={styles.orderIdLine}>הזמנה #{id.slice(0, 6)}</p>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {/* Event Details */}
                    <div className={styles.eventDetails}>
                        <h3 className={styles.eventDateText}>
                            {new Date(eventDate).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h3>
                        {delivery.time && (
                            <div className={styles.eventTimeRow}>
                                <Clock size={16} />
                                <span>{delivery.time}</span>
                            </div>
                        )}
                    </div>

                    {/* Customer Info */}
                    <div className={styles.customerInfoBox}>
                        <div className={styles.customerNameText}>{customer.name}</div>
                        <div className={styles.contactLinks}>
                            <a href={`tel:${customer.phone}`} className={styles.contactLink}>
                                <Phone size={14} /> {customer.phone}
                            </a>
                            {customer.email && (
                                <a href={`mailto:${customer.email}`} className={styles.contactLink}>
                                    <Mail size={14} /> {customer.email}
                                </a>
                            )}
                        </div>
                        {/* Delivery Info */}
                        <div className={styles.deliveryInfo}>
                            <span className={styles.deliveryType}>{delivery.type === 'pickup' ? 'איסוף עצמי' : 'משלוח'}</span>
                            {delivery.address && (
                                <span className={styles.deliveryAddressData}>
                                    <MapPin size={12} /> {delivery.address}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className={styles.itemsSection}>
                        <h4 className={styles.itemsTitle}>פריטים</h4>
                        {items.map((item, idx) => (
                            <div key={idx} className={styles.itemRow}>
                                <div className={styles.itemHeader}>
                                    <div>
                                        <span className={styles.itemName}>{item.productName}</span>
                                        {(item.quantity ?? 1) > 1 && (
                                            <span className={styles.itemQty}>× {item.quantity}</span>
                                        )}
                                    </div>
                                    <div className={styles.itemPriceWrap}>
                                        <span className={styles.itemTotalPrice}>₪{item.price * (item.quantity ?? 1)}</span>
                                        {(item.quantity ?? 1) > 1 && (
                                            <div className={styles.itemUnitPrice}>₪{item.price} ליחידה</div>
                                        )}
                                    </div>
                                </div>
                                <p className={styles.itemDetailsText}>{item.details}</p>

                                {/* Dynamic Selected Details */}
                                {item.selectedDetails && item.selectedDetails.length > 0 && (
                                    <div className={styles.dynamicDetailsBox}>
                                        {item.selectedDetails.map((detail, dIdx) => (
                                            <div key={dIdx} className={styles.dynamicRow}>
                                                <span className={styles.dynamicLabel}>{detail.label}:</span>
                                                <span className={styles.dynamicValue}>{detail.values.join(', ')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Internal Notes (Admin Only) */}
                    {!isPublicView && internalNotes && (
                        <div className={styles.internalNotesBox}>
                            <strong>הערות פנימיות:</strong>
                            <p className={styles.internalNotesText}>{internalNotes}</p>
                        </div>
                    )}

                    {/* Total & Status */}
                    <div className={styles.totalSection}>
                        <div className={styles.totalRow}>
                            <span>סה"כ לתשלום</span>
                            <span>₪{totalPrice}</span>
                        </div>

                        <div className={styles.statusBadges}>
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
                    className={styles.zigzagEdge}
                    style={{
                        clipPath: 'polygon(0% 0%, 0% 100%, 2% 0%, 4% 100%, 6% 0%, 8% 100%, 10% 0%, 12% 100%, 14% 0%, 16% 100%, 18% 0%, 20% 100%, 22% 0%, 24% 100%, 26% 0%, 28% 100%, 30% 0%, 32% 100%, 34% 0%, 36% 100%, 38% 0%, 40% 100%, 42% 0%, 44% 100%, 46% 0%, 48% 100%, 50% 0%, 52% 100%, 54% 0%, 56% 100%, 58% 0%, 60% 100%, 62% 0%, 64% 100%, 66% 0%, 68% 100%, 70% 0%, 72% 100%, 74% 0%, 76% 100%, 78% 0%, 80% 100%, 82% 0%, 84% 100%, 86% 0%, 88% 100%, 90% 0%, 92% 100%, 94% 0%, 96% 100%, 98% 0%, 100% 100%, 100% 0%)',
                    }}
                ></div>
            </div>

            {/* Actions Area */}
            <div className={styles.actionsArea}>
                {/* Share Actions (Visible to everyone) */}
                <div className={styles.shareRow}>
                    <p className={styles.shareLabel}>שתף הזמנה:</p>
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
                {isAdmin && (
                    <Button
                        variant="secondary"
                        onClick={() => navigate('ORDER_EDIT', { orderId: id, order: selectedOrder })}
                        className={styles.actionBtn}
                    >
                        <Edit size={16} /> ערוך הזמנה
                    </Button>
                )}

                {/* Back to Home (Public Only) */}
                {isPublicView && (
                    <Button
                        variant="ghost"
                        onClick={() => { window.location.href = '/'; }}
                        className={styles.publicHomeBtn}
                    >
                        ליצירת הזמנה חדשה
                    </Button>
                )}
            </div>

            {/* Public Footer */}
            {isPublicView && (
                <div className={styles.publicFooter}>
                    <p>נוצר באמצעות Ayala Pricing System</p>
                    <p>© כל הזכויות שמורות</p>
                </div>
            )}
        </div>
    );
};
