import React from 'react';
import { X, Settings, Plus, Trash2, List, Check } from 'lucide-react';
import { Category, Option } from '../types';
import { AppState } from '../hooks/useAppState';
import { Button } from '../components/Button';
import { Input, TextArea } from '../components/Input';
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
        <div className="min-h-screen bg-rose-50/50 flex flex-col">
            {/* Sub-header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur z-20 p-4 border-b border-rose-100 flex items-center justify-between shadow-sm">
                <button onClick={() => setView('ADMIN_DASHBOARD')} className="p-2 -mr-2 text-coffee-800 hover:bg-rose-50 rounded-full">
                    <X />
                </button>
                <h2 className="font-heading font-bold text-lg text-coffee-800">עריכת מוצר</h2>
            </div>

            <div className="p-6 space-y-8 pb-32 overflow-y-auto">
                {/* 1. Basic Info & Tiers */}
                <section className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-rose-50">
                    <h3 className="font-heading font-bold text-coffee-800 flex items-center gap-2 mb-4">
                        <Settings size={20} className="text-rose-400" />
                        הגדרת רמות מחיר (Tiers)
                    </h3>

                    <Input label="שם המוצר" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />

                    <div className="space-y-3 mt-4">
                        <label className="block text-sm font-medium text-coffee-800/80 mr-1">רמות בסיס (לדוגמה: בייסיק, פלוס, אקסטרה)</label>
                        {editingProduct.tiers.map((tier, idx) => (
                            <div key={idx} className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                                <div className="flex gap-3 mb-2">
                                    <Input placeholder={`שם רמה ${idx + 1}`} value={tier.name} onChange={e => updateTier(idx, 'name', e.target.value)} className="bg-white" />
                                    <div className="w-1/3">
                                        <Input type="number" placeholder="מחיר" value={tier.price} onChange={e => updateTier(idx, 'price', Number(e.target.value))} className="bg-white" />
                                    </div>
                                </div>

                                {/* Included Specs Management */}
                                <details className="group">
                                    <summary className="cursor-pointer text-xs font-medium text-rose-400 flex items-center gap-1 select-none mb-2">
                                        <List size={14} />
                                        {tier.includedSpecs?.length ? `ניהול שדות (${tier.includedSpecs.length})` : 'הוסף שדות מיוחדים (כמו טעמים/צבעים)'}
                                    </summary>

                                    <div className="pl-4 space-y-2 mt-2 border-r-2 border-rose-100 pr-2">
                                        {tier.includedSpecs?.map((spec, sIdx) => (
                                            <div key={sIdx} className="flex gap-2 items-end">
                                                <div className="flex-1">
                                                    <label className="text-[10px] text-gray-500">תווית</label>
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
                                                    <label className="text-[10px] text-gray-500">כמות</label>
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
                                                    className="p-2 text-rose-300 hover:text-red-500"
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
                                            className="text-xs text-rose-500 font-bold flex items-center gap-1 mt-2 hover:bg-rose-50 p-1 rounded-lg transition-colors"
                                        >
                                            <Plus size={12} />
                                            הוסף שדה
                                        </button>
                                    </div>
                                </details>
                            </div>
                        ))}
                    </div>

                    <div className="bg-rose-50 p-4 rounded-2xl text-sm text-coffee-800/80 leading-relaxed mt-4">
                        <strong>איך זה עובד?</strong><br />
                        כל האפשרויות הנבחרות ישפיעו על המחיר לפי רמת השיא (Max Tier). בנוסף, ניתן להגדיר שדות חובה לכל רמה (למשל: עוגת קומות חייבת בחירת 2 טעמים).
                    </div>

                    <TextArea label="תבנית הודעה" rows={3} value={editingProduct.messageTemplate} onChange={e => setEditingProduct({ ...editingProduct, messageTemplate: e.target.value })} className="mt-4" />
                </section>

                {/* 2. Categories & Options */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="font-heading font-bold text-lg text-coffee-800">קטגוריות ואפשרויות</h3>
                    </div>

                    {editingProduct.categories.map((cat, catIdx) => (
                        <div key={cat.id} className="bg-white p-5 rounded-3xl shadow-sm border border-rose-50 relative">
                            <button onClick={() => removeCategory(catIdx)} className="absolute top-5 left-5 text-rose-200 hover:text-red-400 transition-colors">
                                <Trash2 size={18} />
                            </button>

                            <div className="mb-6 pl-10">
                                <Input
                                    placeholder="שם הקטגוריה"
                                    value={cat.name}
                                    onChange={e => updateCategory(catIdx, { name: e.target.value })}
                                    className="font-bold text-lg border-transparent focus:border-rose-200 bg-transparent px-2"
                                />
                                <div className="flex gap-4 mt-2 mr-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={cat.type === 'radio'} onChange={() => updateCategory(catIdx, { type: 'radio' })} className="accent-rose-500" />
                                        <span className="text-sm">בחירה יחידה</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={cat.type === 'checkbox'} onChange={() => updateCategory(catIdx, { type: 'checkbox' })} className="accent-rose-500" />
                                        <span className="text-sm">בחירה מרובה</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {cat.options.map((opt, optIdx) => (
                                    <div key={opt.id} className="bg-cream p-3 rounded-2xl border border-rose-100/50">
                                        <div className="flex gap-2 items-center mb-2">
                                            <Input
                                                placeholder="שם האפשרות"
                                                value={opt.name}
                                                onChange={e => updateOption(catIdx, optIdx, { name: e.target.value })}
                                                className="h-10 text-sm bg-white"
                                            />
                                            <button onClick={() => removeOption(catIdx, optIdx)} className="text-rose-300 hover:text-red-400 p-2">
                                                <X size={16} />
                                            </button>
                                        </div>

                                        <div className="flex gap-2 items-center">
                                            <select
                                                className="w-full h-10 px-3 rounded-xl border border-rose-100 bg-white text-sm focus:outline-none focus:border-rose-300"
                                                value={opt.linkTier}
                                                onChange={e => updateOption(catIdx, optIdx, { linkTier: Number(e.target.value) })}
                                            >
                                                {editingProduct.tiers.map((t, idx) => (
                                                    <option key={idx} value={idx}>קשר ל-{t.name} ({t.price}₪)</option>
                                                ))}
                                                <option value={-1}>מחיר ידני...</option>
                                            </select>

                                            {opt.linkTier === -1 && (
                                                <Input
                                                    type="number"
                                                    placeholder="מחיר"
                                                    className="w-24 h-10 text-sm bg-white"
                                                    value={opt.manualPrice || 0}
                                                    onChange={e => updateOption(catIdx, optIdx, { manualPrice: Number(e.target.value) })}
                                                />
                                            )}
                                        </div>

                                        {/* Dynamic Form Inputs Config */}
                                        <div className="mt-2 pt-2 border-t border-rose-100/50">
                                            <label className="flex items-center gap-2 cursor-pointer text-xs text-coffee-800/80 mb-2">
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
                                                    className="accent-rose-500 rounded"
                                                />
                                                דורש פירוט נוסף מהלקוח? (כמו טעמים/צבעים)
                                            </label>

                                            {opt.formInputs && (
                                                <div className="flex gap-2 items-end animate-in fade-in slide-in-from-top-1">
                                                    <div className="flex-1">
                                                        <label className="text-[10px] text-coffee-800/60 block mb-1">תווית השדה</label>
                                                        <Input
                                                            value={opt.formInputs.label}
                                                            onChange={e => updateOption(catIdx, optIdx, { formInputs: { ...opt.formInputs!, label: e.target.value } })}
                                                            className="h-8 text-xs bg-white"
                                                            placeholder="לדוגמה: טעם"
                                                        />
                                                    </div>
                                                    <div className="w-20">
                                                        <label className="text-[10px] text-coffee-800/60 block mb-1">כמות</label>
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
                                    className="w-full py-3 border border-dashed border-rose-200 rounded-xl text-rose-400 font-medium hover:bg-rose-50 transition-all flex items-center justify-center gap-2 text-sm mt-2"
                                >
                                    <Plus size={16} />
                                    הוסף אפשרות
                                </button>
                            </div>
                        </div>
                    ))}

                    <Button variant="secondary" fullWidth onClick={addCategory} className="border-dashed border-2 bg-transparent">
                        <Plus size={20} className="ml-2" />
                        הוסף קטגוריה חדשה
                    </Button>
                </section>
            </div>
            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-rose-100 z-30 pb-safe">
                <div className="max-w-2xl mx-auto">
                    <Button fullWidth onClick={saveProduct} className="h-14 text-lg shadow-xl shadow-rose-400/20" disabled={!editingProduct.name}>
                        <Check className="ml-2" />
                        שמור שינויים
                    </Button>
                </div>
            </div>
        </div>
    );
};
