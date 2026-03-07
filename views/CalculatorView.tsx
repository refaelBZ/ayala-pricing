import React from 'react';
import { Copy, ChevronRight, Check } from 'lucide-react';
import { InputRequest, OrderItem } from '../types';
import { AppState } from '../hooks/useAppState';
import { Button } from '../components/Button';
import { SubHeader } from '../components/SubHeader';
import { SectionHeader } from '../components/SectionHeader';

type Props = Pick<AppState, 'data' | 'selectedProductId' | 'selections' | 'setSelections' | 'navigate' | 'setPendingOrder' | 'setDynamicDetails' | 'showToast'>;

export const CalculatorView: React.FC<Props> = ({
    data, selectedProductId, selections, setSelections, navigate, setPendingOrder, setDynamicDetails, showToast
}) => {
    const product = data.products.find(p => p.id === selectedProductId);
    if (!product) return null;

    // --- Dynamic Tier Linking Logic ---
    let total = 0;
    const resolvedPrices: number[] = [];
    const detailsList: string[] = [];

    const manualPrices: number[] = [];

    product.categories.forEach(cat => {
        const selectionId = selections[cat.id];
        if (!selectionId) return;
        const idsToCheck = Array.isArray(selectionId) ? selectionId : [selectionId];
        idsToCheck.forEach(id => {
            const opt = cat.options.find(o => o.id === id);
            if (opt) {
                if (opt.linkTier === -1) {
                    // Manual-priced addons (e.g. delivery) are summed on top of the base price
                    manualPrices.push(opt.manualPrice || 0);
                } else if (opt.linkTier >= 0 && opt.linkTier < product.tiers.length) {
                    resolvedPrices.push(product.tiers[opt.linkTier].price);
                }
                detailsList.push(opt.name);
            }
        });
    });

    // Base price = highest tier selected; addons are added on top
    const basePrice = resolvedPrices.length > 0 ? Math.max(...resolvedPrices) : 0;
    const addonsTotal = manualPrices.reduce((sum, p) => sum + p, 0);
    total = basePrice + addonsTotal;

    const handleCopy = () => {
        let text = product.messageTemplate;
        text = text.replace('{details}', detailsList.join('\n'));
        text = text.replace('{price}', total.toString());
        navigator.clipboard.writeText(text).then(() => showToast('הועתק ללוח!'));
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Sub-header */}
            <SubHeader title={product.name} onBack={() => navigate('HOME')} />

            {/* Content */}
            <div className="p-6 pb-40 space-y-8 overflow-y-auto">
                {product.categories.map(cat => (
                    <div key={cat.id} className="space-y-4">
                        <SectionHeader size="lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-soft"></div>
                            {cat.name}
                        </SectionHeader>

                        {cat.type === 'radio' ? (
                            <div className="flex flex-col gap-3">
                                {cat.options.map(opt => {
                                    const isSelected = selections[cat.id] === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => setSelections(prev => ({ ...prev, [cat.id]: opt.id }))}
                                            className={`relative p-4 rounded-2xl text-right transition-all duration-base flex items-center justify-between group ${isSelected
                                                ? 'bg-white shadow-md ring-2 ring-accent-muted'
                                                : 'bg-white/60 hover:bg-white shadow-sm ring-1 ring-transparent hover:ring-accent-ghost'
                                                }`}
                                        >
                                            <span className={`font-medium text-body-lg ${isSelected ? 'text-primary' : 'text-secondary'}`}>{opt.name}</span>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-base ${isSelected ? 'border-accent-soft bg-accent-soft' : 'border-default bg-transparent'}`}>
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
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
                                            className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-base flex items-center justify-between ${isSelected
                                                ? 'bg-white shadow-md ring-2 ring-accent-muted'
                                                : 'bg-white/60 hover:bg-white shadow-sm'
                                                }`}
                                        >
                                            <span className={`font-medium ${isSelected ? 'text-primary' : 'text-secondary'}`}>{opt.name}</span>
                                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-base ${isSelected ? 'bg-accent-soft border-accent-soft' : 'border-default'}`}>
                                                {isSelected && <Check size={14} className="text-white" />}
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
            <div className="fixed bottom-6 left-4 right-4 z-30">
                <div className="glass-panel rounded-3xl p-2 pl-3 shadow-soft flex items-center gap-4">
                    <div className="flex-1 pr-4">
                        <span className="text-caption text-secondary font-medium block">סה"כ לתשלום</span>
                        <span className="text-3xl font-heading font-bold text-primary tracking-tight leading-none">₪{total}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCopy} className="md:px-6 h-14 rounded-2xl font-bold tracking-wide">
                            <Copy size={18} />
                            <span className="hidden md:inline">העתק</span>
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                const inputRequests: InputRequest[] = [];
                                let maxTierIdx = -1;
                                let maxTierPrice = -1;

                                // 1. Scan selections to find Max Tier (highest price linked tier)
                                product.categories.forEach(cat => {
                                    const selection = selections[cat.id];
                                    if (!selection) return;
                                    const ids = Array.isArray(selection) ? selection : [selection];
                                    ids.forEach(id => {
                                        const opt = cat.options.find(o => o.id === id);
                                        if (opt && opt.linkTier >= 0 && opt.linkTier < product.tiers.length) {
                                            const tierPrice = product.tiers[opt.linkTier].price;
                                            if (tierPrice > maxTierPrice) {
                                                maxTierPrice = tierPrice;
                                                maxTierIdx = opt.linkTier;
                                            }
                                        }
                                    });
                                });

                                // 2. Add Tier Specs if applicable
                                if (maxTierIdx >= 0) {
                                    const tier = product.tiers[maxTierIdx];
                                    if (tier.includedSpecs) {
                                        tier.includedSpecs.forEach((spec, idx) => {
                                            inputRequests.push({
                                                id: `tier-${maxTierIdx}-${idx}`,
                                                sourceName: `רמת ${tier.name}`, // "Level Classic"
                                                specs: spec
                                            });
                                        });
                                    }
                                }

                                // 3. Add Option Specs
                                product.categories.forEach(cat => {
                                    const selection = selections[cat.id];
                                    if (!selection) return;
                                    const ids = Array.isArray(selection) ? selection : [selection];
                                    ids.forEach(id => {
                                        const opt = cat.options.find(o => o.id === id);
                                        if (opt && opt.formInputs) {
                                            inputRequests.push({
                                                id: opt.id,
                                                sourceName: opt.name,
                                                specs: opt.formInputs
                                            });
                                        }
                                    });
                                });

                                const items: OrderItem[] = [{
                                    productId: product.id,
                                    productName: product.name,
                                    price: total,
                                    quantity: 1,
                                    details: detailsList.join('\n'),
                                    _inputRequests: inputRequests
                                }];
                                setPendingOrder({ items, totalPrice: total });
                                setDynamicDetails({});
                                navigate('ORDER_FORM');
                            }}
                            className="px-6 h-14 rounded-2xl text-lg font-bold tracking-wide shadow-primary-glow"
                        >
                            <span>המשך</span>
                            <ChevronRight className="rotate-180" size={18} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
