import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, BookOpen } from 'lucide-react';
import { GlobalDictionary } from '../../types';
import { AppState } from '../../hooks/useAppState';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { SubHeader } from '../../components/SubHeader';
import { StickyFooter } from '../../components/StickyFooter';
import { BaseCard } from '../../components/BaseCard';
import { IconButton } from '../../components/IconButton';
import { SectionHeader } from '../../components/SectionHeader';
import { saveGlobalDictionaryToFirestore, deleteGlobalDictionaryFromFirestore, generateUUID } from '../../services/storage';
import styles from './style.module.scss';

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
            <div className={styles.container}>
                <SubHeader
                    title={editingId === 'new' ? 'מאגר מאפיינים חדש' : 'עריכת מאגר מאפיינים'}
                    onBack={cancelEdit}
                    backIcon="close"
                />
                <div className={styles.editContent}>
                    <BaseCard variant="outlined" className={styles.editCard}>
                        <SectionHeader icon={<BookOpen size={18} />}>פרטי המאגר</SectionHeader>

                        <Input
                            label="שם המאגר"
                            placeholder="לדוגמה: טעמים בסיסיים"
                            value={draft.name}
                            onChange={e => setDraft({ ...draft, name: e.target.value })}
                        />

                        <div>
                            <label className={styles.label}>
                                אפשרויות (מופרדות בפסיק)
                            </label>
                            <textarea
                                className={styles.textarea}
                                placeholder="לדוגמה: וניל, שוקולד, תות, פיסטוק"
                                value={choicesRaw}
                                onChange={e => setChoicesRaw(e.target.value)}
                            />
                            {choicesRaw && (
                                <div className={styles.choiceContainer}>
                                    {choicesRaw.split(',').map(s => s.trim()).filter(Boolean).map((choice, i) => (
                                        <span key={i} className={`text-caption ${styles.choiceBadge}`}>
                                            {choice}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </BaseCard>
                </div>

                <StickyFooter>
                    <div className={styles.footerButtons}>
                        <Button variant="secondary" fullWidth onClick={cancelEdit}>
                            בטל<X size={16} />
                        </Button>
                        <Button fullWidth onClick={saveDraft} disabled={!draft.name.trim()}>
                            שמור<Check size={16} />
                        </Button>
                    </div>
                </StickyFooter>
            </div>
        );
    }

    // ─── List View ────────────────────────────────────────────────────────────
    return (
        <div className={`${styles.container} ${styles.listView}`}>
            <SubHeader title="מאגרי מאפיינים גלובליים" onBack={() => navigate('ADMIN_DASHBOARD')} />

            <div className={styles.listContent}>
                <div className={styles.infoBox}>
                    <strong>מה זה מאגר מאפיינים גלובלי?</strong><br />
                    רשימת אפשרויות שניתן לשתף בין שדות שונים. בכל שדה מסוג "מאפיינים", תבחר מהרשימה הזו במקום להזין בעצמך כל פעם מחדש. עדכון המאגר יעדכן אוטומטית את כל השדות שמצביעים אליו.
                </div>

                {dictionaries.length === 0 ? (
                    <div className={styles.emptyState}>
                        <BookOpen size={40} className={styles.emptyIcon} />
                        <p className="text-body-sm">אין מאגרים עדיין</p>
                    </div>
                ) : (
                    dictionaries.map(dict => (
                        <BaseCard key={dict.id} variant="outlined" className={styles.listItem}>
                            <div className={styles.itemDetails}>
                                <h3 className={styles.itemTitle}>{dict.name}</h3>
                                <div className={styles.itemChoices}>
                                    {dict.choices.slice(0, 5).map((c, i) => (
                                        <span key={i} className={styles.badgeSmall}>
                                            {c}
                                        </span>
                                    ))}
                                    {dict.choices.length > 5 && (
                                        <span className={styles.badgeMore}>+{dict.choices.length - 5}</span>
                                    )}
                                </div>
                            </div>
                            <div className={styles.itemActions}>
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
                    מאגר מאפיינים חדש<Plus size={18} />
                </Button>
            </StickyFooter>
        </div>
    );
};
