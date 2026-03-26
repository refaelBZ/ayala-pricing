import React, { useState } from 'react';
import { X, Settings, Plus, Trash2, Check, BookOpen, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Category, FormField, Option, Product } from '../types';
import { AppState } from '../hooks/useAppState';
import { Button } from '../components/Button';
import { Input, TextArea, BaseSelect } from '../components/Input';
import { SubHeader } from '../components/SubHeader';
import { StickyFooter } from '../components/StickyFooter';
import { SectionHeader } from '../components/SectionHeader';
import { BaseCard } from '../components/BaseCard';
import { IconButton } from '../components/IconButton';
import { saveProductToFirestore, generateUUID } from '../services/storage';

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
            <div className="p-3 rounded-2xl bg-accent-ghost/40 border border-accent-ghost flex items-center gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-micro text-accent bg-white px-2 py-0.5 rounded-full border border-light shrink-0">
                            מ: {inheritedFromTier}
                        </span>
                        <span className="font-medium text-body-sm text-primary truncate">{field.label || '(ללא תווית)'}</span>
                        {field.type === 'dictionary' && <BookOpen size={12} className="text-accent shrink-0" />}
                    </div>
                    <span className="text-caption text-muted">
                        כמות: {effectiveCount}
                        {overriddenCount !== undefined && <span className="text-accent mr-1">(מקורי: {field.count})</span>}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {showOverrideInput ? (
                        <>
                            <Input type="number" min={1} value={overrideValue} onChange={e => setOverrideValue(Number(e.target.value))} className="w-16 h-8 text-xs bg-white text-center" />
                            <button onClick={() => { onSetOverride?.(overrideValue); setShowOverrideInput(false); }} className="p-1.5 text-accent hover:bg-accent-ghost rounded-lg transition-colors">
                                <Check size={13} />
                            </button>
                            <button onClick={() => setShowOverrideInput(false)} className="p-1.5 text-muted hover:bg-accent-ghost rounded-lg transition-colors">
                                <X size={13} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => { setOverrideValue(effectiveCount); setShowOverrideInput(true); }}
                                className="text-caption text-accent hover:bg-accent-ghost px-2 py-1 rounded-lg transition-colors"
                            >
                                {overriddenCount !== undefined ? 'ערוך' : 'Override'}
                            </button>
                            {overriddenCount !== undefined && onRemoveOverride && (
                                <button onClick={onRemoveOverride} className="p-1.5 text-muted hover:text-danger-text transition-colors" title="הסר override">
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
        <div className="p-3 rounded-2xl bg-white border border-light space-y-2">
            <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <label className="text-micro text-muted block mb-1">תווית</label>
                    <Input value={field.label} onChange={e => onChange({ ...field, label: e.target.value })} className="h-8 text-xs bg-white" placeholder="לדוגמה: צבע זילוף" />
                </div>
                <div className="w-20">
                    <label className="text-micro text-muted block mb-1">כמות</label>
                    <Input type="number" min={1} value={field.count} onChange={e => onChange({ ...field, count: Number(e.target.value) })} className="h-8 text-xs bg-white text-center" />
                </div>
                <button onClick={onRemove} className="p-1.5 text-accent-muted hover:text-danger-text transition-colors mb-0.5">
                    <X size={15} />
                </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <BaseSelect className="h-8 text-xs w-full sm:flex-1" value={field.type} onChange={e => onChange({ ...field, type: e.target.value as 'text' | 'dictionary', dictionaryId: undefined })}>
                    <option value="text">טקסט חופשי</option>
                    <option value="dictionary">מאפיינים (רשימה)</option>
                </BaseSelect>
                {field.type === 'dictionary' && (
                    <BaseSelect className="h-8 text-xs w-full sm:flex-1" value={field.dictionaryId || ''} onChange={e => onChange({ ...field, dictionaryId: e.target.value || undefined })}>
                        <option value="">בחר מאגר...</option>
                        {globalDictionaries.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </BaseSelect>
                )}
                <label className="flex items-center gap-1.5 text-micro text-muted cursor-pointer shrink-0 py-1 sm:py-0">
                    <input type="checkbox" checked={field.isRequired} onChange={e => onChange({ ...field, isRequired: e.target.checked })} className="accent-[var(--color-primary)] rounded" />
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
        <div className="min-h-screen flex flex-col">
            <SubHeader title="עריכת מוצר" />

            <div className="p-6 space-y-8 pb-32 overflow-y-auto">

                {/* ── SECTION 1: Base Data & Base Fields ─────────────────── */}
                <BaseCard variant="outlined" className="space-y-5 !p-6 !rounded-3xl">
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
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-body-sm font-medium text-secondary">שדות בסיס (תמיד יופיעו לכל לקוח)</label>
                            <button onClick={addBaseField} className="text-caption text-accent font-bold flex items-center gap-1 hover:bg-accent-ghost px-2 py-1 rounded-lg transition-colors">
                                <Plus size={13} />הוסף שדה
                            </button>
                        </div>
                        {(editingProduct.baseFields || []).length === 0
                            ? <p className="text-caption text-muted text-center py-3 border border-dashed border-default rounded-xl">אין שדות בסיס — שדות ייקבעו לפי הרמה שנבחרה</p>
                            : <div className="space-y-2">{(editingProduct.baseFields || []).map((f, i) => (
                                <FormFieldEditor key={f.id} field={f} onChange={u => updateBaseField(i, u)} onRemove={() => removeBaseField(i)} globalDictionaries={globalDictionaries} />
                            ))}</div>
                        }
                    </div>
                </BaseCard>

                {/* ── SECTION 2: Tier Matrix ──────────────────────────────── */}
                <section className="space-y-4">
                    <SectionHeader size="lg" icon={<Settings size={20} />}>מטריצת רמות מחיר (Tiers)</SectionHeader>
                    <div className="bg-accent-ghost p-4 rounded-2xl text-body-sm text-secondary leading-relaxed">
                        כל רמה מוסיפה שדות חדשים. רמה גבוהה יורשת שדות מרמות נמוכות. ניתן לעקוף (Override) כמות שדה מורש בכל רמה.
                    </div>

                    {editingProduct.tiers.map((tier, ti) => {
                        const inherited = getInheritedForTier(ti);
                        const isExpanded = expandedTier === ti;
                        return (
                            <BaseCard key={ti} variant="outlined" className="!p-0 !rounded-3xl overflow-hidden">
                                <button
                                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-accent-ghost/30 transition-colors"
                                    onClick={() => setExpandedTier(isExpanded ? null : ti)}
                                >
                                    <div className="flex-1 text-right flex items-center gap-3">
                                        <span className="font-bold text-primary">{tier.name || `רמה ${ti + 1}`}</span>
                                        <span className="text-body-sm text-accent font-medium">₪{tier.price}</span>
                                        {(tier.inheritedFields || []).length > 0 && (
                                            <span className="text-micro text-muted">{(tier.inheritedFields || []).length} שדות</span>
                                        )}
                                    </div>
                                    {isExpanded ? <ChevronUp size={18} className="text-muted shrink-0" /> : <ChevronDown size={18} className="text-muted shrink-0" />}
                                </button>

                                {isExpanded && (
                                    <div className="px-5 pb-5 space-y-5 border-t border-subtle">
                                        <div className="flex gap-3 pt-4">
                                            <Input label="שם הרמה" value={tier.name} onChange={e => updateTier(ti, 'name', e.target.value)} className="bg-white" />
                                            <div className="w-1/3">
                                                <Input label="מחיר (₪)" type="number" value={tier.price} onChange={e => updateTier(ti, 'price', Number(e.target.value))} className="bg-white" />
                                            </div>
                                        </div>

                                        {inherited.length > 0 && (
                                            <div className="bg-gray-50 p-4 rounded-2xl">
                                                <label className="block text-caption text-muted mb-2 font-medium">שדות בירושה מרמות קודמות</label>
                                                <div className="space-y-2">
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

                                        <div className="bg-gray-50 p-4 rounded-2xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-caption text-muted font-medium">שדות שמוצגים החל מרמה זו</label>
                                                <button onClick={() => addTierField(ti)} className="text-caption text-accent font-bold flex items-center gap-1 hover:bg-accent-ghost px-2 py-1 rounded-lg transition-colors">
                                                    <Plus size={13} />הוסף שדה
                                                </button>
                                            </div>
                                            {(tier.inheritedFields || []).length === 0
                                                ? <p className="text-caption text-muted text-center py-3 border border-dashed border-default rounded-xl">אין שדות חדשים ברמה זו</p>
                                                : <div className="space-y-2">{(tier.inheritedFields || []).map((f, fi) => (
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
                <section className="space-y-6">
                    <SectionHeader size="lg">קטגוריות ואפשרויות</SectionHeader>

                    {editingProduct.categories.map((cat, ci) => (
                        <BaseCard key={cat.id} variant="outlined" className="relative !p-5 !rounded-3xl">
                            <IconButton icon={<Trash2 size={18} />} variant="danger" size="sm" onClick={() => removeCategory(ci)} label="מחק קטגוריה" className="absolute top-5 left-5" />

                            <div className="mb-5 pl-10">
                                <Input
                                    placeholder="שם הקטגוריה" value={cat.name}
                                    onChange={e => updateCategory(ci, { name: e.target.value })}
                                    className="font-bold !text-lg sm:!text-2xl border-transparent focus:border-focus bg-transparent px-2"
                                />
                                <div className="flex gap-4 mt-2 mr-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={cat.type === 'radio'} onChange={() => updateCategory(ci, { type: 'radio' })} className="accent-[var(--color-primary)]" />
                                        <span className="text-body-sm">בחירה יחידה</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={cat.type === 'checkbox'} onChange={() => updateCategory(ci, { type: 'checkbox' })} className="accent-[var(--color-primary)]" />
                                        <span className="text-body-sm">בחירה מרובה</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {cat.options.map((opt, oi) => (
                                    <div key={opt.id} className="bg-gray-50 p-5 pt-10 pb-10 rounded-2xl border border-light/50">
                                        <div className="flex gap-2 items-center mb-2">
                                            <Input placeholder="שם האפשרות" value={opt.name} onChange={e => updateOption(ci, oi, { name: e.target.value })} className="h-10 text-body-sm bg-white" />
                                            <button onClick={() => removeOption(ci, oi)} className="text-accent-muted hover:text-danger-text p-2 transition-colors"><X size={16} /></button>
                                        </div>

                                        <div className="flex gap-2 items-center">
                                            <BaseSelect className="h-10 text-body-sm" value={opt.linkTier} onChange={e => updateOption(ci, oi, { linkTier: Number(e.target.value) })}>
                                                {editingProduct.tiers.map((t, idx) => (
                                                    <option key={idx} value={idx}>קשר ל-{t.name} ({t.price}₪)</option>
                                                ))}
                                                <option value={-1}>מחיר ידני...</option>
                                            </BaseSelect>
                                            {opt.linkTier === -1 && (
                                                <Input type="number" placeholder="מחיר" className="w-24 h-10 text-body-sm bg-white" value={opt.manualPrice || 0} onChange={e => updateOption(ci, oi, { manualPrice: Number(e.target.value) })} />
                                            )}
                                        </div>

                                        {/* Triggered Fields */}
                                        <div className="mt-3 pt-3 border-t border-light/50">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-caption text-secondary font-medium">שדות מופעלים בבחירת אפשרות זו</span>
                                                <button onClick={() => addTriggeredField(ci, oi)} className="text-caption text-accent font-bold flex items-center gap-1 hover:bg-accent-ghost px-2 py-1 rounded-lg transition-colors">
                                                    <Plus size={12} />הוסף שדה
                                                </button>
                                            </div>
                                            {(opt.triggeredFields || []).length === 0
                                                ? <p className="text-micro text-muted text-center py-2">לא יבוקשו פרטים נוספים בבחירת אפשרות זו</p>
                                                : <div className="space-y-2">{(opt.triggeredFields || []).map((f, fi) => (
                                                    <FormFieldEditor key={f.id} field={f} onChange={u => updateTriggeredField(ci, oi, fi, u)} onRemove={() => removeTriggeredField(ci, oi, fi)} globalDictionaries={globalDictionaries} />
                                                ))}</div>
                                            }
                                        </div>

                                        {/* Linked Product */}
                                        <div className="mt-2 pt-2 border-t border-light/50">
                                            <label className="text-caption text-secondary block mb-1.5">קישור למוצר (תוספת נפרדת)</label>
                                            <BaseSelect
                                                className="h-9 text-body-sm" value={opt.linkedProductId || ''}
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
                                            {opt.linkedProductId && <p className="text-micro text-accent mt-1">✓ בחירת אפשרות זו תפתח מחשבון נפרד למוצר המקושר</p>}
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => addOption(ci)} className="w-full py-3 border border-dashed border-default rounded-xl text-accent-soft font-medium hover:bg-accent-ghost transition-all duration-base flex items-center justify-center gap-2 text-body-sm mt-2">
                                    {cat.name ? `הוסף אפשרות לקטגוריית ${cat.name}` : 'הוסף אפשרות'}<Plus size={16} />
                                </button>
                            </div>
                        </BaseCard>
                    ))}

                    <Button variant="secondary" fullWidth onClick={addCategory} className="!mt-12 border-dashed border-2 bg-transparent">
                        הוסף קטגוריה חדשה<Plus size={20} />
                    </Button>
                </section>
            </div>

            <StickyFooter>
                <div className="flex gap-3">
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
