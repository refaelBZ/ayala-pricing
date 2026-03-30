import React, { useState } from 'react';
import { X, Settings, Plus, Trash2, Check, BookOpen, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Category, FormField, Option, Product } from '../../types';
import { AppState } from '../../hooks/useAppState';
import { Button } from '../../components/Button';
import { Input, TextArea, BaseSelect } from '../../components/Input';
import { SubHeader } from '../../components/SubHeader';
import { StickyFooter } from '../../components/StickyFooter';
import { SectionHeader } from '../../components/SectionHeader';
import { BaseCard } from '../../components/BaseCard';
import { IconButton } from '../../components/IconButton';
import { saveProductToFirestore, generateUUID } from '../../services/storage';
import styles from './style.module.scss';

type Props = Pick<AppState, 'data' | 'editingProduct' | 'setEditingProduct' | 'navigate' | 'setLoading' | 'loadData' | 'showToast'>;

// ─── FormField Editor ─────────────────────────────────────────────────────────
interface FormFieldEditorProps {
    field: FormField;
    onChange: (updated: FormField) => void;
    onRemove: () => void;
    globalDictionaries: AppState['data']['globalDictionaries'];
    isInherited?: boolean;
    inheritedFromTier?: string;
    overriddenCount?: number;
    onSetOverride?: (count: number) => void;
    onRemoveOverride?: () => void;
}

