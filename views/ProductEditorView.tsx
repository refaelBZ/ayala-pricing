import React from 'react';
import { X, Settings, Plus, Trash2, List, Check } from 'lucide-react';
import { Category, Option } from '../types';
import { AppState } from '../hooks/useAppState';
import { Button } from '../components/Button';
import { Input, TextArea, BaseSelect } from '../components/Input';
import { SubHeader } from '../components/SubHeader';
import { StickyFooter } from '../components/StickyFooter';
import { SectionHeader } from '../components/SectionHeader';
import { BaseCard } from '../components/BaseCard';
import { IconButton } from '../components/IconButton';
import { saveProductToFirestore, generateUUID } from '../services/storage';

type Props = Pick<AppState, 'editingProduct' | 'setEditingProduct' | 'setView' | 'setLoading' | 'loadData' | 'showToast'>;

export const ProductEditorView: React.FC<Props> = ({ editingProduct, setEditingProduct, setView, setLoading, loadData, showToast }) => {
    if (!editingProduct) return null;

    const saveProduct = async () => {
        if (!editingProduct.name) { showToast('נא להזין שם מוצר'); return; }
        setLoading(true);
        await saveProductToFirestore(editingProduct);
        await loadData();
        setLoading(false);
        setView('ADMIN_DASHBOARD');
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

    return (
        <div className="min-h-screen flex flex-col">
            {/* Sub-header */}
            <SubHeader title="עריכת מוצר" onBack={() => setView('ADMIN_DASHBOARD')} backIcon="close" />

            <div className="p-6 space-y-8 pb-32 overflow-y-auto">
                {/* 1. Basic Info & Tiers */}
                <BaseCard variant="outlined" className="space-y-4 !p-6 !rounded-3xl">
                    <SectionHeader icon={<Settings size={20} />}>
                        הגדרת רמות מחיר (Tiers)
                    </SectionHeader>

                    <Input label="שם המוצר" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />

                    <div className="space-y-3 mt-4">
                        <label className="block text-body-sm font-medium text-secondary mr-1">רמות בסיס (לדוגמה: בייסיק, פלוס, אקסטרה)</label>
                        {editingProduct.tiers.map((tier, idx) => (
                            <div key={idx} className="bg-neutral-bg p-3 rounded-2xl border border-neutral-border">
                                <div className="flex gap-3 mb-2">
                                    <Input placeholder={`שם רמה ${idx + 1}`} value={tier.name} onChange={e => updateTier(idx, 'name', e.target.value)} className="bg-white" />
                                    <div className="w-1/3">
                                        <Input type="number" placeholder="מחיר" value={tier.price} onChange={e => updateTier(idx, 'price', Number(e.target.value))} className="bg-white" />
                                    </div>
                                </div>

                                {/* Included Specs Management */}
                                <details className="group">
                                    <summary className="cursor-pointer text-caption font-medium text-accent-soft flex items-center gap-1 select-none mb-2">
                                        <List size={14} />
                                        {tier.includedSpecs?.length ? `ניהול שדות (${tier.includedSpecs.length})` : 'הוסף שדות מיוחדים (כמו טעמים/צבעים)'}
                                    </summary>

                                    <div className="pl-4 space-y-2 mt-2 border-r-2 border-light pr-2">
                                        {tier.includedSpecs?.map((spec, sIdx) => (
                                            <div key={sIdx} className="flex gap-2 items-end">
                                                <div className="flex-1">
                                                    <label className="text-micro text-muted">תווית</label>
                                                    <Input
                                                        value={spec.label}
                                                        onChange={e => {
                                                            const newTiers = [...editingProduct.tiers];
                                                            if (newTiers[idx].includedSpecs) {
                                                                newTiers[idx].includedSpecs![sIdx].label = e.target.value;
                                                                setEditingProduct({ ...editingProduct, tiers: newTiers });
                                                            }
                                                        }}
                                                        className="h-8 text-xs bg-white"
                                                        placeholder="לדוגמה: טעם"
                                                    />
                                                </div>
                                                <div className="w-20">
                                                    <label className="text-micro text-muted">כמות</label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={spec.count}
                                                        onChange={e => {
                                                            const newTiers = [...editingProduct.tiers];
                                                            if (newTiers[idx].includedSpecs) {
                                                                newTiers[idx].includedSpecs![sIdx].count = Number(e.target.value);
                                                                setEditingProduct({ ...editingProduct, tiers: newTiers });
                                                            }
                                                        }}
                                                        className="h-8 text-xs bg-white text-center"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const newTiers = [...editingProduct.tiers];
                                                        newTiers[idx].includedSpecs = newTiers[idx].includedSpecs?.filter((_, i) => i !== sIdx);
                                                        setEditingProduct({ ...editingProduct, tiers: newTiers });
                                                    }}
                                                    className="p-2 text-accent-muted hover:text-danger-text transition-colors duration-base"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => {
                                                const newTiers = [...editingProduct.tiers];
                                                if (!newTiers[idx].includedSpecs) newTiers[idx].includedSpecs = [];
                                                newTiers[idx].includedSpecs!.push({ label: '', count: 1, type: 'text' });
                                                setEditingProduct({ ...editingProduct, tiers: newTiers });
                                            }}
                                            className="text-caption text-accent font-bold flex items-center gap-1 mt-2 hover:bg-accent-ghost p-1 rounded-lg transition-colors duration-base"
                                        >
                                            <Plus size={12} />
                                            הוסף שדה
                                        </button>
                                    </div>
                                </details>
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
                                                    checked={!!opt.formInputs}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            updateOption(catIdx, optIdx, { formInputs: { count: 1, label: 'טעם/צבע', type: 'text' } });
                                                        } else {
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

                                            {opt.formInputs && (
                                                <div className="flex gap-2 items-end">
                                                    <div className="flex-1">
                                                        <label className="text-micro text-muted block mb-1">תווית השדה</label>
                                                        <Input
                                                            value={opt.formInputs.label}
                                                            onChange={e => updateOption(catIdx, optIdx, { formInputs: { ...opt.formInputs!, label: e.target.value } })}
                                                            className="h-8 text-xs bg-white"
                                                            placeholder="לדוגמה: טעם"
                                                        />
                                                    </div>
                                                    <div className="w-20">
                                                        <label className="text-micro text-muted block mb-1">כמות</label>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            value={opt.formInputs.count}
                                                            onChange={e => updateOption(catIdx, optIdx, { formInputs: { ...opt.formInputs!, count: Number(e.target.value) } })}
                                                            className="h-8 text-xs bg-white text-center"
                                                        />
                                                    </div>
                                                </div>
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
