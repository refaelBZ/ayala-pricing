import React from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { AppState } from '../hooks/useAppState';
import { BaseCard } from '../components/BaseCard';

type Props = Pick<AppState, 'data' | 'loading' | 'setView' | 'setSelectedProductId' | 'setSelections'>;

export const HomeView: React.FC<Props> = ({ data, loading, setView, setSelectedProductId, setSelections }) => {
    return (
        <div className="min-h-screen pb-24 px-6 flex flex-col pt-6">
            <header className="mb-10 text-center">
                <h1 className="text-heading-1 mb-1">ברוכים הבאים</h1>
                <p className="text-accent-soft/80 font-medium tracking-wide text-body-sm">בחרו מוצר כדי להתחיל</p>
            </header>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-accent-muted" size={32} />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5">
                    {data.products.map(product => (
                        <BaseCard
                            key={product.id}
                            variant="elevated"
                            className="relative overflow-hidden"
                            onClick={() => {
                                setSelectedProductId(product.id);
                                const initialSelections: Record<string, string> = {};
                                product.categories.forEach(cat => {
                                    if (cat.type === 'radio' && cat.options.length > 0) {
                                        initialSelections[cat.id] = cat.options[0].id;
                                    }
                                });
                                setSelections(initialSelections);
                                setView('CALCULATOR');
                            }}
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-accent-ghost rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-heading-3 mb-2">{product.name}</h3>
                                    <div className="flex gap-2 text-body-sm text-muted">
                                        <span>{product.tiers.length} רמות מחיר</span>
                                        <span>•</span>
                                        <span>החל מ-₪{product.tiers[0]?.price || 0}</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-accent-soft group-hover:bg-primary group-hover:text-on-primary transition-colors duration-base">
                                    <ChevronRight size={20} className="rotate-180" />
                                </div>
                            </div>
                        </BaseCard>
                    ))}
                </div>
            )}
        </div>
    );
};