const FormFieldEditor: React.FC<FormFieldEditorProps> = ({
    field, onChange, onRemove, globalDictionaries,
    isInherited, inheritedFromTier, overriddenCount, onSetOverride, onRemoveOverride
}) => {
    const [showOverrideInput, setShowOverrideInput] = useState(false);
    const [overrideValue, setOverrideValue] = useState(overriddenCount ?? field.count);

    if (isInherited) {
        const effectiveCount = overriddenCount ?? field.count;
        return (
            <div className={styles.inheritedCard}>
                <div className={styles.inheritedContent}>
                    <div className={styles.inheritedHeader}>
                        <span className={styles.inheritedBadge}>
                            מ: {inheritedFromTier}
                        </span>
                        <span className={styles.inheritedLabel}>{field.label || '(ללא תווית)'}</span>
                        {field.type === 'dictionary' && <BookOpen size={12} className={styles.dictionaryIcon} />}
                    </div>
                    <span className={styles.inheritedMeta}>
                        כמות: {effectiveCount}
                        {overriddenCount !== undefined && <span className={styles.inheritedOriginalMeta}>(מקורי: {field.count})</span>}
                    </span>
                </div>
                <div className={styles.inheritedActions}>
                    {showOverrideInput ? (
                        <>
                            <Input type="number" min={1} value={overrideValue} onChange={e => setOverrideValue(Number(e.target.value))} className={styles.overrideInput} />
                            <button onClick={() => { onSetOverride?.(overrideValue); setShowOverrideInput(false); }} className={styles.iconBtn}>
                                <Check size={13} />
                            </button>
                            <button onClick={() => setShowOverrideInput(false)} className={styles.iconBtnMuted}>
                                <X size={13} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => { setOverrideValue(effectiveCount); setShowOverrideInput(true); }}
                                className={styles.overrideBtn}
                            >
                                {overriddenCount !== undefined ? 'ערוך' : 'Override'}
                            </button>
                            {overriddenCount !== undefined && onRemoveOverride && (
                                <button onClick={onRemoveOverride} className={styles.removeOverrideBtn} title="הסר override">
                                    <RotateCcw size={13} />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.fieldCard}>
            <div className={styles.fieldRow}>
                <div className={styles.fieldLabelBlock}>
                    <label className={styles.fieldInputLabel}>תווית</label>
                    <Input value={field.label} onChange={e => onChange({ ...field, label: e.target.value })} className={styles.fieldInput} placeholder="לדוגמה: צבע זילוף" />
                </div>
                <div className={styles.fieldCountBlock}>
                    <label className={styles.fieldInputLabel}>כמות</label>
                    <Input type="number" min={1} value={field.count} onChange={e => onChange({ ...field, count: Number(e.target.value) })} className={`${styles.fieldInput} ${styles.center}`} />
                </div>
                <button onClick={onRemove} className={styles.fieldRemoveBtn}>
                    <X size={15} />
                </button>
            </div>
            <div className={`${styles.fieldRow} ${styles.rowSecond}`}>
                <BaseSelect className={styles.fieldSelect} value={field.type} onChange={e => onChange({ ...field, type: e.target.value as 'text' | 'dictionary', dictionaryId: undefined })}>
                    <option value="text">טקסט חופשי</option>
                    <option value="dictionary">מאפיינים (רשימה)</option>
                </BaseSelect>
                {field.type === 'dictionary' && (
                    <BaseSelect className={styles.fieldSelect} value={field.dictionaryId || ''} onChange={e => onChange({ ...field, dictionaryId: e.target.value || undefined })}>
                        <option value="">בחר מאגר...</option>
                        {globalDictionaries.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </BaseSelect>
                )}
                <label className={styles.fieldCheckboxLabel}>
                    <input type="checkbox" checked={field.isRequired} onChange={e => onChange({ ...field, isRequired: e.target.checked })} />
                    חובה
                </label>
            </div>
        </div>
    );
};

// ─── Main View ────────────────────────────────────────────────────────────────

export const ProductEditorView: React.FC<Props> = ({ data, editingProduct, setEditingProduct, navigate, setLoading, loadData, showToast }) => {
    if (!editingProduct) return null;

    const [expandedTier, setExpandedTier] = useState<number | null>(0);

    const makeField = (): FormField => ({
        id: generateUUID(), label: '', type: 'text', count: 1, isRequired: false
    });

    const saveProduct = async () => {
        if (!editingProduct.name) { showToast('נא להזין שם מוצר'); return; }
        setLoading(true);
        await saveProductToFirestore(editingProduct);
        await loadData();
        setLoading(false);
        navigate('ADMIN_DASHBOARD');
        showToast('נשמר בהצלחה');
    };

    // ─── Base Fields ──────────────────────────────────────────────────────────
    const addBaseField = () => setEditingProduct({ ...editingProduct, baseFields: [...(editingProduct.baseFields || []), makeField()] });
    const updateBaseField = (i: number, f: FormField) => { const a = [...(editingProduct.baseFields || [])]; a[i] = f; setEditingProduct({ ...editingProduct, baseFields: a }); };
    const removeBaseField = (i: number) => setEditingProduct({ ...editingProduct, baseFields: (editingProduct.baseFields || []).filter((_, j) => j !== i) });

    // ─── Tier Helpers ─────────────────────────────────────────────────────────
    const updateTier = (ti: number, key: 'name' | 'price', val: string | number) => {
        const t = [...editingProduct.tiers]; t[ti] = { ...t[ti], [key]: val };
        setEditingProduct({ ...editingProduct, tiers: t });
    };
    const addTierField = (ti: number) => {
        const t = [...editingProduct.tiers];
        t[ti] = { ...t[ti], inheritedFields: [...(t[ti].inheritedFields || []), makeField()] };
        setEditingProduct({ ...editingProduct, tiers: t });
    };
    const updateTierField = (ti: number, fi: number, f: FormField) => {
        const t = [...editingProduct.tiers]; const a = [...(t[ti].inheritedFields || [])]; a[fi] = f;
        t[ti] = { ...t[ti], inheritedFields: a }; setEditingProduct({ ...editingProduct, tiers: t });
    };
    const removeTierField = (ti: number, fi: number) => {
        const t = [...editingProduct.tiers];
        t[ti] = { ...t[ti], inheritedFields: (t[ti].inheritedFields || []).filter((_, j) => j !== fi) };
        setEditingProduct({ ...editingProduct, tiers: t });
    };
    const setTierOverride = (ti: number, fieldId: string, count: number) => {
        const t = [...editingProduct.tiers];
        t[ti] = { ...t[ti], overrides: { ...(t[ti].overrides || {}), [fieldId]: count } };
        setEditingProduct({ ...editingProduct, tiers: t });
    };
    const removeTierOverride = (ti: number, fieldId: string) => {
        const t = [...editingProduct.tiers];
        const ov = { ...(t[ti].overrides || {}) }; delete ov[fieldId];
        t[ti] = { ...t[ti], overrides: Object.keys(ov).length ? ov : undefined };
        setEditingProduct({ ...editingProduct, tiers: t });
    };

    const getInheritedForTier = (ti: number): { field: FormField; fromTierName: string }[] => {
        const seen = new Map<string, { field: FormField; fromTierName: string }>();
        for (let i = 0; i < ti; i++) {
            (editingProduct.tiers[i].inheritedFields || []).forEach(f => {
                if (!seen.has(f.id)) seen.set(f.id, { field: f, fromTierName: editingProduct.tiers[i].name });
            });
        }
        return Array.from(seen.values());
    };

    // ─── Category & Option Helpers ────────────────────────────────────────────
    const addCategory = () => setEditingProduct({
        ...editingProduct, categories: [...editingProduct.categories, { id: generateUUID(), name: '', type: 'radio', options: [] }]
    });
    const updateCategory = (i: number, u: Partial<Category>) => {
        const c = [...editingProduct.categories]; c[i] = { ...c[i], ...u };
        setEditingProduct({ ...editingProduct, categories: c });
    };
    const removeCategory = (i: number) => setEditingProduct({ ...editingProduct, categories: editingProduct.categories.filter((_, j) => j !== i) });

    const addOption = (ci: number) => {
        const c = [...editingProduct.categories]; c[ci].options.push({ id: generateUUID(), name: '', linkTier: 0 });
        setEditingProduct({ ...editingProduct, categories: c });
    };
    const updateOption = (ci: number, oi: number, u: Partial<Option>) => {
        const c = [...editingProduct.categories]; c[ci].options[oi] = { ...c[ci].options[oi], ...u };
        setEditingProduct({ ...editingProduct, categories: c });
    };
    const removeOption = (ci: number, oi: number) => {
        const c = [...editingProduct.categories]; c[ci].options = c[ci].options.filter((_, j) => j !== oi);
        setEditingProduct({ ...editingProduct, categories: c });
    };

    const addTriggeredField = (ci: number, oi: number) => {
        const opt = editingProduct.categories[ci].options[oi];
        updateOption(ci, oi, { triggeredFields: [...(opt.triggeredFields || []), makeField()] });
    };
    const updateTriggeredField = (ci: number, oi: number, fi: number, f: FormField) => {
        const a = [...(editingProduct.categories[ci].options[oi].triggeredFields || [])]; a[fi] = f;
        updateOption(ci, oi, { triggeredFields: a });
    };
    const removeTriggeredField = (ci: number, oi: number, fi: number) => {
        updateOption(ci, oi, { triggeredFields: (editingProduct.categories[ci].options[oi].triggeredFields || []).filter((_, j) => j !== fi) });
    };

    const { globalDictionaries } = data;

    return (
        <div className={styles.container}>
            <SubHeader title="עריכת מוצר" />

            <div className={styles.content}>

                {/* ── SECTION 1: Base Data & Base Fields ─────────────────── */}
                <BaseCard variant="outlined" className={styles.card}>
                    <SectionHeader icon={<Settings size={20} />}>מידע בסיסי ושדות קבועים</SectionHeader>

                    <Input label="שם המוצר *" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />

                    <TextArea
                        label="תיאור (אופציונלי)" rows={2}
                        value={editingProduct.description || ''}
                        onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value || undefined })}
                        placeholder="תיאור קצר שיופיע ללקוח"
                    />

                    <TextArea label="תבנית הודעה" rows={3} value={editingProduct.messageTemplate} onChange={e => setEditingProduct({ ...editingProduct, messageTemplate: e.target.value })} />

                    {/* Base Fields Manager */}
                    <div>
                        <div className={styles.sectionHeaderRow}>
                            <label className={styles.sectionLabel}>שדות בסיס (תמיד יופיעו לכל לקוח)</label>
                            <button onClick={addBaseField} className={styles.addBtn}>
                                <Plus size={13} />הוסף שדה
                            </button>
                        </div>
                        {(editingProduct.baseFields || []).length === 0
                            ? <p className={styles.emptyState}>אין שדות בסיס — שדות ייקבעו לפי הרמה שנבחרה</p>
                            : <div className={styles.fieldsList}>{(editingProduct.baseFields || []).map((f, i) => (
                                <FormFieldEditor key={f.id} field={f} onChange={u => updateBaseField(i, u)} onRemove={() => removeBaseField(i)} globalDictionaries={globalDictionaries} />
                            ))}</div>
                        }
                    </div>
                </BaseCard>

                {/* ── SECTION 2: Tier Matrix ──────────────────────────────── */}
                <section className={styles.tierSection}>
                    <SectionHeader size="lg" icon={<Settings size={20} />}>מטריצת רמות מחיר (Tiers)</SectionHeader>
                    <div className={styles.tierInfo}>
                        כל רמה מוסיפה שדות חדשים. רמה גבוהה יורשת שדות מרמות נמוכות. ניתן לעקוף (Override) כמות שדה מורש בכל רמה.
                    </div>

                    {editingProduct.tiers.map((tier, ti) => {
                        const inherited = getInheritedForTier(ti);
                        const isExpanded = expandedTier === ti;
                        return (
                            <BaseCard key={ti} variant="outlined" className={styles.tierCard}>
                                <button
                                    className={styles.tierHeader}
                                    onClick={() => setExpandedTier(isExpanded ? null : ti)}
                                >
                                    <div className={styles.tierDetails}>
                                        <span className={styles.tierName}>{tier.name || `רמה ${ti + 1}`}</span>
                                        <span className={styles.tierPrice}>₪{tier.price}</span>
                                        {(tier.inheritedFields || []).length > 0 && (
                                            <span className={styles.tierFields}>{(tier.inheritedFields || []).length} שדות</span>
                                        )}
                                    </div>
                                    {isExpanded ? <ChevronUp size={18} className={styles.chevronIcon} /> : <ChevronDown size={18} className={styles.chevronIcon} />}
                                </button>

                                {isExpanded && (
                                    <div className={styles.tierContent}>
                                        <div className={styles.tierRow}>
                                            <Input label="שם הרמה" value={tier.name} onChange={e => updateTier(ti, 'name', e.target.value)} className={styles.bgWhite} />
                                            <div className={styles.tierPriceCol}>
                                                <Input label="מחיר (₪)" type="number" value={tier.price} onChange={e => updateTier(ti, 'price', Number(e.target.value))} className={styles.bgWhite} />
                                            </div>
                                        </div>

                                        {inherited.length > 0 && (
                                            <div className={styles.tierBox}>
                                                <label className={styles.tierBoxLabel}>שדות בירושה מרמות קודמות</label>
                                                <div className={styles.fieldsList}>
                                                    {inherited.map(({ field, fromTierName }) => (
                                                        <FormFieldEditor
                                                            key={field.id} field={field} onChange={() => { }} onRemove={() => { }}
                                                            globalDictionaries={globalDictionaries}
                                                            isInherited inheritedFromTier={fromTierName}
                                                            overriddenCount={tier.overrides?.[field.id]}
                                                            onSetOverride={count => setTierOverride(ti, field.id, count)}
                                                            onRemoveOverride={() => removeTierOverride(ti, field.id)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className={styles.tierBox}>
                                            <div className={styles.tierBoxHeader}>
                                                <label className={styles.label}>שדות שמוצגים החל מרמה זו</label>
                                                <button onClick={() => addTierField(ti)} className={styles.addBtn}>
                                                    <Plus size={13} />הוסף שדה
                                                </button>
                                            </div>
                                            {(tier.inheritedFields || []).length === 0
                                                ? <p className={styles.emptyState}>אין שדות חדשים ברמה זו</p>
                                                : <div className={styles.fieldsList}>{(tier.inheritedFields || []).map((f, fi) => (
                                                    <FormFieldEditor key={f.id} field={f} onChange={u => updateTierField(ti, fi, u)} onRemove={() => removeTierField(ti, fi)} globalDictionaries={globalDictionaries} />
                                                ))}</div>
                                            }
                                        </div>
                                    </div>
                                )}
                            </BaseCard>
                        );
                    })}
                </section>

                {/* ── SECTION 3: Categories & Triggers Builder ───────────── */}
                <section className={styles.tierSection}>
                    <SectionHeader size="lg">קטגוריות ואפשרויות</SectionHeader>

                    {editingProduct.categories.map((cat, ci) => (
                        <BaseCard key={cat.id} variant="outlined" className={styles.catCard}>
                            <IconButton icon={<Trash2 size={18} />} variant="danger" size="sm" onClick={() => removeCategory(ci)} label="מחק קטגוריה" className={styles.deleteCatBtn} />

                            <div className={styles.catHeader}>
                                <Input
                                    placeholder="שם הקטגוריה" value={cat.name}
                                    onChange={e => updateCategory(ci, { name: e.target.value })}
                                    className={styles.catNameInput}
                                />
                                <div className={styles.radioGroup}>
                                    <label className={styles.radioItem}>
                                        <input type="radio" checked={cat.type === 'radio'} onChange={() => updateCategory(ci, { type: 'radio' })} className={styles.accentRadio} />
                                        <span className={styles.radioText}>בחירה יחידה</span>
                                    </label>
                                    <label className={styles.radioItem}>
                                        <input type="radio" checked={cat.type === 'checkbox'} onChange={() => updateCategory(ci, { type: 'checkbox' })} className={styles.accentRadio} />
                                        <span className={styles.radioText}>בחירה מרובה</span>
                                    </label>
                                </div>
                            </div>

                            <div className={styles.catOptions}>
                                {cat.options.map((opt, oi) => (
                                    <div key={opt.id} className={styles.optionCard}>
                                        <div className={styles.optionRow}>
                                            <Input placeholder="שם האפשרות" value={opt.name} onChange={e => updateOption(ci, oi, { name: e.target.value })} className={styles.optionNameInput} />
                                            <button onClick={() => removeOption(ci, oi)} className={styles.removeOptionBtn}><X size={16} /></button>
                                        </div>

                                        <div className={styles.optionRow}>
                                            <BaseSelect className={styles.optionSelect} value={opt.linkTier} onChange={e => updateOption(ci, oi, { linkTier: Number(e.target.value) })}>
                                                {editingProduct.tiers.map((t, idx) => (
                                                    <option key={idx} value={idx}>קשר ל-{t.name} ({t.price}₪)</option>
                                                ))}
                                                <option value={-1}>מחיר ידני...</option>
                                            </BaseSelect>
                                            {opt.linkTier === -1 && (
                                                <Input type="number" placeholder="מחיר" className={styles.optionInput} value={opt.manualPrice || 0} onChange={e => updateOption(ci, oi, { manualPrice: Number(e.target.value) })} />
                                            )}
                                        </div>

                                        {/* Triggered Fields */}
                                        <div className={styles.triggeredContainer}>
                                            <div className={styles.triggeredHeader}>
                                                <span className={styles.title}>שדות מופעלים בבחירת אפשרות זו</span>
                                                <button onClick={() => addTriggeredField(ci, oi)} className={styles.addBtn}>
                                                    <Plus size={12} />הוסף שדה
                                                </button>
                                            </div>
                                            {(opt.triggeredFields || []).length === 0
                                                ? <p className={styles.triggeredEmpty}>לא יבוקשו פרטים נוספים בבחירת אפשרות זו</p>
                                                : <div className={styles.fieldsList}>{(opt.triggeredFields || []).map((f, fi) => (
                                                    <FormFieldEditor key={f.id} field={f} onChange={u => updateTriggeredField(ci, oi, fi, u)} onRemove={() => removeTriggeredField(ci, oi, fi)} globalDictionaries={globalDictionaries} />
                                                ))}</div>
                                            }
                                        </div>

                                        {/* Linked Product */}
                                        <div className={styles.linkedContainer}>
                                            <label className={styles.label}>קישור למוצר (תוספת נפרדת)</label>
                                            <BaseSelect
                                                className={styles.linkedSelect} value={opt.linkedProductId || ''}
                                                onChange={e => {
                                                    const v = e.target.value;
                                                    const c = [...editingProduct.categories];
                                                    if (v) { c[ci].options[oi] = { ...c[ci].options[oi], linkedProductId: v }; }
                                                    else { const { linkedProductId: _, ...rest } = c[ci].options[oi]; c[ci].options[oi] = rest as Option; }
                                                    setEditingProduct({ ...editingProduct, categories: c });
                                                }}
                                            >
                                                <option value="">ללא קישור</option>
                                                {data.products.filter(p => p.id !== editingProduct.id).map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </BaseSelect>
                                            {opt.linkedProductId && <p className={styles.linkedHelp}>✓ בחירת אפשרות זו תפתח מחשבון נפרד למוצר המקושר</p>}
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => addOption(ci)} className={styles.addOptionBtn}>
                                    {cat.name ? `הוסף אפשרות לקטגוריית ${cat.name}` : 'הוסף אפשרות'}<Plus size={16} />
                                </button>
                            </div>
                        </BaseCard>
                    ))}

                    <Button variant="secondary" fullWidth onClick={addCategory} className={styles.addCategoryBtn}>
                        הוסף קטגוריה חדשה<Plus size={20} />
                    </Button>
                </section>
            </div>

            <StickyFooter>
                <div className={styles.footerButtons}>
                    <Button variant="secondary" fullWidth size="lg" onClick={() => navigate('ADMIN_DASHBOARD')}>
                        ביטול שינויים
                    </Button>
                    <Button fullWidth size="lg" onClick={saveProduct} disabled={!editingProduct.name}>
                        שמור שינויים<Check />
                    </Button>
                </div>
            </StickyFooter>
        </div>
    );
};
