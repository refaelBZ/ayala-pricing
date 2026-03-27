import React, { useState } from 'react';
import { Copy, ChevronRight, Check } from 'lucide-react';
import { FormField, InputRequest, OrderItem, Product } from '../../types';
import { AppState } from '../../hooks/useAppState';
import { Button } from '../../components/Button';
import { SubHeader } from '../../components/SubHeader';
import { SectionHeader } from '../../components/SectionHeader';
import { LinkedProductModal } from '../../components/LinkedProductModal';
import styles from './style.module.scss';

type Props = Pick<AppState, 'data' | 'selectedProductId' | 'selections' | 'setSelections' | 'navigate' | 'setPendingOrder' | 'setDynamicDetails' | 'showToast'>;

// ─── Helper: compute effective tier fields (cumulative + overrides) ────────────
function buildEffectiveFields(product: Product, maxTierIdx: number): { field: FormField; effectiveCount: number }[] {
    const fields = new Map<string, { field: FormField; effectiveCount: number }>();

    for (let i = 0; i <= maxTierIdx; i++) {
        (product.tiers[i].inheritedFields || []).forEach(f => {
            fields.set(f.id, { field: f, effectiveCount: f.count });
        });
    }

    for (let i = 0; i <= maxTierIdx; i++) {
        const overrides = product.tiers[i].overrides;
        if (overrides) {
            Object.entries(overrides).forEach(([fieldId, count]) => {
                const entry = fields.get(fieldId);
                if (entry) fields.set(fieldId, { ...entry, effectiveCount: count });
            });
        }
    }

    return Array.from(fields.values());
}

