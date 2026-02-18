import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit2, 
  ChevronRight, 
  Copy, 
  Check, 
  ArrowLeft,
  Settings,
  X,
  Sparkles,
  Loader2
} from 'lucide-react';
import { AppData, Product, Category, Option, ViewState } from './types';
import { fetchProducts, saveProductToFirestore, deleteProductFromFirestore, generateUUID } from './services/storage';
import { Button } from './components/Button';
import { Input, TextArea } from './components/Input';

// --- Sub-Components ---

const Toast: React.FC<{ message: string; show: boolean }> = ({ message, show }) => {
  if (!show) return null;
  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-coffee-800 text-cream px-6 py-3 rounded-full shadow-2xl z-50 animate-bounce text-center whitespace-nowrap border border-white/10">
      <span className="flex items-center gap-2">
        <Check size={16} className="text-rose-300" />
        {message}
      </span>
    </div>
  );
};

const LoadingOverlay: React.FC = () => (
  <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-rose-100 flex flex-col items-center">
      <Loader2 className="animate-spin text-rose-400 mb-2" size={32} />
      <span className="text-coffee-800 font-medium">טוען נתונים...</span>
    </div>
  </div>
);

// --- Main App Component ---

const App: React.FC = () => {
  const [data, setData] = useState<AppData>({ products: [] });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>('HOME');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  
  // Calculator State
  const [selections, setSelections] = useState<Record<string, string | string[]>>({}); 

  // Editor State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    const products = await fetchProducts();
    setData({ products });
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // --- Views ---

  const renderHome = () => (
    <div className="min-h-screen pb-24 px-6 flex flex-col bg-gradient-to-b from-rose-50 to-white">
      <header className="mb-10 text-center mt-8">
        <div className="w-16 h-16 bg-white rounded-full mx-auto mb-4 shadow-soft flex items-center justify-center text-rose-400">
           <Sparkles size={28} />
        </div>
        <h1 className="text-3xl font-heading font-bold text-coffee-800 mb-1">Ayala Cakes</h1>
        <p className="text-rose-400/80 font-medium tracking-wide text-sm">SWEET CAKES PATISSERIE</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-10">
           <Loader2 className="animate-spin text-rose-300" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {data.products.map(product => (
            <button
              key={product.id}
              onClick={() => {
                setSelectedProductId(product.id);
                // Default selections: First option of each radio category
                const initialSelections: Record<string, string> = {};
                product.categories.forEach(cat => {
                  if (cat.type === 'radio' && cat.options.length > 0) {
                    initialSelections[cat.id] = cat.options[0].id;
                  }
                });
                setSelections(initialSelections);
                setView('CALCULATOR');
              }}
              className="group relative bg-white rounded-3xl p-6 shadow-soft hover:shadow-xl transition-all duration-300 text-right overflow-hidden border border-white"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-xl mb-2 text-coffee-800">{product.name}</h3>
                  <div className="flex gap-2 text-sm text-coffee-800/50">
                    <span>{product.tiers.length} רמות מחיר</span>
                    <span>•</span>
                    <span>החל מ-₪{product.tiers[0]?.price || 0}</span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-rose-400 group-hover:bg-rose-400 group-hover:text-white transition-colors">
                  <ChevronRight size={20} className="rotate-180" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <button 
        onClick={() => setView('ADMIN_LOGIN')}
        className="fixed bottom-6 right-6 w-12 h-12 bg-white rounded-full shadow-lg text-rose-300 flex items-center justify-center hover:text-rose-500 transition-colors z-30"
      >
        <Lock size={18} />
      </button>
    </div>
  );

  const renderCalculator = () => {
    const product = data.products.find(p => p.id === selectedProductId);
    if (!product) return null;

    // --- Dynamic Tier Linking Logic ---
    let total = 0;
    const resolvedPrices: number[] = [];
    const detailsList: string[] = [];

    // Collect all selected options
    product.categories.forEach(cat => {
      const selectionId = selections[cat.id];
      if (!selectionId) return;

      const idsToCheck = Array.isArray(selectionId) ? selectionId : [selectionId];

      idsToCheck.forEach(id => {
        const opt = cat.options.find(o => o.id === id);
        if (opt) {
          
          let price = 0;
          if (opt.linkTier === -1) {
            // Manual price
            price = opt.manualPrice || 0;
          } else if (opt.linkTier >= 0 && opt.linkTier < product.tiers.length) {
            // Linked to tier
            price = product.tiers[opt.linkTier].price;
          }

          resolvedPrices.push(price);
          detailsList.push(opt.name); // Just name for copy
        }
      });
    });

    // "Final Price = The highest single value found among all selections"
    total = resolvedPrices.length > 0 ? Math.max(...resolvedPrices) : 0;

    // Copy Handler
    const handleCopy = () => {
      let text = product.messageTemplate;
      text = text.replace('{details}', detailsList.join('\n'));
      text = text.replace('{price}', total.toString());
      
      navigator.clipboard.writeText(text).then(() => {
        showToast('הועתק ללוח!');
      });
    };

    return (
      <div className="min-h-screen bg-rose-50/50 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-20 px-4 py-4 border-b border-rose-100 flex items-center justify-between shadow-sm">
            <button onClick={() => setView('HOME')} className="p-2 -mr-2 text-coffee-800/60 hover:text-coffee-800 hover:bg-rose-50 rounded-full transition-colors">
                <ArrowLeft />
            </button>
            <h2 className="font-heading font-bold text-lg text-coffee-800">{product.name}</h2>
            <div className="w-8"></div>
        </div>

        {/* Content */}
        <div className="p-6 pb-40 space-y-8 overflow-y-auto">
           {product.categories.map(cat => (
             <div key={cat.id} className="space-y-4">
               <h3 className="font-heading font-bold text-coffee-800 px-1 text-lg flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                 {cat.name}
               </h3>
               
               {cat.type === 'radio' ? (
                 <div className="flex flex-col gap-3">
                   {cat.options.map(opt => {
                     const isSelected = selections[cat.id] === opt.id;
                     return (
                       <button
                         key={opt.id}
                         onClick={() => setSelections(prev => ({ ...prev, [cat.id]: opt.id }))}
                         className={`relative p-4 rounded-2xl text-right transition-all duration-200 flex items-center justify-between group ${
                           isSelected 
                             ? 'bg-white shadow-md ring-2 ring-rose-300' 
                             : 'bg-white/60 hover:bg-white shadow-sm ring-1 ring-transparent hover:ring-rose-100'
                         }`}
                       >
                         <span className={`font-medium text-lg ${isSelected ? 'text-coffee-800' : 'text-coffee-800/70'}`}>
                           {opt.name}
                         </span>
                         
                         {/* Visual Indicator */}
                         <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                           isSelected ? 'border-rose-400 bg-rose-400' : 'border-rose-200 bg-transparent'
                         }`}>
                           {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                         </div>
                       </button>
                     );
                   })}
                 </div>
               ) : (
                 <div className="flex flex-col gap-3">
                    {cat.options.map(opt => {
                      const currentSelected = (selections[cat.id] as string[]) || [];
                      const isSelected = currentSelected.includes(opt.id);
                      return (
                        <div 
                          key={opt.id} 
                          onClick={() => {
                            const newSelection = isSelected 
                              ? currentSelected.filter(id => id !== opt.id)
                              : [...currentSelected, opt.id];
                            setSelections(prev => ({ ...prev, [cat.id]: newSelection }));
                          }}
                          className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-200 flex items-center justify-between ${
                             isSelected 
                               ? 'bg-white shadow-md ring-2 ring-rose-300' 
                               : 'bg-white/60 hover:bg-white shadow-sm'
                           }`}
                        >
                           <span className={`font-medium ${isSelected ? 'text-coffee-800' : 'text-coffee-800/70'}`}>
                             {opt.name}
                           </span>
                           <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                isSelected ? 'bg-rose-400 border-rose-400' : 'border-rose-200'
                              }`}>
                                {isSelected && <Check size={14} className="text-white" />}
                           </div>
                        </div>
                      );
                    })}
                 </div>
               )}
             </div>
           ))}
        </div>

        {/* Sticky Footer */}
        <div className="fixed bottom-6 left-4 right-4 z-30">
            <div className="glass-panel rounded-3xl p-2 pl-3 shadow-soft flex items-center gap-4">
                <div className="flex-1 pr-4">
                    <span className="text-xs text-coffee-800/60 font-medium block">סה"כ לתשלום</span>
                    <span className="text-3xl font-heading font-bold text-coffee-800 tracking-tight leading-none">₪{total}</span>
                </div>
                <Button variant="primary" onClick={handleCopy} className="px-8 h-14 rounded-2xl text-lg font-bold tracking-wide shadow-rose-400/30">
                    <Copy className="ml-2" size={18} />
                    העתק
                </Button>
            </div>
        </div>
      </div>
    );
  };

  const renderAdminLogin = () => (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-rose-50 to-cream">
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-soft w-full max-w-sm text-center border border-white">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
            <Lock size={28} />
        </div>
        <h2 className="text-2xl font-heading font-bold mb-2 text-coffee-800">כניסה למנהלים</h2>
        
        <Input 
          type="password" 
          placeholder="קוד גישה" 
          className="text-center text-lg mb-6 tracking-widest bg-white"
          value={adminPasswordInput}
          onChange={(e) => setAdminPasswordInput(e.target.value)}
        />
        
        <div className="flex gap-3">
           <Button variant="ghost" fullWidth onClick={() => setView('HOME')}>ביטול</Button>
           <Button 
             fullWidth 
             onClick={() => {
               if (adminPasswordInput === import.meta.env.VITE_ADMIN_PASSWORD) {
                 setAdminPasswordInput('');
                 setView('ADMIN_DASHBOARD');
               } else {
                 showToast('סיסמה שגויה');
               }
             }}
           >
             כניסה
           </Button>
        </div>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="min-h-screen p-6 pb-24 bg-rose-50/50">
       <header className="flex items-center justify-between mb-8 mt-2">
          <div>
            <h1 className="text-2xl font-heading font-bold text-coffee-800">ניהול מוצרים</h1>
            <p className="text-sm text-coffee-800/60">Ayala Cakes Admin</p>
          </div>
          <button onClick={() => setView('HOME')} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-rose-300 hover:text-rose-500 shadow-sm">
            <LogOut size={20} />
          </button>
       </header>

       <div className="space-y-4">
          {data.products.map(product => (
            <div key={product.id} className="bg-white p-5 rounded-3xl shadow-sm flex items-center justify-between border border-rose-100/50">
               <div>
                 <h3 className="font-bold text-lg text-coffee-800">{product.name}</h3>
                 <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-rose-50 text-rose-500 px-2 py-1 rounded-lg font-medium border border-rose-100">
                        {product.tiers.length} רמות מחיר
                    </span>
                 </div>
               </div>
               <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingProduct(JSON.parse(JSON.stringify(product))); 
                      setView('PRODUCT_EDITOR');
                    }}
                    className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={async () => {
                      if(window.confirm('למחוק את המוצר?')) {
                        setLoading(true);
                        await deleteProductFromFirestore(product.id);
                        await loadData();
                        setLoading(false);
                      }
                    }}
                    className="p-3 bg-white text-rose-300 border border-rose-100 rounded-2xl hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
               </div>
            </div>
          ))}
       </div>

       <div className="fixed bottom-8 left-6 right-6">
          <Button 
            fullWidth 
            className="shadow-xl h-14 text-lg rounded-2xl shadow-rose-300/40"
            onClick={() => {
              setEditingProduct({
                id: generateUUID(),
                name: '',
                tiers: [
                    { name: 'Basic', price: 0 },
                    { name: 'Plus', price: 0 },
                    { name: 'Extra', price: 0 }
                ],
                messageTemplate: "היי! הצעת מחיר עבור {product}:\n{details}\nסה\"כ: {price} ₪",
                categories: []
              });
              setView('PRODUCT_EDITOR');
            }}
          >
            <Plus size={24} className="ml-2" />
            הוסף מוצר חדש
          </Button>
       </div>
    </div>
  );

  const renderProductEditor = () => {
    if (!editingProduct) return null;

    const saveProduct = async () => {
      if (!editingProduct.name) {
        showToast('נא להזין שם מוצר');
        return;
      }
      
      setLoading(true);
      await saveProductToFirestore(editingProduct);
      await loadData();
      setLoading(false);
      setView('ADMIN_DASHBOARD');
      showToast('נשמר בהצלחה');
    };

    // Helper functions for categories/options
    const addCategory = () => {
        setEditingProduct({
            ...editingProduct,
            categories: [...editingProduct.categories, { id: generateUUID(), name: '', type: 'radio', options: [] }]
        });
    };
    const updateCategory = (idx: number, updates: Partial<Category>) => {
        const newCats = [...editingProduct.categories];
        newCats[idx] = { ...newCats[idx], ...updates };
        setEditingProduct({ ...editingProduct, categories: newCats });
    };
    const removeCategory = (idx: number) => {
        const newCats = editingProduct.categories.filter((_, i) => i !== idx);
        setEditingProduct({ ...editingProduct, categories: newCats });
    };
    const addOption = (catIdx: number) => {
        const newCats = [...editingProduct.categories];
        // Default to linking to Tier 0
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
    // Tier Helpers
    const updateTier = (tierIdx: number, field: 'name' | 'price', value: string | number) => {
        const newTiers = [...editingProduct.tiers];
        newTiers[tierIdx] = { ...newTiers[tierIdx], [field]: value };
        setEditingProduct({ ...editingProduct, tiers: newTiers });
    };

    return (
      <div className="min-h-screen bg-rose-50/50 flex flex-col">
         <div className="sticky top-0 bg-white/90 backdrop-blur z-20 p-4 border-b border-rose-100 flex items-center justify-between shadow-sm">
            <button onClick={() => setView('ADMIN_DASHBOARD')} className="p-2 -mr-2 text-coffee-800 hover:bg-rose-50 rounded-full">
                <X />
            </button>
            <h2 className="font-heading font-bold text-lg text-coffee-800">עריכת מוצר</h2>
            <button onClick={saveProduct} className="text-rose-500 font-bold bg-rose-50 px-4 py-2 rounded-xl hover:bg-rose-100 transition-colors">שמור</button>
        </div>

        <div className="p-6 space-y-8 pb-32 overflow-y-auto">
          {/* 1. Basic Info & Tiers */}
          <section className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-rose-50">
            <h3 className="font-heading font-bold text-coffee-800 flex items-center gap-2 mb-4">
                <Settings size={20} className="text-rose-400" />
                הגדרת רמות מחיר (Tiers)
            </h3>
            
            <Input 
              label="שם המוצר"
              value={editingProduct.name}
              onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
            />

            <div className="space-y-3 mt-4">
                <label className="block text-sm font-medium text-coffee-800/80 mr-1">רמות בסיס (לדוגמה: בייסיק, פלוס, אקסטרה)</label>
                {editingProduct.tiers.map((tier, idx) => (
                    <div key={idx} className="flex gap-3">
                        <Input 
                            placeholder={`שם רמה ${idx+1}`}
                            value={tier.name}
                            onChange={e => updateTier(idx, 'name', e.target.value)}
                        />
                        <div className="w-1/3">
                            <Input 
                                type="number"
                                placeholder="מחיר"
                                value={tier.price}
                                onChange={e => updateTier(idx, 'price', Number(e.target.value))}
                            />
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="bg-rose-50 p-4 rounded-2xl text-sm text-coffee-800/80 leading-relaxed mt-4">
                <strong>איך זה עובד?</strong><br/>
                כל אפשרות בחירה שתגדירו למטה, תהיה מקושרת לאחת מרמות המחיר האלו (או מחיר ידני). המערכת תיקח תמיד את המחיר הגבוה ביותר מבין כל האפשרויות שנבחרו.
            </div>

             <TextArea 
              label="תבנית הודעה"
              rows={3}
              value={editingProduct.messageTemplate}
              onChange={e => setEditingProduct({ ...editingProduct, messageTemplate: e.target.value })}
              className="mt-4"
            />
          </section>

          {/* 2. Categories & Options */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-heading font-bold text-lg text-coffee-800">קטגוריות ואפשרויות</h3>
            </div>
            
            {editingProduct.categories.map((cat, catIdx) => (
              <div key={cat.id} className="bg-white p-5 rounded-3xl shadow-sm border border-rose-50 relative">
                 <button 
                  onClick={() => removeCategory(catIdx)} 
                  className="absolute top-5 left-5 text-rose-200 hover:text-red-400 transition-colors"
                >
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
                           <input type="radio" checked={cat.type === 'radio'} onChange={() => updateCategory(catIdx, {type: 'radio'})} className="accent-rose-500" />
                           <span className="text-sm">בחירה יחידה</span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer">
                           <input type="radio" checked={cat.type === 'checkbox'} onChange={() => updateCategory(catIdx, {type: 'checkbox'})} className="accent-rose-500" />
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
      </div>
    );
  };

  return (
    <>
      <Toast message={toastMsg} show={!!toastMsg} />
      {loading && <LoadingOverlay />}
      
      {view === 'HOME' && renderHome()}
      {view === 'CALCULATOR' && renderCalculator()}
      {view === 'ADMIN_LOGIN' && renderAdminLogin()}
      {view === 'ADMIN_DASHBOARD' && renderAdminDashboard()}
      {view === 'PRODUCT_EDITOR' && renderProductEditor()}
    </>
  );
};

export default App;