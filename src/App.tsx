import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import WelcomeScreen from '@/components/WelcomeScreen';
import QuizScreen from '@/components/QuizScreen';
import SettingsButton from '@/components/SettingsButton';
import SettingsPanel from '@/components/SettingsPanel';
import WheelDraw from '@/components/WheelDraw';
import { useQuiz } from '@/hooks/useQuiz';
import { useSettings, getBackgroundStyle } from '@/hooks/useSettings';
import { useDatabase } from '@/hooks/useDatabase';
import { defaultQuestions } from '@/data/defaultQuestions';
import type { Question, ScreenState } from '@/types/quiz';

export default function App() {
  const [appState, setAppState] = useState<ScreenState>('welcome');
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawOpen, setDrawOpen] = useState(false);

  const {
    questions,
    currentIndex,
    currentQuestion,
    showAnswer,
    totalCount,
    setQuestions,
    goToNext,
    goToPrev,
    revealAnswer,
    resetQuiz,
    pickRandom,
  } = useQuiz();

  const {
    settings,
    updateSettings,
    updateShortcut,
    resetSettings,
    resetShortcuts,
  } = useSettings();

  const {
    questions: dbQuestions,
    participants,
    questionCount,
    refreshQuestions,
    importQuestions,
    clearQuestions,
    addParticipant,
    deleteParticipant,
    clearParticipants,
    importParticipants,
    markDrawn,
    resetAllDrawn,
  } = useDatabase();

  // Sync database questions to useQuiz when loaded
  const hasSynced = useRef(false);
  useEffect(() => {
    if (dbQuestions.length > 0 && !hasSynced.current) {
      setQuestions(dbQuestions);
      hasSynced.current = true;
    }
  }, [dbQuestions, setQuestions]);

  // Track questions ref for settings panel
  const questionsRef = useRef(questions);
  questionsRef.current = questions;

  const handleStartQuiz = useCallback((qs: Question[]) => {
    setQuestions(qs);
    setIsRandomMode(false);
    setAppState('quiz');
  }, [setQuestions]);

  const handleRandomPick = useCallback((qs: Question[]) => {
    setQuestions(qs);
    setIsRandomMode(true);
    setAppState('quiz');
    setTimeout(() => {
      pickRandom();
    }, 0);
  }, [setQuestions, pickRandom]);

  const handleBack = useCallback(() => {
    resetQuiz();
    setIsRandomMode(false);
    setAppState('welcome');
  }, [resetQuiz]);

  const handleRandom = useCallback(() => {
    pickRandom();
  }, [pickRandom]);

  const handleQuestionsChange = useCallback((newQuestions: Question[]) => {
    setQuestions(newQuestions);
  }, [setQuestions]);

  const handleImportQuestions = useCallback((newQuestions: Omit<Question, 'id'>[], mode: 'append' | 'replace') => {
    importQuestions(newQuestions, mode).then(() => {
      refreshQuestions();
      // After DB import, refresh the useQuiz questions
      setTimeout(() => {
        if (mode === 'replace') {
          // Reload from DB
          // The useDatabase hook will update dbQuestions, triggering the sync
        }
      }, 100);
    });
  }, [importQuestions, refreshQuestions]);

  const handleClearQuestions = useCallback(() => {
    clearQuestions().then(() => {
      refreshQuestions();
      setQuestions([]);
    });
  }, [clearQuestions, refreshQuestions, setQuestions]);

  const handleDraw = useCallback((id: number) => {
    markDrawn(id);
  }, [markDrawn]);

  const handleResetDrawn = useCallback(() => {
    resetAllDrawn();
  }, [resetAllDrawn]);

  // Global keyboard shortcuts
  useEffect(() => {
    if (appState !== 'quiz') return;
    if (drawOpen) return;

    const handler = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs or when settings is open
      if (settingsOpen) {
        const toggleKey = settings.shortcuts.toggleSettings;
        const pressedKey = getPressedKey(e);
        if (pressedKey === toggleKey) {
          e.preventDefault();
          setSettingsOpen(false);
        }
        return;
      }

      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const pressedKey = getPressedKey(e);
      const { shortcuts } = settings;

      if (pressedKey === shortcuts.showAnswer) {
        e.preventDefault();
        if (!showAnswer) revealAnswer();
      } else if (pressedKey === shortcuts.nextQuestion) {
        e.preventDefault();
        goToNext();
      } else if (pressedKey === shortcuts.prevQuestion) {
        e.preventDefault();
        goToPrev();
      } else if (pressedKey === shortcuts.randomPick) {
        e.preventDefault();
        handleRandom();
      } else if (pressedKey === shortcuts.drawPerson) {
        e.preventDefault();
        if (settings.drawEnabled) {
          setDrawOpen(true);
        }
      } else if (pressedKey === shortcuts.toggleSettings) {
        e.preventDefault();
        setSettingsOpen(true);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [appState, settings, showAnswer, revealAnswer, goToNext, goToPrev, handleRandom, settingsOpen, drawOpen]);

  const bgStyle = getBackgroundStyle(settings);

  return (
    <div
      className="min-h-[100dvh] transition-all duration-300"
      style={bgStyle}
    >
      <AnimatePresence mode="wait">
        {appState === 'welcome' && (
          <WelcomeScreen
            key="welcome"
            onStartQuiz={handleStartQuiz}
            onRandomPick={handleRandomPick}
            onDrawClick={() => setDrawOpen(true)}
            defaultQuestions={defaultQuestions}
            settings={settings}
            onSettingsClick={() => setSettingsOpen(true)}
            questionCount={questionCount}
          />
        )}
        {appState === 'quiz' && currentQuestion && (
          <QuizScreen
            key="quiz"
            question={currentQuestion}
            currentIndex={currentIndex}
            totalCount={totalCount}
            showAnswer={showAnswer}
            isRandomMode={isRandomMode}
            onReveal={revealAnswer}
            onNext={goToNext}
            onPrev={goToPrev}
            onBack={handleBack}
            onRandom={handleRandom}
            onDrawClick={() => setDrawOpen(true)}
            settings={settings}
            onSettingsClick={() => setSettingsOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Settings Button - shown on both screens */}
      <SettingsButton onClick={() => setSettingsOpen(true)} />

      {/* Settings Panel */}
      <SettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        questions={questions}
        participants={participants}
        onSettingsChange={updateSettings}
        onShortcutChange={updateShortcut}
        onResetSettings={resetSettings}
        onResetShortcuts={resetShortcuts}
        onQuestionsChange={handleQuestionsChange}
        onImportQuestions={handleImportQuestions}
        onClearQuestions={handleClearQuestions}
        onParticipantAdd={addParticipant}
        onParticipantDelete={deleteParticipant}
        onParticipantClear={clearParticipants}
        onParticipantImport={importParticipants}
        onParticipantResetDrawn={handleResetDrawn}
      />

      {/* Wheel Draw Modal */}
      <AnimatePresence>
        {drawOpen && (
          <WheelDraw
            participants={participants}
            onDraw={handleDraw}
            onResetDrawn={handleResetDrawn}
            onClose={() => setDrawOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Convert a keyboard event to a normalized key identifier.
 * Format: [Ctrl+][Alt+][Shift+]<KeyCode>
 */
function getPressedKey(e: KeyboardEvent): string {
  const modifiers: string[] = [];
  if (e.ctrlKey) modifiers.push('Ctrl');
  if (e.altKey) modifiers.push('Alt');
  if (e.shiftKey) modifiers.push('Shift');

  const keyCode = e.code;
  if (modifiers.length > 0) {
    return `${modifiers.join('+')}+${keyCode}`;
  }
  return keyCode;
}
