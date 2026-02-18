import React from 'react';
import { Settings, LogOut, Trash2, Edit2, Plus } from 'lucide-react';
import { AppState } from '../hooks/useAppState';
import { Button } from '../components/Button';
import { deleteProductFromFirestore, generateUUID } from '../services/storage';

type Props = Pick<AppState, 'data' | 'setView' | 'setEditingProduct' | 'setLoading' | 'loadData' | 'logoutAdmin'>;

export const AdminDashboardView: React.FC<Props> = ({ data, setView, setEditingProduct, setLoading, loadData, logoutAdmin }) => {
    return (
        <div className="min-h-screen p-6 pb-24 bg-rose-50/50">
            <header className="flex items-center justify-between mb-8 mt-2">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-coffee-800">ניהול מוצרים</h1>
                    <p className="text-sm text-coffee-800/60">Ayala Cakes Admin</p>
                </div>
                <div className="flex gap-2">
                    <button
                        title="ניהול הזמנות"
                        onClick={() => setView('ORDERS_DASHBOARD')}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-rose-300 hover:text-rose-500 shadow-sm border border-rose-100"
                    >
                        <Settings size={20} />
                    </button>
                    <button
                        title="יציאה"
                        onClick={() => { logoutAdmin(); setView('HOME'); }}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-rose-300 hover:text-rose-500 shadow-sm border border-rose-100"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <div className="space-y-4">
                {data.products.map(product => (
                    <div key={product.id} className="bg-white p-5 rounded-3xl shadow-sm flex items-center justify-between border border-rose-100/50">
                        <div>
                            <h3 className="font-bold text-lg text-coffee-800">{product.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-rose-50 text-rose-500 px-2 py-1 rounded-lg font-medium border border-rose-100">
                                    {product.tiers.length} רמות מחיר
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setEditingProduct(JSON.parse(JSON.stringify(product)));
                                    setView('PRODUCT_EDITOR');
                                }}
                                className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-colors"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={async () => {
                                    if (window.confirm('למחוק את המוצר?')) {
                                        setLoading(true);
                                        await deleteProductFromFirestore(product.id);
                                        await loadData();
                                        setLoading(false);
                                    }
                                }}
                                className="p-3 bg-white text-rose-300 border border-rose-100 rounded-2xl hover:text-rose-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="fixed bottom-8 left-6 right-6">
                <Button
                    fullWidth
                    className="shadow-xl h-14 text-lg rounded-2xl shadow-rose-300/40"
                    onClick={() => {
                        setEditingProduct({
                            id: generateUUID(),
                            name: '',
                            tiers: [
                                { name: 'Basic', price: 0 },
                                { name: 'Plus', price: 0 },
                                { name: 'Extra', price: 0 }
                            ],
                            messageTemplate: "היי! הצעת מחיר עבור {product}:\n{details}\nסה\"כ: {price} ₪",
                            categories: []
                        });
                        setView('PRODUCT_EDITOR');
                    }}
                >
                    <Plus size={24} className="ml-2" />
                    הוסף מוצר חדש
                </Button>
            </div>
        </div>
    );
};
