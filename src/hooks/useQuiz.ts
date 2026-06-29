import { useState, useCallback, useEffect } from 'react';
import type { Question } from '@/types/quiz';

const STORAGE_KEY = 'jifa-quiz-questions';

function loadStoredQuestions(): Question[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Question[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

function saveQuestions(questions: Question[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
  } catch { /* ignore quota errors */ }
}

interface UseQuizReturn {
  questions: Question[];
  currentIndex: number;
  currentQuestion: Question | null;
  showAnswer: boolean;
  totalCount: number;
  setQuestions: (questions: Question[]) => void;
  goToNext: () => void;
  goToPrev: () => void;
  revealAnswer: () => void;
  resetQuiz: () => void;
  pickRandom: () => void;
}

export function useQuiz(): UseQuizReturn {
  const [questions, setQuestionsState] = useState<Question[]>(() => loadStoredQuestions() ?? []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const currentQuestion = questions.length > 0 ? questions[currentIndex] : null;
  const totalCount = questions.length;

  useEffect(() => { saveQuestions(questions); }, [questions]);

  const setQuestions = useCallback((newQuestions: Question[]) => {
    setQuestionsState(newQuestions);
    setCurrentIndex(0);
    setShowAnswer(false);
  }, []);

  const goToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setShowAnswer(false);
      setCurrentIndex(p => p + 1);
    }
  }, [currentIndex, questions.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setShowAnswer(false);
      setCurrentIndex(p => p - 1);
    }
  }, [currentIndex]);

  const revealAnswer = useCallback(() => { setShowAnswer(true); }, []);

  const resetQuiz = useCallback(() => {
    setCurrentIndex(0);
    setShowAnswer(false);
  }, []);

  const pickRandom = useCallback(() => {
    if (questions.length > 0) {
      setShowAnswer(false);
      setCurrentIndex(Math.floor(Math.random() * questions.length));
    }
  }, [questions.length]);

  return { questions, currentIndex, currentQuestion, showAnswer, totalCount, setQuestions, goToNext, goToPrev, revealAnswer, resetQuiz, pickRandom };
}
