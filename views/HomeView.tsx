import React from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { AppState } from '../hooks/useAppState';

type Props = Pick<AppState, 'data' | 'loading' | 'setView' | 'setSelectedProductId' | 'setSelections'>;

export const HomeView: React.FC<Props> = ({ data, loading, setView, setSelectedProductId, setSelections }) => {
    return (
        <div className="min-h-screen pb-24 px-6 flex flex-col bg-gradient-to-b from-rose-50 to-white pt-6">
            <header className="mb-10 text-center">
                <h1 className="text-3xl font-heading font-bold text-coffee-800 mb-1">ברוכים הבאים</h1>
                <p className="text-rose-400/80 font-medium tracking-wide text-sm">בחרו מוצר כדי להתחיל</p>
            </header>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-rose-300" size={32} />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5">
                    {data.products.map(product => (
                        <button
                            key={product.id}
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
                            className="group relative bg-white rounded-3xl p-6 shadow-soft hover:shadow-xl transition-all duration-300 text-right overflow-hidden border border-white"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <h3 className="font-heading font-bold text-xl mb-2 text-coffee-800">{product.name}</h3>
                                    <div className="flex gap-2 text-sm text-coffee-800/50">
                                        <span>{product.tiers.length} רמות מחיר</span>
                                        <span>•</span>
                                        <span>החל מ-₪{product.tiers[0]?.price || 0}</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-rose-400 group-hover:bg-rose-400 group-hover:text-white transition-colors">
                                    <ChevronRight size={20} className="rotate-180" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
