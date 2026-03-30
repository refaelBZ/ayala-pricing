import React from 'react';
import { Trash2, Edit2, Plus, BookOpen } from 'lucide-react';
import { AppState } from '../../hooks/useAppState';
import { Button } from '../../components/Button';
import { BaseCard } from '../../components/BaseCard';
import { StickyFooter } from '../../components/StickyFooter';
import { IconButton } from '../../components/IconButton';
import { deleteProductFromFirestore, deleteGlobalCategoryFromFirestore, generateUUID } from '../../services/storage';
import { GlobalCategory, Product } from '../../types';
import styles from './style.module.scss';

type Props = Pick<AppState, 'data' | 'navigate' | 'setEditingProduct' | 'setEditingGlobalCategory' | 'setLoading' | 'loadData' | 'logoutAdmin'>;

export const AdminDashboardView: React.FC<Props> = ({ data, navigate, setEditingProduct, setEditingGlobalCategory, setLoading, loadData, logoutAdmin }) => {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className="text-heading-2">ניהול מוצרים</h1>
                    <p className={`text-body-sm ${styles.subtitle}`}>Ayala Cakes Admin</p>
                </div>
            </header>

            {/* Products */}
            <div className={styles.listOverlay}>
                {data.products.map(product => (
                    <BaseCard key={product.id} variant="outlined" className={styles.listItem}>
                        <div>
                            <h3 className={styles.itemTitle}>{product.name}</h3>
                            <div className={styles.badges}>
                                <span className={`text-caption ${styles.badge}`}>
                                    {product.tiers.length} רמות מחיר
                                </span>
                                {(product.baseFields?.length ?? 0) > 0 && (
                                    <span className={`text-caption ${styles.badge}`}>
                                        {product.baseFields!.length} שדות בסיס
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className={styles.actions}>
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

            {/* Global Categories */}
            <h2 className={styles.sectionTitle}>קטגוריות גלובליות</h2>
            <div className={styles.listOverlay}>
                {data.globalCategories.map(gc => (
                    <BaseCard key={gc.id} variant="outlined" className={styles.listItem}>
                        <div>
                            <h3 className={styles.itemTitle}>{gc.name || '(ללא שם)'}</h3>
                            <span className={`text-caption ${styles.meta}`}>
                                {gc.targetProductIds.length} מוצרים • {gc.options.length} אפשרויות
                            </span>
                        </div>
                        <div className={styles.actions}>
                            <IconButton
                                icon={<Edit2 size={18} />}
                                variant="accent"
                                onClick={() => navigate('GLOBAL_CATEGORY_EDITOR', { globalCategoryId: gc.id, globalCategory: { ...gc } })}
                                label="ערוך"
                            />
                            <IconButton
                                icon={<Trash2 size={18} />}
                                variant="danger"
                                onClick={async () => {
                                    if (window.confirm('למחוק את הקטגוריה הגלובלית?')) {
                                        setLoading(true);
                                        await deleteGlobalCategoryFromFirestore(gc.id);
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

            {/* Global Dictionaries */}
            <h2 className={styles.sectionTitle}>מאגרי מאפיינים גלובליים</h2>
            <div className={styles.listDictionary}>
                {data.globalDictionaries.length === 0 ? (
                    <p className={`text-caption ${styles.emptyText}`}>אין מאגרי מאפיינים — צור מאגר ראשון כדי לשתף רשימות אפשרויות בין שדות.</p>
                ) : (
                    data.globalDictionaries.map(dict => (
                        <BaseCard key={dict.id} variant="outlined" className={styles.listItem}>
                            <div>
                                <h3 className={styles.dictionaryTitle}>{dict.name}</h3>
                                <span className={`text-caption ${styles.dictionaryMeta}`}>{dict.choices.slice(0, 4).join(', ')}{dict.choices.length > 4 ? `...` : ''}</span>
                            </div>
                        </BaseCard>
                    ))
                )}
                <button
                    onClick={() => navigate('DICTIONARY_MANAGER')}
                    className={`text-body-sm ${styles.manageButton}`}
                >
                    <BookOpen size={16} />
                    נהל מאגרי מאפיינים גלובליים
                </button>
            </div>

            <StickyFooter>
                <div className={styles.footerButtons}>
                    <Button
                        fullWidth
                        onClick={() => {
                            const newProduct: Product = {
                                id: generateUUID(),
                                name: '',
                                tiers: [
                                    { name: 'Basic', price: 0, inheritedFields: [] },
                                    { name: 'Plus', price: 0, inheritedFields: [] },
                                    { name: 'Extra', price: 0, inheritedFields: [] }
                                ],
                                messageTemplate: "היי! הצעת מחיר עבור {product}:\n{details}\nסה\"כ: {price} ₪",
                                categories: []
                            };
                            navigate('PRODUCT_EDITOR', { productId: newProduct.id, product: newProduct });
                        }}
                    >
                        מוצר חדש<Plus size={18} />
                    </Button>
                    <Button
                        fullWidth
                        variant="secondary"
                        onClick={() => {
                            const newGc: GlobalCategory = {
                                id: generateUUID(),
                                name: '',
                                type: 'checkbox',
                                targetProductIds: [],
                                options: []
                            };
                            navigate('GLOBAL_CATEGORY_EDITOR', { globalCategoryId: newGc.id, globalCategory: newGc });
                        }}
                    >
                        קטגוריה גלובלית<Plus size={18} />
                    </Button>
                </div>
            </StickyFooter>
        </div>
    );
};
