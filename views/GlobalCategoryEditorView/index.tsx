import React from 'react';
import { X, Plus, Check, BookOpen } from 'lucide-react';
import { FormField, Option } from '../../types';
import { AppState } from '../../hooks/useAppState';
import { Button } from '../../components/Button';
import { Input, BaseSelect } from '../../components/Input';
import { SubHeader } from '../../components/SubHeader';
import { StickyFooter } from '../../components/StickyFooter';
import { BaseCard } from '../../components/BaseCard';
import { saveGlobalCategoryToFirestore, generateUUID } from '../../services/storage';
import styles from './style.module.scss';

type Props = Pick<AppState, 'data' | 'editingGlobalCategory' | 'setEditingGlobalCategory' | 'navigate' | 'setLoading' | 'loadData' | 'showToast'>;

export const GlobalCategoryEditorView: React.FC<Props> = ({ data, editingGlobalCategory, setEditingGlobalCategory, navigate, setLoading, loadData, showToast }) => {
    if (!editingGlobalCategory) return null;

    const { globalDictionaries } = data;

    const makeField = (): FormField => ({
        id: generateUUID(), label: '', type: 'text', count: 1, isRequired: false
    });

    const save = async () => {
        if (!editingGlobalCategory.name) { showToast('נא להזין שם קטגוריה'); return; }
        setLoading(true);
        await saveGlobalCategoryToFirestore(editingGlobalCategory);
        await loadData();
        setLoading(false);
        navigate('ADMIN_DASHBOARD');
        showToast('נשמר בהצלחה');
    };

    const toggleProduct = (productId: string) => {
        const ids = editingGlobalCategory.targetProductIds;
        const next = ids.includes(productId) ? ids.filter(id => id !== productId) : [...ids, productId];
        setEditingGlobalCategory({ ...editingGlobalCategory, targetProductIds: next });
    };

    const addOption = () => {
        setEditingGlobalCategory({
            ...editingGlobalCategory,
            options: [...editingGlobalCategory.options, { id: generateUUID(), name: '', linkTier: -1, manualPrice: 0 }]
        });
    };

    const updateOption = (oi: number, u: Partial<Option>) => {
        const opts = [...editingGlobalCategory.options];
        opts[oi] = { ...opts[oi], ...u };
        setEditingGlobalCategory({ ...editingGlobalCategory, options: opts });
    };

    const removeOption = (oi: number) => {
        setEditingGlobalCategory({ ...editingGlobalCategory, options: editingGlobalCategory.options.filter((_, i) => i !== oi) });
    };

    const addTriggeredField = (oi: number) => {
        const opt = editingGlobalCategory.options[oi];
        updateOption(oi, { triggeredFields: [...(opt.triggeredFields || []), makeField()] });
    };

    const updateTriggeredField = (oi: number, fi: number, f: FormField) => {
        const a = [...(editingGlobalCategory.options[oi].triggeredFields || [])]; a[fi] = f;
        updateOption(oi, { triggeredFields: a });
    };

    const removeTriggeredField = (oi: number, fi: number) => {
        updateOption(oi, { triggeredFields: (editingGlobalCategory.options[oi].triggeredFields || []).filter((_, i) => i !== fi) });
    };

    return (
        <div className={styles.container}>
            <SubHeader title="עריכת קטגוריה גלובלית" />

            <div className={styles.content}>
                {/* Category Name + Type */}
                <BaseCard variant="outlined" className={styles.card}>
                    <Input
                        label="שם הקטגוריה"
                        value={editingGlobalCategory.name}
                        onChange={e => setEditingGlobalCategory({ ...editingGlobalCategory, name: e.target.value })}
                        placeholder="לדוגמה: משלוח, הערות אלרגנים"
                        className={styles.titleInput}
                    />
                    <div>
                        <label className={styles.label}>סוג בחירה</label>
                        <div className={styles.radioGroup}>
                            <label className={styles.radioItem}>
                                <input type="radio" checked={editingGlobalCategory.type === 'radio'} onChange={() => setEditingGlobalCategory({ ...editingGlobalCategory, type: 'radio' })} className={styles.accentRadio} />
                                <span className={styles.radioText}>בחירה יחידה</span>
                            </label>
                            <label className={styles.radioItem}>
                                <input type="radio" checked={editingGlobalCategory.type === 'checkbox'} onChange={() => setEditingGlobalCategory({ ...editingGlobalCategory, type: 'checkbox' })} className={styles.accentRadio} />
                                <span className={styles.radioText}>בחירה מרובה</span>
                            </label>
                        </div>
                    </div>
                </BaseCard>

                {/* Product Targeting */}
                <BaseCard variant="outlined" className={styles.card}>
                    <label className={styles.label}>מוצרים שהקטגוריה מופיעה בהם</label>
                    <div className={styles.checkboxGroup}>
                        {data.products.map(p => (
                            <label key={p.id} className={styles.checkboxItem}>
                                <input type="checkbox" checked={editingGlobalCategory.targetProductIds.includes(p.id)} onChange={() => toggleProduct(p.id)} className={styles.accentCheckbox} />
                                <span className={styles.checkboxText}>{p.name}</span>
                            </label>
                        ))}
                        {data.products.length === 0 && <p className={styles.emptyText}>אין מוצרים להצגה</p>}
                    </div>
                </BaseCard>

                {/* Options */}
                <section className={styles.optionsSection}>
                    <label className={styles.sectionLabel}>אפשרויות (תמיד מחיר ידני)</label>

                    {editingGlobalCategory.options.map((opt, oi) => (
                        <div key={opt.id} className={styles.optionCard}>
                            <div className={styles.optionRow}>
                                <Input placeholder="שם האפשרות" value={opt.name} onChange={e => updateOption(oi, { name: e.target.value })} className={styles.optionInput} />
                                <button onClick={() => removeOption(oi)} className={styles.removeBtn}><X size={16} /></button>
                            </div>

                            <div className={`${styles.optionRow} ${styles.withMargin}`}>
                                <label className={styles.priceLabel}>מחיר ₪</label>
                                <Input type="number" placeholder="מחיר" className={styles.priceInput} value={opt.manualPrice ?? 0} onChange={e => updateOption(oi, { manualPrice: Number(e.target.value) })} />
                            </div>

                            {/* Triggered Fields */}
                            <div className={styles.triggeredContainer}>
                                <div className={styles.triggeredHeader}>
                                    <span className={styles.title}>שדות מופעלים בבחירת אפשרות זו</span>
                                    <button onClick={() => addTriggeredField(oi)} className={styles.addBtn}>
                                        <Plus size={12} />הוסף שדה
                                    </button>
                                </div>
                                {(opt.triggeredFields || []).length === 0
                                    ? <p className={styles.triggeredEmpty}>לא יבוקשו פרטים נוספים</p>
                                    : <div className={styles.triggeredList}>
                                        {(opt.triggeredFields || []).map((field, fi) => (
                                            <div key={field.id} className={styles.triggeredItem}>
                                                <div className={`${styles.triggeredRow} ${styles.alignEnd}`}>
                                                    <div className={styles.flex1}>
                                                        <Input value={field.label} onChange={e => updateTriggeredField(oi, fi, { ...field, label: e.target.value })} className={styles.triggerInput} placeholder="תווית (לדוגמה: כתובת)" />
                                                    </div>
                                                    <div className={styles.width16}>
                                                        <Input type="number" min={1} value={field.count} onChange={e => updateTriggeredField(oi, fi, { ...field, count: Number(e.target.value) })} className={styles.triggerCountInput} />
                                                    </div>
                                                    <button onClick={() => removeTriggeredField(oi, fi)} className={styles.removeTriggeredBtn}><X size={14} /></button>
                                                </div>
                                                <div className={styles.triggeredRow}>
                                                    <BaseSelect className={styles.triggerSelect} value={field.type} onChange={e => updateTriggeredField(oi, fi, { ...field, type: e.target.value as 'text' | 'dictionary', dictionaryId: undefined })}>
                                                        <option value="text">טקסט חופשי</option>
                                                        <option value="dictionary">מאפיינים</option>
                                                    </BaseSelect>
                                                    {field.type === 'dictionary' && (
                                                        <BaseSelect className={styles.triggerSelect} value={field.dictionaryId || ''} onChange={e => updateTriggeredField(oi, fi, { ...field, dictionaryId: e.target.value || undefined })}>
                                                            <option value="">בחר מאגר...</option>
                                                            {globalDictionaries.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                        </BaseSelect>
                                                    )}
                                                    {field.type === 'dictionary' && field.dictionaryId && (
                                                        <BookOpen size={12} className={styles.dictionaryIcon} />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                }
                            </div>

                            {/* Linked Product */}
                            <div className={styles.linkedContainer}>
                                <label className={styles.label}>קישור למוצר (תוספת נפרדת)</label>
                                <BaseSelect className={styles.linkedSelect} value={opt.linkedProductId || ''}
                                    onChange={e => {
                                        const v = e.target.value;
                                        const opts = [...editingGlobalCategory.options];
                                        if (v) { opts[oi] = { ...opts[oi], linkedProductId: v }; }
                                        else { const { linkedProductId: _, ...rest } = opts[oi]; opts[oi] = rest as Option; }
                                        setEditingGlobalCategory({ ...editingGlobalCategory, options: opts });
                                    }}
                                >
                                    <option value="">ללא קישור</option>
                                    {data.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </BaseSelect>
                            </div>
                        </div>
                    ))}

                    <button onClick={addOption} className={styles.addOptionBtn}>
                        {editingGlobalCategory.name ? `הוסף אפשרות לקטגוריית ${editingGlobalCategory.name}` : 'הוסף אפשרות'}<Plus size={16} />
                    </button>
                </section>
            </div>

            <StickyFooter>
                <div className={styles.footerButtons}>
                    <Button variant="secondary" fullWidth size="lg" onClick={() => navigate('ADMIN_DASHBOARD')}>
                        ביטול שינויים
                    </Button>
                    <Button fullWidth size="lg" onClick={save} disabled={!editingGlobalCategory.name}>
                        שמור שינויים<Check />
                    </Button>
                </div>
            </StickyFooter>
        </div>
    );
};
