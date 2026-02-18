import React from 'react';
import { ArrowLeft, Copy, ChevronRight, Check } from 'lucide-react';
import { Option, OrderItem } from '../types';
import { AppState } from '../hooks/useAppState';
import { Button } from '../components/Button';

type Props = Pick<AppState, 'data' | 'selectedProductId' | 'selections' | 'setSelections' | 'setView' | 'setPendingOrder' | 'setDynamicDetails' | 'showToast'>;

export const CalculatorView: React.FC<Props> = ({
    data, selectedProductId, selections, setSelections, setView, setPendingOrder, setDynamicDetails, showToast
}) => {
    const product = data.products.find(p => p.id === selectedProductId);
    if (!product) return null;

    // --- Dynamic Tier Linking Logic ---
    let total = 0;
    const resolvedPrices: number[] = [];
    const detailsList: string[] = [];

    product.categories.forEach(cat => {
        const selectionId = selections[cat.id];
        if (!selectionId) return;
        const idsToCheck = Array.isArray(selectionId) ? selectionId : [selectionId];
        idsToCheck.forEach(id => {
            const opt = cat.options.find(o => o.id === id);
            if (opt) {
                let price = 0;
                if (opt.linkTier === -1) {
                    price = opt.manualPrice || 0;
                } else if (opt.linkTier >= 0 && opt.linkTier < product.tiers.length) {
                    price = product.tiers[opt.linkTier].price;
                }
                resolvedPrices.push(price);
                detailsList.push(opt.name);
            }
        });
    });

    total = resolvedPrices.length > 0 ? Math.max(...resolvedPrices) : 0;

    const handleCopy = () => {
        let text = product.messageTemplate;
        text = text.replace('{details}', detailsList.join('\n'));
        text = text.replace('{price}', total.toString());
        navigator.clipboard.writeText(text).then(() => showToast('הועתק ללוח!'));
    };

    return (
        <div className="min-h-screen bg-rose-50/50 flex flex-col">
            {/* Sub-header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-20 px-4 py-4 border-b border-rose-100 flex items-center justify-between shadow-sm">
                <button onClick={() => setView('HOME')} className="p-2 -mr-2 text-coffee-800/60 hover:text-coffee-800 hover:bg-rose-50 rounded-full transition-colors">
                    <ArrowLeft />
                </button>
                <h2 className="font-heading font-bold text-lg text-coffee-800">{product.name}</h2>
                <div className="w-8"></div>
            </div>

            {/* Content */}
            <div className="p-6 pb-40 space-y-8 overflow-y-auto">
                {product.categories.map(cat => (
                    <div key={cat.id} className="space-y-4">
                        <h3 className="font-heading font-bold text-coffee-800 px-1 text-lg flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                            {cat.name}
                        </h3>

                        {cat.type === 'radio' ? (
                            <div className="flex flex-col gap-3">
                                {cat.options.map(opt => {
                                    const isSelected = selections[cat.id] === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => setSelections(prev => ({ ...prev, [cat.id]: opt.id }))}
                                            className={`relative p-4 rounded-2xl text-right transition-all duration-200 flex items-center justify-between group ${isSelected
                                                ? 'bg-white shadow-md ring-2 ring-rose-300'
                                                : 'bg-white/60 hover:bg-white shadow-sm ring-1 ring-transparent hover:ring-rose-100'
                                                }`}
                                        >
                                            <span className={`font-medium text-lg ${isSelected ? 'text-coffee-800' : 'text-coffee-800/70'}`}>{opt.name}</span>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-rose-400 bg-rose-400' : 'border-rose-200 bg-transparent'}`}>
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
                                            className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-200 flex items-center justify-between ${isSelected
                                                ? 'bg-white shadow-md ring-2 ring-rose-300'
                                                : 'bg-white/60 hover:bg-white shadow-sm'
                                                }`}
                                        >
                                            <span className={`font-medium ${isSelected ? 'text-coffee-800' : 'text-coffee-800/70'}`}>{opt.name}</span>
                                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-rose-400 border-rose-400' : 'border-rose-200'}`}>
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
                        <span className="text-xs text-coffee-800/60 font-medium block">סה"כ לתשלום</span>
                        <span className="text-3xl font-heading font-bold text-coffee-800 tracking-tight leading-none">₪{total}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={handleCopy} className="md:px-6 h-14 rounded-2xl font-bold tracking-wide border-2 bg-transparent">
                            <Copy size={18} />
                            <span className="hidden md:inline">העתק</span>
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                const optionsRequiringInput: Option[] = [];
                                product.categories.forEach(cat => {
                                    const selection = selections[cat.id];
                                    if (!selection) return;
                                    const ids = Array.isArray(selection) ? selection : [selection];
                                    ids.forEach(id => {
                                        const opt = cat.options.find(o => o.id === id);
                                        if (opt && opt.formInputs) optionsRequiringInput.push(opt);
                                    });
                                });

                                const items: OrderItem[] = [{
                                    productId: product.id,
                                    productName: product.name,
                                    price: total,
                                    details: detailsList.join('\n'),
                                    _inputConfigs: optionsRequiringInput
                                }];
                                setPendingOrder({ items, totalPrice: total });
                                setDynamicDetails({});
                                setView('ORDER_FORM');
                            }}
                            className="px-6 h-14 rounded-2xl text-lg font-bold tracking-wide shadow-rose-400/30"
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