export const CalculatorView: React.FC<Props> = ({
    data, selectedProductId, selections, setSelections, navigate, setPendingOrder, setDynamicDetails, showToast
}) => {
    const product = data.products.find(p => p.id === selectedProductId);
    if (!product) return null;

    // ─── Linked-product modal queue ───────────────────────────────────────────
    const [linkedProductQueue, setLinkedProductQueue] = useState<string[]>([]);
    const [pendingMainItem, setPendingMainItem] = useState<OrderItem | null>(null);
    const [collectedLinkedItems, setCollectedLinkedItems] = useState<OrderItem[]>([]);

    const activeLinkedProductId = linkedProductQueue[0] ?? null;
    const activeLinkedProduct = activeLinkedProductId
        ? data.products.find(p => p.id === activeLinkedProductId) ?? null
        : null;

    // ─── Merge product + applicable global categories ─────────────────────────
    const applicableGlobalCats = data.globalCategories.filter(
        gc => gc.targetProductIds.includes(selectedProductId!)
    );
    const allCategories = [...product.categories, ...applicableGlobalCats];

    // ─── Price calculation ────────────────────────────────────────────────────
    let total = 0;
    const resolvedPrices: number[] = [];
    const detailsList: string[] = [];
    const manualPrices: number[] = [];

    allCategories.forEach(cat => {
        const selectionId = selections[cat.id];
        if (!selectionId) return;
        const idsToCheck = Array.isArray(selectionId) ? selectionId : [selectionId];
        idsToCheck.forEach(id => {
            const opt = cat.options.find(o => o.id === id);
            if (opt) {
                if (opt.linkTier === -1) {
                    manualPrices.push(opt.manualPrice || 0);
                } else if (opt.linkTier >= 0 && opt.linkTier < product.tiers.length) {
                    resolvedPrices.push(product.tiers[opt.linkTier].price);
                }
                detailsList.push(opt.name);
            }
        });
    });

    const basePrice = resolvedPrices.length > 0 ? Math.max(...resolvedPrices) : 0;
    const addonsTotal = manualPrices.reduce((sum, p) => sum + p, 0);
    total = basePrice + addonsTotal;

    // ─── Build main OrderItem + input requests ────────────────────────────────
    const buildMainItem = (): { item: OrderItem; linkedProductIds: string[] } => {
        const inputRequests: InputRequest[] = [];
        let maxTierIdx = -1;
        let maxTierPrice = -1;
        const linkedProductIds: string[] = [];

        allCategories.forEach(cat => {
            const selection = selections[cat.id];
            if (!selection) return;
            const ids = Array.isArray(selection) ? selection : [selection];
            ids.forEach(id => {
                const opt = cat.options.find(o => o.id === id);
                if (opt) {
                    if (opt.linkTier >= 0 && opt.linkTier < product.tiers.length) {
                        const tierPrice = product.tiers[opt.linkTier].price;
                        if (tierPrice > maxTierPrice) {
                            maxTierPrice = tierPrice;
                            maxTierIdx = opt.linkTier;
                        }
                    }
                    if (opt.linkedProductId && !linkedProductIds.includes(opt.linkedProductId)) {
                        linkedProductIds.push(opt.linkedProductId);
                    }
                }
            });
        });

        // 1. Base fields (always appear)
        (product.baseFields || []).forEach((field, idx) => {
            inputRequests.push({
                id: `base-${idx}`,
                sourceName: product.name,
                field
            });
        });

        // 2. Effective tier fields (cumulative inherited + overrides)
        if (maxTierIdx >= 0) {
            const effectiveFields = buildEffectiveFields(product, maxTierIdx);
            effectiveFields.forEach(({ field, effectiveCount }) => {
                inputRequests.push({
                    id: `tier-field-${field.id}`,
                    sourceName: product.tiers[maxTierIdx].name,
                    field,
                    effectiveCount
                });
            });
        }

        // 3. Triggered fields from selected options
        allCategories.forEach(cat => {
            const selection = selections[cat.id];
            if (!selection) return;
            const ids = Array.isArray(selection) ? selection : [selection];
            ids.forEach(id => {
                const opt = cat.options.find(o => o.id === id);
                if (opt?.triggeredFields?.length) {
                    opt.triggeredFields.forEach((field, specIdx) => {
                        inputRequests.push({
                            id: `${opt.id}_${specIdx}`,
                            sourceName: opt.name,
                            field
                        });
                    });
                }
            });
        });

        const item: OrderItem = {
            productId: product.id,
            productName: product.name,
            price: total,
            quantity: 1,
            details: detailsList.join('\n'),
            _inputRequests: inputRequests
        };

        return { item, linkedProductIds };
    };

    // ─── Continue button ──────────────────────────────────────────────────────
    const handleContinue = () => {
        const { item, linkedProductIds } = buildMainItem();

        if (linkedProductIds.length > 0) {
            setPendingMainItem(item);
            setCollectedLinkedItems([]);
            setLinkedProductQueue(linkedProductIds);
        } else {
            setPendingOrder({ items: [item], totalPrice: total });
            setDynamicDetails({});
            navigate('ORDER_FORM');
        }
    };

    // ─── Modal handlers ───────────────────────────────────────────────────────
    const handleLinkedConfirm = (linkedItem: OrderItem) => {
        const newLinked = [...collectedLinkedItems, linkedItem];
        const remainingQueue = linkedProductQueue.slice(1);

        if (remainingQueue.length === 0) {
            const allItems = [pendingMainItem!, ...newLinked];
            const totalPrice = allItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
            setPendingOrder({ items: allItems, totalPrice });
            setDynamicDetails({});
            setLinkedProductQueue([]);
            setPendingMainItem(null);
            setCollectedLinkedItems([]);
            navigate('ORDER_FORM');
        } else {
            setCollectedLinkedItems(newLinked);
            setLinkedProductQueue(remainingQueue);
        }
    };

    const handleLinkedCancel = () => {
        setLinkedProductQueue([]);
        setPendingMainItem(null);
        setCollectedLinkedItems([]);
    };

    // ─── Copy handler ─────────────────────────────────────────────────────────
    const handleCopy = () => {
        let text = product.messageTemplate;
        text = text.replace('{details}', detailsList.join('\n'));
        text = text.replace('{price}', total.toString());
        navigator.clipboard.writeText(text).then(() => showToast('הועתק ללוח!'));
    };

    return (
        <div className={styles.container}>
            <SubHeader title={product.name} onBack={() => navigate('HOME')} />

            <div className={styles.content}>
                {allCategories.map(cat => (
                    <div key={cat.id} className={styles.categorySection}>
                        <SectionHeader size="lg">
                            <div className={styles.categoryDot}></div>
                            {cat.name}
                        </SectionHeader>

                        {cat.type === 'radio' ? (
                            <div className={styles.radioGroup}>
                                {cat.options.map(opt => {
                                    const isSelected = selections[cat.id] === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => setSelections(prev => ({ ...prev, [cat.id]: opt.id }))}
                                            className={`${styles.optionItem} ${isSelected ? styles.active : styles.inactive}`}
                                        >
                                            <div className={styles.itemContent}>
                                                <span className={`${styles.itemName} ${isSelected ? styles.active : styles.inactive}`}>{opt.name}</span>
                                                {opt.linkedProductId && (
                                                    <span className={styles.itemAddon}>+ תוספת נפרדת</span>
                                                )}
                                            </div>
                                            <div className={`${styles.radioCircle} ${isSelected ? styles.active : styles.inactive}`}>
                                                {isSelected && <div className={styles.radioInner} />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={styles.checkGroup}>
                                {cat.options.map(opt => {
                                    const currentSelected = (selections[cat.id] as string[]) || [];
                                    const isSelected = currentSelected.includes(opt.id);
                                    return (
                                        <div
                                            key={opt.id}
                                            onClick={() => {
                                                const newSelection = isSelected
                                                    ? currentSelected.filter(id => id !== opt.id)
                                                    : [...currentSelected, opt.id];
                                                setSelections(prev => ({ ...prev, [cat.id]: newSelection }));
                                            }}
                                            className={`${styles.optionItem} ${isSelected ? styles.active : styles.inactive}`}
                                        >
                                            <div className={styles.itemContent}>
                                                <span className={`${styles.itemName} ${isSelected ? styles.active : styles.inactive}`}>{opt.name}</span>
                                                {opt.linkedProductId && (
                                                    <span className={styles.itemAddon}>+ תוספת נפרדת</span>
                                                )}
                                            </div>
                                            <div className={`${styles.checkSquare} ${isSelected ? styles.active : styles.inactive}`}>
                                                {isSelected && <Check size={14} className={styles.iconWhite} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Sticky Footer */}
            <div className={styles.footerWrapper}>
                <div className={styles.footerPanel}>
                    <div className={styles.footerTotalCol}>
                        <span className={styles.footerTotalLabel}>סה"כ לתשלום</span>
                        <span className={styles.footerTotalValue}>₪{total}</span>
                    </div>
                    <div className={styles.footerActions}>
                        <Button variant="outline" onClick={handleCopy} className={styles.btnCopy}>
                            <Copy size={18} />
                            <span className={styles.btnText}>העתק</span>
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleContinue}
                            className={styles.btnContinue}
                        >
                            <span>המשך</span>
                            <ChevronRight className={styles.btnIcon} size={18} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Linked Product Modal */}
            {activeLinkedProduct && (
                <LinkedProductModal
                    product={activeLinkedProduct}
                    onConfirm={handleLinkedConfirm}
                    onCancel={handleLinkedCancel}
                />
            )}
        </div>
    );
};
