import React from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { AppState } from '../../hooks/useAppState';
import { BaseCard } from '../../components/BaseCard';
import styles from './style.module.scss';

type Props = Pick<AppState, 'data' | 'loading' | 'navigate' | 'setSelectedProductId' | 'setSelections'>;

export const HomeView: React.FC<Props> = ({ data, loading, navigate, setSelectedProductId, setSelections }) => {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={`text-heading-1 ${styles.title}`}>ברוכים הבאים</h1>
                <p className={`text-body-sm ${styles.subtitle}`}>בחרו מוצר כדי להתחיל</p>
            </header>

            {loading ? (
                <div className={styles.loader}>
                    <Loader2 className={styles.spinIcon} size={32} />
                </div>
            ) : (
                <div className={styles.productGrid}>
                    {data.products.map(product => (
                        <BaseCard
                            key={product.id}
                            variant="elevated"
                            className={styles.productCard}
                            onClick={() => {
                                setSelectedProductId(product.id);
                                const initialSelections: Record<string, string> = {};
                                product.categories.forEach(cat => {
                                    if (cat.type === 'radio' && cat.options.length > 0) {
                                        initialSelections[cat.id] = cat.options[0].id;
                                    }
                                });
                                setSelections(initialSelections);
                                navigate('CALCULATOR');
                            }}
                        >
                            <div className={styles.decorativeBlob}></div>

                            <div className={styles.cardContent}>
                                <div>
                                    <h3 className={`text-heading-3 ${styles.productTitle}`}>{product.name}</h3>
                                    <div className={`text-body-sm ${styles.productMeta}`}>
                                        <span>{product.tiers.length} רמות מחיר</span>
                                        <span>•</span>
                                        <span>החל מ-₪{product.tiers[0]?.price || 0}</span>
                                    </div>
                                </div>
                                <div className={styles.actionIcon}>
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        </BaseCard>
                    ))}
                </div>
            )}
        </div>
    );
};
