import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, BookOpen } from 'lucide-react';
import { GlobalDictionary } from '../types';
import { AppState } from '../hooks/useAppState';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { SubHeader } from '../components/SubHeader';
import { StickyFooter } from '../components/StickyFooter';
import { BaseCard } from '../components/BaseCard';
import { IconButton } from '../components/IconButton';
import { SectionHeader } from '../components/SectionHeader';
import { saveGlobalDictionaryToFirestore, deleteGlobalDictionaryFromFirestore, generateUUID } from '../services/storage';

type Props = Pick<AppState, 'data' | 'navigate' | 'setLoading' | 'loadData' | 'showToast'>;

export const DictionaryManagerView: React.FC<Props> = ({ data, navigate, setLoading, loadData, showToast }) => {
    // editingId: null = list view, string = editing that dict, 'new' = creating new
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState<GlobalDictionary | null>(null);
    const [choicesRaw, setChoicesRaw] = useState('');

    const startEdit = (dict: GlobalDictionary) => {
        setDraft({ ...dict });
        setChoicesRaw(dict.choices.join(', '));
        setEditingId(dict.id);
    };

    const startNew = () => {
        const newDict: GlobalDictionary = {
            id: generateUUID(),
            name: '',
            choices: []
        };
        setDraft(newDict);
        setChoicesRaw('');
        setEditingId('new');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setDraft(null);
        setChoicesRaw('');
    };

    const saveDraft = async () => {
        if (!draft) return;
        if (!draft.name.trim()) { showToast('נא להזין שם למאגר'); return; }
        const choices = choicesRaw.split(',').map(s => s.trim()).filter(Boolean);
        if (choices.length === 0) { showToast('נא להזין לפחות אפשרות אחת'); return; }

        setLoading(true);
        try {
            await saveGlobalDictionaryToFirestore({ ...draft, choices });
            await loadData();
            cancelEdit();
            showToast('המאגר נשמר בהצלחה');
        } catch (e) {
            console.error(e);
            showToast('שגיאה בשמירת המאגר — בדוק הרשאות Firestore');
        } finally {
            setLoading(false);
        }
    };

    const deleteDictionary = async (id: string) => {
        if (!window.confirm('למחוק מאגר זה? שדות המשתמשים בו לא ישפיעו מיידית.')) return;
        setLoading(true);
        try {
            await deleteGlobalDictionaryFromFirestore(id);
            await loadData();
            showToast('המאגר נמחק');
        } catch (e) {
            console.error(e);
            showToast('שגיאה במחיקת המאגר — בדוק הרשאות Firestore');
        } finally {
            setLoading(false);
        }
    };

    const dictionaries = data.globalDictionaries;

    // ─── Edit / Create Form ───────────────────────────────────────────────────
    if (editingId !== null && draft) {
        return (
            <div className="min-h-screen flex flex-col">
                <SubHeader
                    title={editingId === 'new' ? 'מאגר מאפיינים חדש' : 'עריכת מאגר מאפיינים'}
                    onBack={cancelEdit}
                    backIcon="close"
                />
                <div className="p-6 space-y-6 pb-32">
                    <BaseCard variant="outlined" className="space-y-4 !p-6 !rounded-3xl">
                        <SectionHeader icon={<BookOpen size={18} />}>פרטי המאגר</SectionHeader>

                        <Input
                            label="שם המאגר"
                            placeholder="לדוגמה: טעמים בסיסיים"
                            value={draft.name}
                            onChange={e => setDraft({ ...draft, name: e.target.value })}
                        />

                        <div>
                            <label className="block text-body-sm font-medium text-secondary mb-1 mr-1">
                                אפשרויות (מופרדות בפסיק)
                            </label>
                            <textarea
                                className="w-full min-h-[100px] bg-white border border-default rounded-2xl px-4 py-3 text-body-sm text-primary resize-none focus:outline-none focus:border-focus transition-colors"
                                placeholder="לדוגמה: וניל, שוקולד, תות, פיסטוק"
                                value={choicesRaw}
                                onChange={e => setChoicesRaw(e.target.value)}
                            />
                            {choicesRaw && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {choicesRaw.split(',').map(s => s.trim()).filter(Boolean).map((choice, i) => (
                                        <span key={i} className="text-caption bg-accent-ghost text-accent px-2 py-1 rounded-lg border border-light">
                                            {choice}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </BaseCard>
                </div>

                <StickyFooter>
                    <div className="flex gap-3">
                        <Button variant="secondary" fullWidth onClick={cancelEdit}>
                            <X size={16} className="ml-1" />
                            בטל
                        </Button>
                        <Button fullWidth onClick={saveDraft} disabled={!draft.name.trim()}>
                            <Check size={16} className="ml-1" />
                            שמור
                        </Button>
                    </div>
                </StickyFooter>
            </div>
        );
    }

    // ─── List View ────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex flex-col pb-28">
            <SubHeader title="מאגרי מאפיינים גלובליים" onBack={() => navigate('ADMIN_DASHBOARD')} />

            <div className="p-6 space-y-4">
                <div className="bg-accent-ghost p-4 rounded-2xl text-body-sm text-secondary leading-relaxed">
                    <strong>מה זה מאגר מאפיינים גלובלי?</strong><br />
                    רשימת אפשרויות שניתן לשתף בין שדות שונים. בכל שדה מסוג "מאפיינים", תבחר מהרשימה הזו במקום להזין בעצמך כל פעם מחדש. עדכון המאגר יעדכן אוטומטית את כל השדות שמצביעים אליו.
                </div>

                {dictionaries.length === 0 ? (
                    <div className="text-center py-12 text-muted">
                        <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-body-sm">אין מאגרים עדיין</p>
                    </div>
                ) : (
                    dictionaries.map(dict => (
                        <BaseCard key={dict.id} variant="outlined" className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-primary text-body-base">{dict.name}</h3>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {dict.choices.slice(0, 5).map((c, i) => (
                                        <span key={i} className="text-caption bg-accent-ghost text-accent px-2 py-0.5 rounded-lg border border-light">
                                            {c}
                                        </span>
                                    ))}
                                    {dict.choices.length > 5 && (
                                        <span className="text-caption text-muted px-1">+{dict.choices.length - 5}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <IconButton
                                    icon={<Edit2 size={16} />}
                                    variant="accent"
                                    size="sm"
                                    onClick={() => startEdit(dict)}
                                    label="ערוך"
                                />
                                <IconButton
                                    icon={<Trash2 size={16} />}
                                    variant="danger"
                                    size="sm"
                                    onClick={() => deleteDictionary(dict.id)}
                                    label="מחק"
                                />
                            </div>
                        </BaseCard>
                    ))
                )}
            </div>

            <StickyFooter>
                <Button fullWidth onClick={startNew}>
                    <Plus size={18} className="ml-1" />
                    מאגר מאפיינים חדש
                </Button>
            </StickyFooter>
        </div>
    );
};
