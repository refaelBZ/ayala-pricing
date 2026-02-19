import React from 'react';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { AppState } from '../hooks/useAppState';
import { Button } from '../components/Button';
import { BaseCard } from '../components/BaseCard';
import { StickyFooter } from '../components/StickyFooter';
import { IconButton } from '../components/IconButton';
import { deleteProductFromFirestore, generateUUID } from '../services/storage';

type Props = Pick<AppState, 'data' | 'navigate' | 'setEditingProduct' | 'setLoading' | 'loadData' | 'logoutAdmin'>;

export const AdminDashboardView: React.FC<Props> = ({ data, navigate, setEditingProduct, setLoading, loadData, logoutAdmin }) => {
    return (
        <div className="min-h-screen p-6 pb-24">
            <header className="flex items-center justify-between mb-8 mt-2">
                <div>
                    <h1 className="text-heading-2">ניהול מוצרים</h1>
                    <p className="text-body-sm text-secondary">Ayala Cakes Admin</p>
                </div>
            </header>

            <div className="space-y-4">
                {data.products.map(product => (
                    <BaseCard key={product.id} variant="outlined" className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-lg text-primary">{product.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-caption bg-accent-ghost text-accent px-2 py-1 rounded-lg font-medium border border-light">
                                    {product.tiers.length} רמות מחיר
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <IconButton
                                icon={<Edit2 size={18} />}
                                variant="accent"
                                onClick={() => navigate('PRODUCT_EDITOR', { productId: product.id, product: JSON.parse(JSON.stringify(product)) })}
                                label="ערוך"
                            />
                            <IconButton
                                icon={<Trash2 size={18} />}
                                variant="danger"
                                onClick={async () => {
                                    if (window.confirm('למחוק את המוצר?')) {
                                        setLoading(true);
                                        await deleteProductFromFirestore(product.id);
                                        await loadData();
                                        setLoading(false);
                                    }
                                }}
                                label="מחק"
                            />
                        </div>
                    </BaseCard>
                ))}
            </div>

            <StickyFooter>
                <Button
                    fullWidth
                    size="lg"
                    onClick={() => {
                        const newProduct = {
                            id: generateUUID(),
                            name: '',
                            tiers: [
                                { name: 'Basic', price: 0 },
                                { name: 'Plus', price: 0 },
                                { name: 'Extra', price: 0 }
                            ],
                            messageTemplate: "היי! הצעת מחיר עבור {product}:\n{details}\nסה\"כ: {price} ₪",
                            categories: []
                        };
                        navigate('PRODUCT_EDITOR', { productId: newProduct.id, product: newProduct });
                    }}
                >
                    <Plus size={24} className="ml-2" />
                    הוסף מוצר חדש
                </Button>
            </StickyFooter>
        </div>
    );
};
