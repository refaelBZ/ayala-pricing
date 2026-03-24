import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { Option, OptionFormInput } from '../types';
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

    // ─── Smart Suggestion System ──────────────────────────────────────────────
    const knownSuggestions: { label: string; choices: string[] }[] = [];
    data.products.forEach(p => {
        p.categories.forEach(c => {
            c.options.forEach(o => {
                o.formInputs?.forEach(fi => {
                    if (fi.choices?.length && !knownSuggestions.find(s => s.label === fi.label)) {
                        knownSuggestions.push({ label: fi.label, choices: fi.choices! });
                    }
                });
            });
        });
    });
    data.globalCategories.forEach(gc => {
        gc.options.forEach(o => {
            o.formInputs?.forEach(fi => {
                if (fi.choices?.length && !knownSuggestions.find(s => s.label === fi.label)) {
                    knownSuggestions.push({ label: fi.label, choices: fi.choices! });
                }
            });
        });
    });

    const [suggestKey, setSuggestKey] = useState<string | null>(null);
    const [choicesRaw, setChoicesRaw] = useState<Record<string, string>>({});

    const save = async () => {
        if (!editingGlobalCategory.name) { showToast('נא להזין שם קטגוריה'); return; }
        setLoading(true);
        await saveGlobalCategoryToFirestore(editingGlobalCategory);
        await loadData();
        setLoading(false);
        navigate('ADMIN_DASHBOARD');
        showToast('נשמר בהצלחה');
    };

    const updateName = (name: string) => setEditingGlobalCategory({ ...editingGlobalCategory, name });

    const toggleProduct = (productId: string) => {
        const ids = editingGlobalCategory.targetProductIds;
        const next = ids.includes(productId) ? ids.filter(id => id !== productId) : [...ids, productId];
        setEditingGlobalCategory({ ...editingGlobalCategory, targetProductIds: next });
    };

    const addOption = () => {
        const newOpts = [...editingGlobalCategory.options, { id: generateUUID(), name: '', linkTier: -1, manualPrice: 0 }];
        setEditingGlobalCategory({ ...editingGlobalCategory, options: newOpts });
    };

    const updateOption = (optIdx: number, updates: Partial<Option>) => {
        const newOpts = [...editingGlobalCategory.options];
        newOpts[optIdx] = { ...newOpts[optIdx], ...updates };
        setEditingGlobalCategory({ ...editingGlobalCategory, options: newOpts });
    };

    const removeOption = (optIdx: number) => {
        setEditingGlobalCategory({ ...editingGlobalCategory, options: editingGlobalCategory.options.filter((_, i) => i !== optIdx) });
    };

    const updateFormInputSpec = (optIdx: number, specIdx: number, updates: Partial<OptionFormInput>) => {
        const opt = editingGlobalCategory.options[optIdx];
        const newSpecs = [...(opt.formInputs || [])];
        newSpecs[specIdx] = { ...newSpecs[specIdx], ...updates };
        updateOption(optIdx, { formInputs: newSpecs });
    };

    const addFormInputSpec = (optIdx: number) => {
        const opt = editingGlobalCategory.options[optIdx];
        updateOption(optIdx, { formInputs: [...(opt.formInputs || []), { count: 1, label: '' }] });
    };

    const removeFormInputSpec = (optIdx: number, specIdx: number) => {
        const opt = editingGlobalCategory.options[optIdx];
        const newSpecs = opt.formInputs!.filter((_, i) => i !== specIdx);
        if (newSpecs.length === 0) {
            const newOpts = [...editingGlobalCategory.options];
            const { formInputs, ...rest } = newOpts[optIdx];
            newOpts[optIdx] = rest as Option;
            setEditingGlobalCategory({ ...editingGlobalCategory, options: newOpts });
        } else {
            updateOption(optIdx, { formInputs: newSpecs });
        }
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
                        onChange={e => updateName(e.target.value)}
                        placeholder="לדוגמה: משלוח, הערות אלרגנים"
                    />
                    <div>
                        <label className="block text-body-sm font-medium text-secondary mb-2">סוג בחירה</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={editingGlobalCategory.type === 'radio'}
                                    onChange={() => setEditingGlobalCategory({ ...editingGlobalCategory, type: 'radio' })}
                                    className="accent-[var(--color-primary)]"
                                />
                                <span className="text-body-sm">בחירה יחידה</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={editingGlobalCategory.type === 'checkbox'}
                                    onChange={() => setEditingGlobalCategory({ ...editingGlobalCategory, type: 'checkbox' })}
                                    className="accent-[var(--color-primary)]"
                                />
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
                                <input
                                    type="checkbox"
                                    checked={editingGlobalCategory.targetProductIds.includes(p.id)}
                                    onChange={() => toggleProduct(p.id)}
                                    className="accent-[var(--color-primary)] w-4 h-4 rounded"
                                />
                                <span className="text-body-sm text-primary">{p.name}</span>
                            </label>
                        ))}
                        {data.products.length === 0 && (
                            <p className="text-caption text-muted">אין מוצרים להצגה</p>
                        )}
                    </div>
                </BaseCard>

                {/* Options */}
                <section className="space-y-4">
                    <label className="block text-body-sm font-medium text-secondary px-1">אפשרויות (תמיד מחיר ידני)</label>

                    {editingGlobalCategory.options.map((opt, optIdx) => (
                        <div key={opt.id} className="bg-accent-surface p-3 rounded-2xl border border-light/50">
                            <div className="flex gap-2 items-center mb-2">
                                <Input
                                    placeholder="שם האפשרות"
                                    value={opt.name}
                                    onChange={e => updateOption(optIdx, { name: e.target.value })}
                                    className="h-10 text-body-sm bg-white"
                                />
                                <button onClick={() => removeOption(optIdx)} className="text-accent-muted hover:text-danger-text p-2 transition-colors duration-base">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Manual price — always visible */}
                            <div className="flex gap-2 items-center mb-2">
                                <label className="text-caption text-secondary whitespace-nowrap">מחיר ₪</label>
                                <Input
                                    type="number"
                                    placeholder="מחיר"
                                    className="w-28 h-10 text-body-sm bg-white"
                                    value={opt.manualPrice ?? 0}
                                    onChange={e => updateOption(optIdx, { manualPrice: Number(e.target.value) })}
                                />
                            </div>

                            {/* Dynamic Form Inputs Config */}
                            <div className="mt-2 pt-2 border-t border-light/50">
                                <label className="flex items-center gap-2 cursor-pointer text-caption text-secondary mb-2">
                                    <input
                                        type="checkbox"
                                        checked={!!opt.formInputs?.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                updateOption(optIdx, { formInputs: [{ count: 1, label: '' }] });
                                            } else {
                                                if (opt.formInputs?.length && !window.confirm('האם אתה בטוח שברצונך למחוק את כל השדות שהוגדרו?')) return;
                                                const newOpts = [...editingGlobalCategory.options];
                                                const { formInputs, ...rest } = newOpts[optIdx];
                                                newOpts[optIdx] = rest as Option;
                                                setEditingGlobalCategory({ ...editingGlobalCategory, options: newOpts });
                                            }
                                        }}
                                        className="accent-[var(--color-primary)] rounded"
                                    />
                                    דורש פירוט נוסף מהלקוח? (כמו עיר/כתובת)
                                </label>

                                {opt.formInputs?.map((spec, specIdx) => {
                                    const sk = `${optIdx}-${specIdx}`;
                                    const labelSuggestions = knownSuggestions.filter(s =>
                                        spec.label && s.label.includes(spec.label) && s.label !== spec.label
                                    );
                                    const exactMatch = knownSuggestions.find(s => s.label === spec.label);
                                    return (
                                        <div key={specIdx} className="mb-2 p-2 bg-white/60 rounded-xl border border-light/50 space-y-2">
                                            <div className="flex gap-2 items-end">
                                                <div className="flex-1 relative">
                                                    <label className="text-micro text-muted block mb-1">תווית</label>
                                                    <Input
                                                        value={spec.label}
                                                        onChange={e => updateFormInputSpec(optIdx, specIdx, { label: e.target.value })}
                                                        onFocus={() => setSuggestKey(sk)}
                                                        onBlur={() => setTimeout(() => setSuggestKey(null), 150)}
                                                        className="h-8 text-xs bg-white"
                                                        placeholder="לדוגמה: כתובת"
                                                    />
                                                    {suggestKey === sk && labelSuggestions.length > 0 && (
                                                        <div className="absolute top-full right-0 left-0 z-20 mt-1 bg-white border border-light rounded-xl shadow-card overflow-hidden">
                                                            {labelSuggestions.map(s => (
                                                                <button key={s.label} onMouseDown={e => { e.preventDefault(); updateFormInputSpec(optIdx, specIdx, { label: s.label, choices: s.choices }); setSuggestKey(null); }} className="w-full text-right px-3 py-2 text-xs hover:bg-accent-ghost transition-colors flex justify-between items-center gap-2">
                                                                    <span className="text-muted truncate">{s.choices.slice(0, 3).join(', ')}{s.choices.length > 3 ? '...' : ''}</span>
                                                                    <span className="font-medium text-primary shrink-0">{s.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="w-16">
                                                    <label className="text-micro text-muted block mb-1">כמות</label>
                                                    <Input type="number" min={1} value={spec.count} onChange={e => updateFormInputSpec(optIdx, specIdx, { count: Number(e.target.value) })} className="h-8 text-xs bg-white text-center" />
                                                </div>
                                                <button onClick={() => removeFormInputSpec(optIdx, specIdx)} className="p-1.5 text-accent-muted hover:text-danger-text transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            {/* Choices */}
                                            <div className="relative">
                                                <label className="text-micro text-muted block mb-1">אפשרויות לבחירה (מופרדות בפסיק) — ריק = שדה חופשי</label>
                                                <Input
                                                    value={`opt-choices-${sk}` in choicesRaw ? choicesRaw[`opt-choices-${sk}`] : (spec.choices?.join(', ') || '')}
                                                    onChange={e => setChoicesRaw(prev => ({ ...prev, [`opt-choices-${sk}`]: e.target.value }))}
                                                    onFocus={() => {
                                                        setChoicesRaw(prev => ({ ...prev, [`opt-choices-${sk}`]: spec.choices?.join(', ') || '' }));
                                                        setSuggestKey(`choices-${sk}`);
                                                    }}
                                                    onBlur={() => {
                                                        const raw = choicesRaw[`opt-choices-${sk}`] ?? '';
                                                        const parsed = raw.split(',').map(s => s.trim()).filter(Boolean);
                                                        updateFormInputSpec(optIdx, specIdx, { choices: parsed.length ? parsed : undefined });
                                                        setChoicesRaw(prev => { const next = { ...prev }; delete next[`opt-choices-${sk}`]; return next; });
                                                        setTimeout(() => setSuggestKey(null), 150);
                                                    }}
                                                    className="h-8 text-xs bg-white"
                                                    placeholder="לדוגמה: תל אביב, ירושלים, חיפה"
                                                />
                                                {suggestKey === `choices-${sk}` && knownSuggestions.length > 0 && (
                                                    <div className="absolute top-full right-0 left-0 z-20 mt-1 bg-white border border-light rounded-xl shadow-card overflow-hidden">
                                                        {(exactMatch ? [exactMatch] : knownSuggestions).map(s => (
                                                            <button key={s.label} onMouseDown={e => { e.preventDefault(); updateFormInputSpec(optIdx, specIdx, { choices: s.choices }); setSuggestKey(null); }} className="w-full text-right px-3 py-2 text-xs hover:bg-accent-ghost transition-colors flex justify-between items-center gap-2">
                                                                <span className="text-muted truncate">{s.choices.join(', ')}</span>
                                                                <span className="font-medium text-primary shrink-0">↵ {s.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {opt.formInputs?.length ? (
                                    <button onClick={() => addFormInputSpec(optIdx)} className="text-caption text-accent font-bold flex items-center gap-1 mt-1 hover:bg-accent-ghost px-2 py-1 rounded-lg transition-colors duration-base">
                                        <Plus size={12} />
                                        הוסף שדה נוסף
                                    </button>
                                ) : null}
                            </div>

                            {/* Link to Product Config */}
                            <div className="mt-2 pt-2 border-t border-light/50">
                                <label className="text-caption text-secondary block mb-1.5">קישור למוצר (תוספת נפרדת)</label>
                                <BaseSelect
                                    className="h-9 text-body-sm"
                                    value={opt.linkedProductId || ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        const newOpts = [...editingGlobalCategory.options];
                                        if (val) {
                                            newOpts[optIdx] = { ...newOpts[optIdx], linkedProductId: val };
                                        } else {
                                            const { linkedProductId: _removed, ...rest } = newOpts[optIdx];
                                            newOpts[optIdx] = rest as Option;
                                        }
                                        setEditingGlobalCategory({ ...editingGlobalCategory, options: newOpts });
                                    }}
                                >
                                    <option value="">ללא קישור</option>
                                    {data.products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </BaseSelect>
                                {opt.linkedProductId && (
                                    <p className="text-micro text-accent mt-1">✓ בחירת אפשרות זו תפתח מחשבון נפרד למוצר המקושר</p>
                                )}
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={addOption}
                        className="w-full py-3 border border-dashed border-default rounded-xl text-accent-soft font-medium hover:bg-accent-ghost transition-all duration-base flex items-center justify-center gap-2 text-body-sm"
                    >
                        <Plus size={16} />
                        הוסף אפשרות
                    </button>
                </section>
            </div>

            <StickyFooter>
                <Button fullWidth size="lg" onClick={save} disabled={!editingGlobalCategory.name}>
                    <Check className="ml-2" />
                    שמור שינויים
                </Button>
            </StickyFooter>
        </div>
    );
};
