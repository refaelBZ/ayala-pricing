import React from 'react';
import { X, Plus, Check, BookOpen } from 'lucide-react';
import { FormField, Option } from '../types';
import { AppState } from '../hooks/useAppState';
import { Button } from '../components/Button';
import { Input, BaseSelect } from '../components/Input';
import { SubHeader } from '../components/SubHeader';
import { StickyFooter } from '../components/StickyFooter';
import { BaseCard } from '../components/BaseCard';
import { saveGlobalCategoryToFirestore, generateUUID } from '../services/storage';

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
        <div className="min-h-screen flex flex-col">
            <SubHeader title="עריכת קטגוריה גלובלית" onBack={() => navigate('ADMIN_DASHBOARD')} backIcon="close" />

            <div className="p-6 space-y-8 pb-32 overflow-y-auto">
                {/* Category Name + Type */}
                <BaseCard variant="outlined" className="space-y-4 !p-6 !rounded-3xl">
                    <Input
                        label="שם הקטגוריה"
                        value={editingGlobalCategory.name}
                        onChange={e => setEditingGlobalCategory({ ...editingGlobalCategory, name: e.target.value })}
                        placeholder="לדוגמה: משלוח, הערות אלרגנים"
                    />
                    <div>
                        <label className="block text-body-sm font-medium text-secondary mb-2">סוג בחירה</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" checked={editingGlobalCategory.type === 'radio'} onChange={() => setEditingGlobalCategory({ ...editingGlobalCategory, type: 'radio' })} className="accent-[var(--color-primary)]" />
                                <span className="text-body-sm">בחירה יחידה</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" checked={editingGlobalCategory.type === 'checkbox'} onChange={() => setEditingGlobalCategory({ ...editingGlobalCategory, type: 'checkbox' })} className="accent-[var(--color-primary)]" />
                                <span className="text-body-sm">בחירה מרובה</span>
                            </label>
                        </div>
                    </div>
                </BaseCard>

                {/* Product Targeting */}
                <BaseCard variant="outlined" className="space-y-4 !p-6 !rounded-3xl">
                    <label className="block text-body-sm font-medium text-secondary">מוצרים שהקטגוריה מופיעה בהם</label>
                    <div className="space-y-2">
                        {data.products.map(p => (
                            <label key={p.id} className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={editingGlobalCategory.targetProductIds.includes(p.id)} onChange={() => toggleProduct(p.id)} className="accent-[var(--color-primary)] w-4 h-4 rounded" />
                                <span className="text-body-sm text-primary">{p.name}</span>
                            </label>
                        ))}
                        {data.products.length === 0 && <p className="text-caption text-muted">אין מוצרים להצגה</p>}
                    </div>
                </BaseCard>

                {/* Options */}
                <section className="space-y-4">
                    <label className="block text-body-sm font-medium text-secondary px-1">אפשרויות (תמיד מחיר ידני)</label>

                    {editingGlobalCategory.options.map((opt, oi) => (
                        <div key={opt.id} className="bg-accent-surface p-3 rounded-2xl border border-light/50">
                            <div className="flex gap-2 items-center mb-2">
                                <Input placeholder="שם האפשרות" value={opt.name} onChange={e => updateOption(oi, { name: e.target.value })} className="h-10 text-body-sm bg-white" />
                                <button onClick={() => removeOption(oi)} className="text-accent-muted hover:text-danger-text p-2 transition-colors"><X size={16} /></button>
                            </div>

                            <div className="flex gap-2 items-center mb-3">
                                <label className="text-caption text-secondary whitespace-nowrap">מחיר ₪</label>
                                <Input type="number" placeholder="מחיר" className="w-28 h-10 text-body-sm bg-white" value={opt.manualPrice ?? 0} onChange={e => updateOption(oi, { manualPrice: Number(e.target.value) })} />
                            </div>

                            {/* Triggered Fields */}
                            <div className="mt-2 pt-2 border-t border-light/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-caption text-secondary font-medium">שדות מופעלים בבחירת אפשרות זו</span>
                                    <button onClick={() => addTriggeredField(oi)} className="text-caption text-accent font-bold flex items-center gap-1 hover:bg-accent-ghost px-2 py-1 rounded-lg transition-colors">
                                        <Plus size={12} />הוסף שדה
                                    </button>
                                </div>
                                {(opt.triggeredFields || []).length === 0
                                    ? <p className="text-micro text-muted text-center py-2">לא יבוקשו פרטים נוספים</p>
                                    : <div className="space-y-2">
                                        {(opt.triggeredFields || []).map((field, fi) => (
                                            <div key={field.id} className="p-2 bg-white rounded-xl border border-light space-y-2">
                                                <div className="flex gap-2 items-end">
                                                    <div className="flex-1">
                                                        <Input value={field.label} onChange={e => updateTriggeredField(oi, fi, { ...field, label: e.target.value })} className="h-8 text-xs bg-white" placeholder="תווית (לדוגמה: כתובת)" />
                                                    </div>
                                                    <div className="w-16">
                                                        <Input type="number" min={1} value={field.count} onChange={e => updateTriggeredField(oi, fi, { ...field, count: Number(e.target.value) })} className="h-8 text-xs bg-white text-center" />
                                                    </div>
                                                    <button onClick={() => removeTriggeredField(oi, fi)} className="p-1.5 text-accent-muted hover:text-danger-text transition-colors"><X size={14} /></button>
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    <BaseSelect className="h-7 text-xs flex-1" value={field.type} onChange={e => updateTriggeredField(oi, fi, { ...field, type: e.target.value as 'text' | 'dictionary', dictionaryId: undefined })}>
                                                        <option value="text">טקסט חופשי</option>
                                                        <option value="dictionary">מאפיינים</option>
                                                    </BaseSelect>
                                                    {field.type === 'dictionary' && (
                                                        <BaseSelect className="h-7 text-xs flex-1" value={field.dictionaryId || ''} onChange={e => updateTriggeredField(oi, fi, { ...field, dictionaryId: e.target.value || undefined })}>
                                                            <option value="">בחר מאגר...</option>
                                                            {globalDictionaries.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                        </BaseSelect>
                                                    )}
                                                    {field.type === 'dictionary' && field.dictionaryId && (
                                                        <BookOpen size={12} className="text-accent shrink-0" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                }
                            </div>

                            {/* Linked Product */}
                            <div className="mt-2 pt-2 border-t border-light/50">
                                <label className="text-caption text-secondary block mb-1.5">קישור למוצר (תוספת נפרדת)</label>
                                <BaseSelect className="h-9 text-body-sm" value={opt.linkedProductId || ''}
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

                    <button onClick={addOption} className="w-full py-3 border border-dashed border-default rounded-xl text-accent-soft font-medium hover:bg-accent-ghost transition-all duration-base flex items-center justify-center gap-2 text-body-sm">
                        <Plus size={16} />הוסף אפשרות
                    </button>
                </section>
            </div>

            <StickyFooter>
                <Button fullWidth size="lg" onClick={save} disabled={!editingGlobalCategory.name}>
                    <Check className="ml-2" />שמור שינויים
                </Button>
            </StickyFooter>
        </div>
    );
};
