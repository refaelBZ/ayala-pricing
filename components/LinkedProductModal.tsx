import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { FormField, InputRequest, OrderItem, Product } from '../types';
import { Button } from './Button';
import { IconButton } from './IconButton';

interface Props {
    product: Product;
    onConfirm: (item: OrderItem) => void;
    onCancel: () => void;
}

// Same helper as in CalculatorView — compute effective tier fields
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

export const LinkedProductModal: React.FC<Props> = ({ product, onConfirm, onCancel }) => {
    const [selections, setSelections] = useState<Record<string, string | string[]>>(() => {
        const initial: Record<string, string | string[]> = {};
        product.categories.forEach(cat => {
            if (cat.type === 'radio' && cat.options.length > 0) {
                initial[cat.id] = cat.options[0].id;
            }
        });
        return initial;
    });

    // ─── Price calculation ─────────────────────────────────────────────────────
    const resolvedPrices: number[] = [];
    const manualPrices: number[] = [];
    const detailsList: string[] = [];

    product.categories.forEach(cat => {
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
    const total = basePrice + manualPrices.reduce((s, p) => s + p, 0);

    // ─── Confirm: build InputRequests from new data model ─────────────────────
    const handleConfirm = () => {
        const inputRequests: InputRequest[] = [];
        let maxTierIdx = -1;
        let maxTierPrice = -1;

        product.categories.forEach(cat => {
            const selection = selections[cat.id];
            if (!selection) return;
            const ids = Array.isArray(selection) ? selection : [selection];
            ids.forEach(id => {
                const opt = cat.options.find(o => o.id === id);
                if (opt && opt.linkTier >= 0 && opt.linkTier < product.tiers.length) {
                    const tierPrice = product.tiers[opt.linkTier].price;
                    if (tierPrice > maxTierPrice) { maxTierPrice = tierPrice; maxTierIdx = opt.linkTier; }
                }
            });
        });

        // Base fields
        (product.baseFields || []).forEach((field, idx) => {
            inputRequests.push({ id: `linked-base-${idx}`, sourceName: product.name, field });
        });

        // Tier inherited fields
        if (maxTierIdx >= 0) {
            buildEffectiveFields(product, maxTierIdx).forEach(({ field, effectiveCount }) => {
                inputRequests.push({
                    id: `linked-tier-${field.id}`,
                    sourceName: `רמת ${product.tiers[maxTierIdx].name}`,
                    field,
                    effectiveCount
                });
            });
        }

        // Triggered fields from selected options
        product.categories.forEach(cat => {
            const selection = selections[cat.id];
            if (!selection) return;
            const ids = Array.isArray(selection) ? selection : [selection];
            ids.forEach(id => {
                const opt = cat.options.find(o => o.id === id);
                if (opt?.triggeredFields?.length) {
                    opt.triggeredFields.forEach((field, i) => {
                        inputRequests.push({ id: `linked-opt-${opt.id}-${i}`, sourceName: opt.name, field });
                    });
                }
            });
        });

        const linkedItem: OrderItem = {
            productId: product.id,
            productName: product.name,
            price: total,
            quantity: 1,
            details: detailsList.join('\n'),
            _inputRequests: inputRequests,
            _isLinked: true,
        };

        onConfirm(linkedItem);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(30,10,5,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <div className="glass-panel w-full max-w-lg rounded-t-3xl shadow-soft flex flex-col" style={{ maxHeight: '90dvh' }}>
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-subtle shrink-0">
                    <div>
                        <p className="text-caption text-muted mb-0.5">תוספת למוצר</p>
                        <h2 className="font-heading font-bold text-heading-3 text-primary">{product.name}</h2>
                    </div>
                    <IconButton icon={<X size={20} />} variant="ghost" onClick={onCancel} label="סגור" />
                </div>

                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-7" dir="rtl">
                    {product.categories.map(cat => (
                        <div key={cat.id} className="space-y-3">
                            <p className="font-bold text-body-base text-primary">{cat.name}</p>

                            {cat.type === 'radio' ? (
                                <div className="flex flex-col gap-2">
                                    {cat.options.map(opt => {
                                        const isSelected = selections[cat.id] === opt.id;
                                        return (
                                            <button
                                                key={opt.id}
                                                onClick={() => setSelections(prev => ({ ...prev, [cat.id]: opt.id }))}
                                                className={`relative p-3.5 rounded-2xl text-right transition-all duration-base flex items-center justify-between ${isSelected ? 'bg-white shadow-md ring-2 ring-accent-muted' : 'bg-white/60 hover:bg-white shadow-sm ring-1 ring-transparent hover:ring-accent-ghost'}`}
                                            >
                                                <span className={`font-medium text-body-sm ${isSelected ? 'text-primary' : 'text-secondary'}`}>{opt.name}</span>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-base ${isSelected ? 'border-accent-soft bg-accent-soft' : 'border-default bg-transparent'}`}>
                                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {cat.options.map(opt => {
                                        const currentSelected = (selections[cat.id] as string[]) || [];
                                        const isSelected = currentSelected.includes(opt.id);
                                        return (
                                            <div
                                                key={opt.id}
                                                onClick={() => {
                                                    const newSel = isSelected
                                                        ? currentSelected.filter(id => id !== opt.id)
                                                        : [...currentSelected, opt.id];
                                                    setSelections(prev => ({ ...prev, [cat.id]: newSel }));
                                                }}
                                                className={`relative p-3.5 rounded-2xl cursor-pointer transition-all duration-base flex items-center justify-between ${isSelected ? 'bg-white shadow-md ring-2 ring-accent-muted' : 'bg-white/60 hover:bg-white shadow-sm'}`}
                                            >
                                                <span className={`font-medium text-body-sm ${isSelected ? 'text-primary' : 'text-secondary'}`}>{opt.name}</span>
                                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-base ${isSelected ? 'bg-accent-soft border-accent-soft' : 'border-default'}`}>
                                                    {isSelected && <Check size={12} className="text-white" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="shrink-0 px-6 py-4 border-t border-subtle">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <span className="text-caption text-muted block">מחיר תוספת</span>
                            <span className="text-2xl font-heading font-bold text-primary">₪{total}</span>
                        </div>
                        <Button variant="primary" className="px-8 h-12 rounded-2xl font-bold" onClick={handleConfirm}>
                            <Check size={18} />אישור
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
