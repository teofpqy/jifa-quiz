import { useState, useEffect, useCallback, useRef } from 'react';
import { getDatabase, resetDatabase } from '@/db/database';
import type { DatabaseManager } from '@/db/database';
import type { Question, Participant } from '@/types/quiz';

interface UseDatabaseReturn {
  db: DatabaseManager | null;
  loading: boolean;
  questions: Question[];
  participants: Participant[];
  questionCount: number;
  refreshQuestions: () => void;
  refreshParticipants: () => void;
  addQuestion: (q: Omit<Question, 'id'>) => Promise<number>;
  updateQuestion: (q: Question) => Promise<void>;
  deleteQuestion: (id: number) => Promise<void>;
  clearQuestions: () => Promise<void>;
  importQuestions: (questions: Omit<Question, 'id'>[], mode: 'append' | 'replace') => Promise<void>;
  addParticipant: (name: string) => Promise<number>;
  deleteParticipant: (id: number) => Promise<void>;
  clearParticipants: () => Promise<void>;
  markDrawn: (id: number) => Promise<void>;
  resetAllDrawn: () => Promise<void>;
  importParticipants: (names: string[]) => Promise<void>;
  getSetting: (key: string) => string | null;
  setSetting: (key: string, value: string) => Promise<void>;
  resetDb: () => void;
}

export function useDatabase(): UseDatabaseReturn {
  const [db, setDb] = useState<DatabaseManager | null>(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const dbRef = useRef<DatabaseManager | null>(null);

  useEffect(() => {
    let cancelled = false;

    getDatabase()
      .then((database) => {
        if (cancelled) return;
        dbRef.current = database;
        setDb(database);
        setQuestions(database.getAllQuestions());
        setParticipants(database.getAllParticipants());
        setQuestionCount(database.getQuestionCount());
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshQuestions = useCallback(() => {
    if (dbRef.current) {
      const qs = dbRef.current.getAllQuestions();
      setQuestions(qs);
      setQuestionCount(dbRef.current.getQuestionCount());
    }
  }, []);

  const refreshParticipants = useCallback(() => {
    if (dbRef.current) {
      setParticipants(dbRef.current.getAllParticipants());
    }
  }, []);

  const addQuestion = useCallback(async (q: Omit<Question, 'id'>) => {
    if (!dbRef.current) return -1;
    const id = dbRef.current.addQuestion(q);
    refreshQuestions();
    return id;
  }, [refreshQuestions]);

  const updateQuestion = useCallback(async (q: Question) => {
    if (!dbRef.current) return;
    dbRef.current.updateQuestion(q);
    refreshQuestions();
  }, [refreshQuestions]);

  const deleteQuestion = useCallback(async (id: number) => {
    if (!dbRef.current) return;
    dbRef.current.deleteQuestion(id);
    refreshQuestions();
  }, [refreshQuestions]);

  const clearQuestions = useCallback(async () => {
    if (!dbRef.current) return;
    dbRef.current.clearQuestions();
    refreshQuestions();
  }, [refreshQuestions]);

  const importQuestions = useCallback(async (qs: Omit<Question, 'id'>[], mode: 'append' | 'replace') => {
    if (!dbRef.current) return;
    dbRef.current.importQuestions(qs, mode);
    refreshQuestions();
  }, [refreshQuestions]);

  const addParticipant = useCallback(async (name: string) => {
    if (!dbRef.current) return -1;
    const id = dbRef.current.addParticipant(name);
    refreshParticipants();
    return id;
  }, [refreshParticipants]);

  const deleteParticipant = useCallback(async (id: number) => {
    if (!dbRef.current) return;
    dbRef.current.deleteParticipant(id);
    refreshParticipants();
  }, [refreshParticipants]);

  const clearParticipants = useCallback(async () => {
    if (!dbRef.current) return;
    dbRef.current.clearParticipants();
    refreshParticipants();
  }, [refreshParticipants]);

  const markDrawn = useCallback(async (id: number) => {
    if (!dbRef.current) return;
    dbRef.current.markDrawn(id);
    refreshParticipants();
  }, [refreshParticipants]);

  const resetAllDrawn = useCallback(async () => {
    if (!dbRef.current) return;
    dbRef.current.resetAllDrawn();
    refreshParticipants();
  }, [refreshParticipants]);

  const importParticipants = useCallback(async (names: string[]) => {
    if (!dbRef.current) return;
    dbRef.current.importParticipants(names);
    refreshParticipants();
  }, [refreshParticipants]);

  const getSetting = useCallback((key: string): string | null => {
    if (!dbRef.current) return null;
    return dbRef.current.getSetting(key);
  }, []);

  const setSetting = useCallback(async (key: string, value: string) => {
    if (!dbRef.current) return;
    dbRef.current.setSetting(key, value);
  }, []);

  const resetDb = useCallback(() => {
    resetDatabase();
    dbRef.current = null;
    setDb(null);
    setQuestions([]);
    setParticipants([]);
    setQuestionCount(0);
    setLoading(true);
    // Re-init
    getDatabase()
      .then((database) => {
        dbRef.current = database;
        setDb(database);
        setQuestions(database.getAllQuestions());
        setParticipants(database.getAllParticipants());
        setQuestionCount(database.getQuestionCount());
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return {
    db,
    loading,
    questions,
    participants,
    questionCount,
    refreshQuestions,
    refreshParticipants,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    clearQuestions,
    importQuestions,
    addParticipant,
    deleteParticipant,
    clearParticipants,
    markDrawn,
    resetAllDrawn,
    importParticipants,
    getSetting,
    setSetting,
    resetDb,
  };
}
