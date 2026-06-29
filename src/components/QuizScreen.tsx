import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, ArrowRight, ArrowLeft, RotateCcw, Home, Sparkles, Target,
} from 'lucide-react';
import QuestionCard from './QuestionCard';
import AnswerReveal from './AnswerReveal';
import type { Question } from '@/types/quiz';
import type { AppSettings } from '@/hooks/useSettings';
import { getFontStyle } from '@/hooks/useSettings';

interface QuizScreenProps {
  question: Question | null;
  currentIndex: number;
  totalCount: number;
  showAnswer: boolean;
  isRandomMode: boolean;
  onReveal: () => void;
  onNext: () => void;
  onPrev: () => void;
  onBack: () => void;
  onRandom: () => void;
  onDrawClick: () => void;
  settings: AppSettings;
  onSettingsClick: () => void;
}

export default function QuizScreen({
  question,
  currentIndex,
  totalCount,
  showAnswer,
  isRandomMode,
  onReveal,
  onNext,
  onPrev,
  onBack,
  onRandom,
  onDrawClick,
  settings,
}: QuizScreenProps) {
  if (!question) return null;

  const isLastQuestion = currentIndex === totalCount - 1;
  const isFirstQuestion = currentIndex === 0;
  const fontStyle = getFontStyle(settings);

  return (
    <motion.div
      className="min-h-[100dvh] flex flex-col px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={fontStyle}
    >
      {/* Top Bar */}
      <div className="w-full max-w-3xl mx-auto flex items-center justify-between mb-8">
        <motion.button
          className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-[#C41E3A] transition-colors rounded-lg hover:bg-red-50"
          onClick={onBack}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Home className="w-4 h-4" />
          <span className="text-sm font-medium">返回</span>
        </motion.button>

        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#C41E3A] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            />
          </div>
          <span className="text-sm text-gray-500 font-medium">
            {currentIndex + 1} / {totalCount}
          </span>
        </div>

        {/* Draw Person Button */}
        {settings.drawEnabled && (
          <motion.button
            className="flex items-center gap-2 px-4 py-2 text-[#C41E3A] hover:bg-red-50 transition-colors rounded-lg border border-[#C41E3A]/30 hover:border-[#C41E3A]"
            onClick={onDrawClick}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium">抽取人员</span>
          </motion.button>
        )}
      </div>

      {/* Question Area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            className="w-full"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <QuestionCard question={question} showAnswer={showAnswer} />
            <AnswerReveal question={question} showAnswer={showAnswer} showExplanation={settings.showExplanation} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Action Bar */}
      <motion.div
        className="w-full max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {!showAnswer ? (
          <motion.button
            className="flex items-center justify-center gap-2 px-8 py-4 bg-[#C41E3A] text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-[#A01830] transition-colors duration-300 w-full sm:w-auto"
            onClick={onReveal}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Eye className="w-5 h-5" />
            显示答案
          </motion.button>
        ) : (
          <>
            {/* Prev Button - shown when not in random mode and not first question */}
            {!isRandomMode && !isFirstQuestion && (
              <motion.button
                className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold text-lg shadow-lg hover:bg-gray-200 transition-colors duration-300 w-full sm:w-auto"
                onClick={onPrev}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <ArrowLeft className="w-5 h-5" />
                上一题
              </motion.button>
            )}

            {!isLastQuestion && !isRandomMode && (
              <motion.button
                className="flex items-center justify-center gap-2 px-8 py-4 bg-[#C41E3A] text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-[#A01830] transition-colors duration-300 w-full sm:w-auto"
                onClick={onNext}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <ArrowRight className="w-5 h-5" />
                下一题
              </motion.button>
            )}

            {isRandomMode && (
              <motion.button
                className="flex items-center justify-center gap-2 px-8 py-4 bg-[#D4A843] text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-[#B89335] transition-colors duration-300 w-full sm:w-auto"
                onClick={onRandom}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Sparkles className="w-5 h-5" />
                再抽一题
              </motion.button>
            )}

            {(isLastQuestion && !isRandomMode) && (
              <motion.div
                className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.button
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-gray-600 transition-colors duration-300"
                  onClick={onBack}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <RotateCcw className="w-5 h-5" />
                  重新开始
                </motion.button>
                <motion.button
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-[#D4A843] text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-[#B89335] transition-colors duration-300"
                  onClick={onRandom}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Sparkles className="w-5 h-5" />
                  随机抽题
                </motion.button>
              </motion.div>
            )}
          </>
        )}
      </motion.div>

      {/* Keyboard Shortcut Hints */}
      <motion.div
        className="w-full max-w-3xl mx-auto mt-6 flex items-center justify-center gap-4 text-xs text-gray-400 flex-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {!showAnswer ? (
          <span className="flex items-center gap-1">
            按 <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">空格</kbd> 显示答案
          </span>
        ) : (
          <>
            {!isRandomMode && !isFirstQuestion && (
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">←</kbd> 上一题
              </span>
            )}
            {!isRandomMode && !isLastQuestion && (
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">→</kbd> 下一题
              </span>
            )}
          </>
        )}
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">R</kbd> 随机抽题
        </span>
        {settings.drawEnabled && (
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">D</kbd> 抽取人员
          </span>
        )}
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">Esc</kbd> 设置
        </span>
      </motion.div>
    </motion.div>
  );
}
