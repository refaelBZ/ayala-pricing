import React, { useState } from 'react';
import { X, Settings, Plus, Trash2, Check, List } from 'lucide-react';
import { Category, Option, OptionFormInput } from '../types';
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

export const ProductEditorView: React.FC<Props> = ({ data, editingProduct, setEditingProduct, navigate, setLoading, loadData, showToast }) => {
    if (!editingProduct) return null;

    // ─── Smart Suggestion System ──────────────────────────────────────────────
    // Collect all { label, choices } pairs from all saved products (option formInputs + tier includedSpecs)
    const knownSuggestions: { label: string; choices: string[] }[] = [];
    data.products.forEach(p => {
        p.tiers.forEach(t => {
            t.includedSpecs?.forEach(fi => {
                if (fi.choices?.length && !knownSuggestions.find(s => s.label === fi.label)) {
                    knownSuggestions.push({ label: fi.label, choices: fi.choices! });
                }
            });
        });
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

    // suggestKey: tracks which input's suggestion panel is visible
    const [suggestKey, setSuggestKey] = useState<string | null>(null);
    // choicesRaw: buffers the raw comma-string while editing — parsed only on blur to prevent comma being eaten
    const [choicesRaw, setChoicesRaw] = useState<Record<string, string>>({});
    // tierModalIdx: which tier's spec modal is open (null = closed)
    const [tierModalIdx, setTierModalIdx] = useState<number | null>(null);
    // tierModalDraft: staged copy of the tier's specs while the modal is open
    const [tierModalDraft, setTierModalDraft] = useState<OptionFormInput[]>([]);

    const saveProduct = async () => {
        if (!editingProduct.name) { showToast('נא להזין שם מוצר'); return; }
        setLoading(true);
        await saveProductToFirestore(editingProduct);
        await loadData();
        setLoading(false);
        navigate('ADMIN_DASHBOARD');
        showToast('נשמר בהצלחה');
    };

    const addCategory = () => setEditingProduct({
        ...editingProduct,
        categories: [...editingProduct.categories, { id: generateUUID(), name: '', type: 'radio', options: [] }]
    });

    const updateCategory = (idx: number, updates: Partial<Category>) => {
        const newCats = [...editingProduct.categories];
        newCats[idx] = { ...newCats[idx], ...updates };
        setEditingProduct({ ...editingProduct, categories: newCats });
    };

    const removeCategory = (idx: number) => {
        setEditingProduct({ ...editingProduct, categories: editingProduct.categories.filter((_, i) => i !== idx) });
    };

    const addOption = (catIdx: number) => {
        const newCats = [...editingProduct.categories];
        newCats[catIdx].options.push({ id: generateUUID(), name: '', linkTier: 0 });
        setEditingProduct({ ...editingProduct, categories: newCats });
    };

    const updateOption = (catIdx: number, optIdx: number, updates: Partial<Option>) => {
        const newCats = [...editingProduct.categories];
        newCats[catIdx].options[optIdx] = { ...newCats[catIdx].options[optIdx], ...updates };
        setEditingProduct({ ...editingProduct, categories: newCats });
    };

    const updateFormInputSpec = (catIdx: number, optIdx: number, specIdx: number, updates: Partial<OptionFormInput>) => {
        const opt = editingProduct.categories[catIdx].options[optIdx];
        const newSpecs = [...(opt.formInputs || [])];
        newSpecs[specIdx] = { ...newSpecs[specIdx], ...updates };
        updateOption(catIdx, optIdx, { formInputs: newSpecs });
    };

    const addFormInputSpec = (catIdx: number, optIdx: number) => {
        const opt = editingProduct.categories[catIdx].options[optIdx];
        updateOption(catIdx, optIdx, { formInputs: [...(opt.formInputs || []), { count: 1, label: '' }] });
    };

    const removeFormInputSpec = (catIdx: number, optIdx: number, specIdx: number) => {
        const opt = editingProduct.categories[catIdx].options[optIdx];
        const newSpecs = opt.formInputs!.filter((_, i) => i !== specIdx);
        if (newSpecs.length === 0) {
            const newCats = [...editingProduct.categories];
            const { formInputs, ...rest } = newCats[catIdx].options[optIdx];
            newCats[catIdx].options[optIdx] = rest as Option;
            setEditingProduct({ ...editingProduct, categories: newCats });
        } else {
            updateOption(catIdx, optIdx, { formInputs: newSpecs });
        }
    };

    const removeOption = (catIdx: number, optIdx: number) => {
        const newCats = [...editingProduct.categories];
        newCats[catIdx].options = newCats[catIdx].options.filter((_, i) => i !== optIdx);
        setEditingProduct({ ...editingProduct, categories: newCats });
    };

    const updateTier = (tierIdx: number, field: 'name' | 'price', value: string | number) => {
        const newTiers = [...editingProduct.tiers];
        newTiers[tierIdx] = { ...newTiers[tierIdx], [field]: value };
        setEditingProduct({ ...editingProduct, tiers: newTiers });
    };

    const updateTierSpec = (tierIdx: number, specIdx: number, updates: Partial<OptionFormInput>) => {
        const newTiers = [...editingProduct.tiers];
        const specs = [...(newTiers[tierIdx].includedSpecs || [])];
        specs[specIdx] = { ...specs[specIdx], ...updates };
        newTiers[tierIdx] = { ...newTiers[tierIdx], includedSpecs: specs };
        setEditingProduct({ ...editingProduct, tiers: newTiers });
    };

    const addTierSpec = (tierIdx: number) => {
        const newTiers = [...editingProduct.tiers];
        newTiers[tierIdx] = {
            ...newTiers[tierIdx],
            includedSpecs: [...(newTiers[tierIdx].includedSpecs || []), { count: 1, label: '' }]
        };
        setEditingProduct({ ...editingProduct, tiers: newTiers });
    };

    const removeTierSpec = (tierIdx: number, specIdx: number) => {
        const newTiers = [...editingProduct.tiers];
        const specs = newTiers[tierIdx].includedSpecs!.filter((_, i) => i !== specIdx);
        if (specs.length === 0) {
            const { includedSpecs: _removed, ...rest } = newTiers[tierIdx];
            newTiers[tierIdx] = rest;
        } else {
            newTiers[tierIdx] = { ...newTiers[tierIdx], includedSpecs: specs };
        }
        setEditingProduct({ ...editingProduct, tiers: newTiers });
    };

    // ─── Tier Modal Draft Helpers ─────────────────────────────────────────────
    const openTierModal = (tierIdx: number) => {
        setTierModalDraft(JSON.parse(JSON.stringify(editingProduct.tiers[tierIdx].includedSpecs || [])));
        setTierModalIdx(tierIdx);
    };

    const updateDraftSpec = (specIdx: number, updates: Partial<OptionFormInput>) => {
        setTierModalDraft(prev => {
            const next = [...prev];
            next[specIdx] = { ...next[specIdx], ...updates };
            return next;
        });
    };

    const addDraftSpec = () => setTierModalDraft(prev => [...prev, { count: 1, label: '' }]);

    const removeDraftSpec = (specIdx: number) =>
        setTierModalDraft(prev => prev.filter((_, i) => i !== specIdx));

    const saveTierModal = () => {
        if (tierModalIdx === null) return;
        const newTiers = [...editingProduct.tiers];

        // Apply draft to the current tier
        if (tierModalDraft.length > 0) {
            newTiers[tierModalIdx] = { ...newTiers[tierModalIdx], includedSpecs: tierModalDraft };
        } else {
            const { includedSpecs: _removed, ...rest } = newTiers[tierModalIdx];
            newTiers[tierModalIdx] = rest;
        }

        // Propagate NEW labels to higher tiers that already have specs
        if (tierModalDraft.length > 0) {
            for (let t = tierModalIdx + 1; t < newTiers.length; t++) {
                if (newTiers[t].includedSpecs?.length) {
                    const existingLabels = new Set(newTiers[t].includedSpecs!.map(s => s.label));
                    const toAdd = tierModalDraft.filter(s => s.label && !existingLabels.has(s.label));
                    if (toAdd.length > 0) {
                        newTiers[t] = {
                            ...newTiers[t],
                            includedSpecs: [...toAdd.map(s => ({ ...s })), ...newTiers[t].includedSpecs!]
                        };
                    }
                }
            }
        }

        setEditingProduct({ ...editingProduct, tiers: newTiers });
        setTierModalIdx(null);
        setTierModalDraft([]);
    };

    const cancelTierModal = () => {
        setTierModalIdx(null);
        setTierModalDraft([]);
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Sub-header */}
            <SubHeader title="עריכת מוצר" onBack={() => navigate('ADMIN_DASHBOARD')} backIcon="close" />

            <div className="p-6 space-y-8 pb-32 overflow-y-auto">
                {/* 1. Basic Info & Tiers */}
                <BaseCard variant="outlined" className="space-y-4 !p-6 !rounded-3xl">
                    <SectionHeader icon={<Settings size={20} />}>
                        הגדרת רמות מחיר (Tiers)
                    </SectionHeader>

                    <Input label="שם המוצר" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />

                    <div className="space-y-3 mt-4">
                        <label className="block text-body-sm font-medium text-secondary mr-1">רמות בסיס (לדוגמה: בייסיק, פלוס, אקסטרה)</label>
                        {editingProduct.tiers.map((tier, tierIdx) => (
                            <div key={tierIdx} className="flex gap-3 items-center">
                                <Input placeholder={`שם רמה ${tierIdx + 1}`} value={tier.name} onChange={e => updateTier(tierIdx, 'name', e.target.value)} className="bg-white" />
                                <div className="w-1/3">
                                    <Input type="number" placeholder="מחיר" value={tier.price} onChange={e => updateTier(tierIdx, 'price', Number(e.target.value))} className="bg-white" />
                                </div>
                                <div className="relative shrink-0">
                                    <button
                                        onClick={() => openTierModal(tierIdx)}
                                        className="p-2 rounded-xl transition-colors duration-base text-accent-muted hover:bg-accent-ghost"
                                        title="הגדרות שדות לרמה"
                                    >
                                        <Settings size={16} />
                                    </button>
                                    {!!tier.includedSpecs?.length && (
                                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent-soft pointer-events-none" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-accent-ghost p-4 rounded-2xl text-body-sm text-secondary leading-relaxed mt-4">
                        <strong>איך זה עובד?</strong><br />
                        כל האפשרויות הנבחרות ישפיעו על המחיר לפי רמת השיא (Max Tier). בנוסף, ניתן להגדיר שדות חובה לכל רמה (למשל: עוגת קומות חייבת בחירת 2 טעמים).
                    </div>

                    <TextArea label="תבנית הודעה" rows={3} value={editingProduct.messageTemplate} onChange={e => setEditingProduct({ ...editingProduct, messageTemplate: e.target.value })} className="mt-4" />
                </BaseCard>

                {/* 2. Categories & Options */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <SectionHeader size="lg">קטגוריות ואפשרויות</SectionHeader>
                    </div>

                    {editingProduct.categories.map((cat, catIdx) => (
                        <BaseCard key={cat.id} variant="outlined" className="relative !p-5 !rounded-3xl">
                            <IconButton
                                icon={<Trash2 size={18} />}
                                variant="danger"
                                size="sm"
                                onClick={() => removeCategory(catIdx)}
                                label="מחק קטגוריה"
                                className="absolute top-5 left-5"
                            />

                            <div className="mb-6 pl-10">
                                <Input
                                    placeholder="שם הקטגוריה"
                                    value={cat.name}
                                    onChange={e => updateCategory(catIdx, { name: e.target.value })}
                                    className="font-bold text-lg border-transparent focus:border-focus bg-transparent px-2"
                                />
                                <div className="flex gap-4 mt-2 mr-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={cat.type === 'radio'} onChange={() => updateCategory(catIdx, { type: 'radio' })} className="accent-[var(--color-primary)]" />
                                        <span className="text-body-sm">בחירה יחידה</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={cat.type === 'checkbox'} onChange={() => updateCategory(catIdx, { type: 'checkbox' })} className="accent-[var(--color-primary)]" />
                                        <span className="text-body-sm">בחירה מרובה</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {cat.options.map((opt, optIdx) => (
                                    <div key={opt.id} className="bg-accent-surface p-3 rounded-2xl border border-light/50">
                                        <div className="flex gap-2 items-center mb-2">
                                            <Input
                                                placeholder="שם האפשרות"
                                                value={opt.name}
                                                onChange={e => updateOption(catIdx, optIdx, { name: e.target.value })}
                                                className="h-10 text-body-sm bg-white"
                                            />
                                            <button onClick={() => removeOption(catIdx, optIdx)} className="text-accent-muted hover:text-danger-text p-2 transition-colors duration-base">
                                                <X size={16} />
                                            </button>
                                        </div>

                                        <div className="flex gap-2 items-center">
                                            <BaseSelect
                                                className="h-10 text-body-sm"
                                                value={opt.linkTier}
                                                onChange={e => updateOption(catIdx, optIdx, { linkTier: Number(e.target.value) })}
                                            >
                                                {editingProduct.tiers.map((t, idx) => (
                                                    <option key={idx} value={idx}>קשר ל-{t.name} ({t.price}₪)</option>
                                                ))}
                                                <option value={-1}>מחיר ידני...</option>
                                            </BaseSelect>

                                            {opt.linkTier === -1 && (
                                                <Input
                                                    type="number"
                                                    placeholder="מחיר"
                                                    className="w-24 h-10 text-body-sm bg-white"
                                                    value={opt.manualPrice || 0}
                                                    onChange={e => updateOption(catIdx, optIdx, { manualPrice: Number(e.target.value) })}
                                                />
                                            )}
                                        </div>

                                        {/* Dynamic Form Inputs Config */}
                                        <div className="mt-2 pt-2 border-t border-light/50">
                                            <label className="flex items-center gap-2 cursor-pointer text-caption text-secondary mb-2">
                                                <input
                                                    type="checkbox"
                                                    checked={!!opt.formInputs?.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            updateOption(catIdx, optIdx, { formInputs: [{ count: 1, label: '' }] });
                                                        } else {
                                                            if (opt.formInputs?.length && !window.confirm('האם אתה בטוח שברצונך למחוק את כל השדות שהוגדרו לאפשרות זו?')) return;
                                                            const newCats = [...editingProduct.categories];
                                                            const { formInputs, ...rest } = newCats[catIdx].options[optIdx];
                                                            newCats[catIdx].options[optIdx] = rest as Option;
                                                            setEditingProduct({ ...editingProduct, categories: newCats });
                                                        }
                                                    }}
                                                    className="accent-[var(--color-primary)] rounded"
                                                />
                                                דורש פירוט נוסף מהלקוח? (כמו טעמים/צבעים)
                                            </label>

                                            {opt.formInputs?.map((spec, specIdx) => {
                                                const sk = `${catIdx}-${optIdx}-${specIdx}`;
                                                const labelSuggestions = knownSuggestions.filter(s =>
                                                    spec.label && s.label.includes(spec.label) && s.label !== spec.label
                                                );
                                                const exactMatch = knownSuggestions.find(s => s.label === spec.label);
                                                return (
                                                    <div key={specIdx} className="mb-2 p-2 bg-white/60 rounded-xl border border-light/50 space-y-2">
                                                        {/* Row: label / count / delete */}
                                                        <div className="flex gap-2 items-end">
                                                            <div className="flex-1 relative">
                                                                <label className="text-micro text-muted block mb-1">תווית</label>
                                                                <Input
                                                                    value={spec.label}
                                                                    onChange={e => updateFormInputSpec(catIdx, optIdx, specIdx, { label: e.target.value })}
                                                                    onFocus={() => setSuggestKey(sk)}
                                                                    onBlur={() => setTimeout(() => setSuggestKey(null), 150)}
                                                                    className="h-8 text-xs bg-white"
                                                                    placeholder="לדוגמה: טעם"
                                                                />
                                                                {suggestKey === sk && labelSuggestions.length > 0 && (
                                                                    <div className="absolute top-full right-0 left-0 z-20 mt-1 bg-white border border-light rounded-xl shadow-card overflow-hidden">
                                                                        {labelSuggestions.map(s => (
                                                                            <button key={s.label} onMouseDown={e => { e.preventDefault(); updateFormInputSpec(catIdx, optIdx, specIdx, { label: s.label, choices: s.choices }); setSuggestKey(null); }} className="w-full text-right px-3 py-2 text-xs hover:bg-accent-ghost transition-colors flex justify-between items-center gap-2">
                                                                                <span className="text-muted truncate">{s.choices.slice(0, 3).join(', ')}{s.choices.length > 3 ? '...' : ''}</span>
                                                                                <span className="font-medium text-primary shrink-0">{s.label}</span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="w-16">
                                                                <label className="text-micro text-muted block mb-1">כמות</label>
                                                                <Input type="number" min={1} value={spec.count} onChange={e => updateFormInputSpec(catIdx, optIdx, specIdx, { count: Number(e.target.value) })} className="h-8 text-xs bg-white text-center" />
                                                            </div>
                                                            <button onClick={() => removeFormInputSpec(catIdx, optIdx, specIdx)} className="p-1.5 text-accent-muted hover:text-danger-text transition-colors">
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
                                                                    updateFormInputSpec(catIdx, optIdx, specIdx, { choices: parsed.length ? parsed : undefined });
                                                                    setChoicesRaw(prev => { const next = { ...prev }; delete next[`opt-choices-${sk}`]; return next; });
                                                                    setTimeout(() => setSuggestKey(null), 150);
                                                                }}
                                                                className="h-8 text-xs bg-white"
                                                                placeholder="לדוגמה: וניל, שוקולד, לימון"
                                                            />
                                                            {suggestKey === `choices-${sk}` && knownSuggestions.length > 0 && (
                                                                <div className="absolute top-full right-0 left-0 z-20 mt-1 bg-white border border-light rounded-xl shadow-card overflow-hidden">
                                                                    {(exactMatch ? [exactMatch] : knownSuggestions).map(s => (
                                                                        <button key={s.label} onMouseDown={e => { e.preventDefault(); updateFormInputSpec(catIdx, optIdx, specIdx, { choices: s.choices }); setSuggestKey(null); }} className="w-full text-right px-3 py-2 text-xs hover:bg-accent-ghost transition-colors flex justify-between items-center gap-2">
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
                                                <button onClick={() => addFormInputSpec(catIdx, optIdx)} className="text-caption text-accent font-bold flex items-center gap-1 mt-1 hover:bg-accent-ghost px-2 py-1 rounded-lg transition-colors duration-base">
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
                                                    const newCats = [...editingProduct.categories];
                                                    if (val) {
                                                        newCats[catIdx].options[optIdx] = { ...newCats[catIdx].options[optIdx], linkedProductId: val };
                                                    } else {
                                                        const { linkedProductId: _removed, ...rest } = newCats[catIdx].options[optIdx];
                                                        newCats[catIdx].options[optIdx] = rest as Option;
                                                    }
                                                    setEditingProduct({ ...editingProduct, categories: newCats });
                                                }}
                                            >
                                                <option value="">ללא קישור</option>
                                                {data.products
                                                    .filter(p => p.id !== editingProduct.id)
                                                    .map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))
                                                }
                                            </BaseSelect>
                                            {opt.linkedProductId && (
                                                <p className="text-micro text-accent mt-1">✓ בחירת אפשרות זו תפתח מחשבון נפרד למוצר המקושר</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => addOption(catIdx)}
                                    className="w-full py-3 border border-dashed border-default rounded-xl text-accent-soft font-medium hover:bg-accent-ghost transition-all duration-base flex items-center justify-center gap-2 text-body-sm mt-2"
                                >
                                    <Plus size={16} />
                                    הוסף אפשרות
                                </button>
                            </div>
                        </BaseCard>
                    ))}

                    <Button variant="secondary" fullWidth onClick={addCategory} className="border-dashed border-2 bg-transparent">
                        <Plus size={20} className="ml-2" />
                        הוסף קטגוריה חדשה
                    </Button>
                </section>
            </div>

            {/* Tier Spec Modal */}
            {tierModalIdx !== null && (() => {
                const tier = editingProduct.tiers[tierModalIdx];
                if (!tier) return null;
                // Build a map: label → source tier name (for inherited badge display)
                const inheritedFrom = new Map<string, string>();
                for (let t = 0; t < tierModalIdx; t++) {
                    editingProduct.tiers[t].includedSpecs?.forEach(s => {
                        if (!inheritedFrom.has(s.label)) {
                            inheritedFrom.set(s.label, editingProduct.tiers[t].name);
                        }
                    });
                }
                return (
                    <div className="fixed inset-0 z-50 flex items-end justify-center">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={cancelTierModal} />
                        <div className="relative w-full max-w-lg bg-[var(--bg-app)] rounded-t-3xl shadow-xl max-h-[80vh] flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-subtle shrink-0">
                                <h3 className="font-heading font-bold text-primary text-lg">{tier.name} — שדות פירוט</h3>
                                <button onClick={cancelTierModal} className="p-2 rounded-xl text-muted hover:bg-accent-ghost transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            {/* Body */}
                            <div className="overflow-y-auto p-6 space-y-3 flex-1">
                                <p className="text-caption text-secondary bg-accent-ghost p-3 rounded-xl leading-relaxed">
                                    רשימה זו היא הרשימה המלאה של שדות שיופיעו בטופס כשרמה זו היא הגבוהה ביותר. שדות מרמות קודמות מועתקים אוטומטית בעת ההפעלה ומסומנים — ניתן לערוך את כמותם ישירות.
                                </p>
                                <label className="flex items-center gap-2 cursor-pointer text-caption text-secondary">
                                    <input
                                        type="checkbox"
                                        checked={!!tierModalDraft.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                const inherited: OptionFormInput[] = [];
                                                for (let t = 0; t < tierModalIdx; t++) {
                                                    editingProduct.tiers[t].includedSpecs?.forEach(s => {
                                                        if (!inherited.find(x => x.label === s.label)) {
                                                            inherited.push({ ...s });
                                                        }
                                                    });
                                                }
                                                setTierModalDraft(inherited.length > 0 ? inherited : [{ count: 1, label: '' }]);
                                            } else {
                                                if (tierModalDraft.length && !window.confirm('האם אתה בטוח שברצונך למחוק את כל השדות שהוגדרו לרמה זו?')) return;
                                                setTierModalDraft([]);
                                            }
                                        }}
                                        className="accent-[var(--color-primary)] rounded"
                                    />
                                    <List size={13} />
                                    פירוט נוסף לרמה זו
                                </label>

                                {tierModalDraft.map((spec, specIdx) => {
                                    const sk = `tier-${tierModalIdx}-${specIdx}`;
                                    const rawKey = `tier-${tierModalIdx}-${specIdx}-choices`;
                                    const labelSuggestions = knownSuggestions.filter(s =>
                                        spec.label && s.label.includes(spec.label) && s.label !== spec.label
                                    );
                                    const exactMatch = knownSuggestions.find(s => s.label === spec.label);
                                    const inheritedTierName = inheritedFrom.get(spec.label);
                                    return (
                                        <div key={specIdx} className={`p-3 rounded-2xl border space-y-2 ${inheritedTierName ? 'bg-accent-ghost/40 border-accent-ghost' : 'bg-white border-light'}`}>
                                            {inheritedTierName && (
                                                <span className="inline-flex items-center gap-1 text-micro text-accent bg-white px-2 py-0.5 rounded-full border border-light">
                                                    <List size={10} />
                                                    מרמה: {inheritedTierName}
                                                </span>
                                            )}
                                            <div className="flex gap-2 items-end">
                                                <div className="flex-1 relative">
                                                    <label className="text-micro text-muted block mb-1">תווית</label>
                                                    <Input
                                                        value={spec.label}
                                                        onChange={e => updateDraftSpec(specIdx, { label: e.target.value })}
                                                        onFocus={() => setSuggestKey(sk)}
                                                        onBlur={() => setTimeout(() => setSuggestKey(null), 150)}
                                                        className="h-9 text-body-sm bg-accent-ghost"
                                                        placeholder="לדוגמה: טעם"
                                                    />
                                                    {suggestKey === sk && labelSuggestions.length > 0 && (
                                                        <div className="absolute top-full right-0 left-0 z-20 mt-1 bg-white border border-light rounded-xl shadow-card overflow-hidden">
                                                            {labelSuggestions.map(s => (
                                                                <button key={s.label} onMouseDown={e => { e.preventDefault(); updateDraftSpec(specIdx, { label: s.label, choices: s.choices }); setSuggestKey(null); }} className="w-full text-right px-3 py-2 text-xs hover:bg-accent-ghost transition-colors flex justify-between items-center gap-2">
                                                                    <span className="text-muted truncate">{s.choices.slice(0, 3).join(', ')}{s.choices.length > 3 ? '...' : ''}</span>
                                                                    <span className="font-medium text-primary shrink-0">{s.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="w-20">
                                                    <label className="text-micro text-muted block mb-1">כמות</label>
                                                    <Input type="number" min={1} value={spec.count} onChange={e => updateDraftSpec(specIdx, { count: Number(e.target.value) })} className="h-9 text-body-sm bg-accent-ghost text-center" />
                                                </div>
                                                <button onClick={() => removeDraftSpec(specIdx)} className="p-2 text-accent-muted hover:text-danger-text transition-colors">
                                                    <X size={15} />
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <label className="text-micro text-muted block mb-1">אפשרויות לבחירה (מופרדות בפסיק) — ריק = שדה חופשי</label>
                                                <Input
                                                    value={rawKey in choicesRaw ? choicesRaw[rawKey] : (spec.choices?.join(', ') || '')}
                                                    onChange={e => setChoicesRaw(prev => ({ ...prev, [rawKey]: e.target.value }))}
                                                    onFocus={() => {
                                                        setChoicesRaw(prev => ({ ...prev, [rawKey]: spec.choices?.join(', ') || '' }));
                                                        setSuggestKey(`choices-${sk}`);
                                                    }}
                                                    onBlur={() => {
                                                        const raw = choicesRaw[rawKey] ?? '';
                                                        const parsed = raw.split(',').map(s => s.trim()).filter(Boolean);
                                                        updateDraftSpec(specIdx, { choices: parsed.length ? parsed : undefined });
                                                        setChoicesRaw(prev => { const next = { ...prev }; delete next[rawKey]; return next; });
                                                        setTimeout(() => setSuggestKey(null), 150);
                                                    }}
                                                    className="h-9 text-body-sm bg-accent-ghost"
                                                    placeholder="לדוגמה: וניל, שוקולד, לימון"
                                                />
                                                {suggestKey === `choices-${sk}` && knownSuggestions.length > 0 && (
                                                    <div className="absolute top-full right-0 left-0 z-20 mt-1 bg-white border border-light rounded-xl shadow-card overflow-hidden">
                                                        {(exactMatch ? [exactMatch] : knownSuggestions).map(s => (
                                                            <button key={s.label} onMouseDown={e => { e.preventDefault(); updateDraftSpec(specIdx, { choices: s.choices }); setSuggestKey(null); }} className="w-full text-right px-3 py-2 text-xs hover:bg-accent-ghost transition-colors flex justify-between items-center gap-2">
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

                                {tierModalDraft.length > 0 && (
                                    <button onClick={addDraftSpec} className="text-caption text-accent font-bold flex items-center gap-1 hover:bg-accent-ghost px-3 py-2 rounded-lg transition-colors duration-base">
                                        <Plus size={13} />
                                        הוסף שדה לרמה
                                    </button>
                                )}
                            </div>
                            {/* Footer */}
                            <div className="px-6 pb-6 pt-3 border-t border-subtle shrink-0 flex gap-3">
                                <Button fullWidth variant="secondary" onClick={cancelTierModal}>
                                    בטל
                                </Button>
                                <Button fullWidth onClick={saveTierModal}>
                                    <Check size={16} className="ml-1" />
                                    שמור
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Sticky Footer */}
            <StickyFooter>
                <Button fullWidth size="lg" onClick={saveProduct} disabled={!editingProduct.name}>
                    <Check className="ml-2" />
                    שמור שינויים
                </Button>
            </StickyFooter>
        </div>
    );
};
