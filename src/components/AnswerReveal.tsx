import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import type { Question } from '@/types/quiz';

interface AnswerRevealProps {
  question: Question;
  showAnswer: boolean;
  showExplanation?: boolean;
}

export default function AnswerReveal({ question, showAnswer, showExplanation = true }: AnswerRevealProps) {
  if (!showAnswer) return null;

  const isMulti = question.type === '多选';
  const isTF = question.type === '判断';

  // Build correct answer display
  let answerDisplay: string;
  if (isTF) {
    answerDisplay = question.correctAnswer === 'A' ? '对 (正确)' : question.correctAnswer === 'B' ? '错 (错误)' : question.correctAnswer;
  } else if (isMulti) {
    const answers = question.correctAnswer.split(',').map((s) => s.trim()).filter(Boolean);
    const labels = answers.map((ans) => {
      const text = question.options?.[ans as keyof typeof question.options];
      return text ? `${ans} (${text})` : ans;
    });
    answerDisplay = labels.join('、');
  } else {
    const text = question.options?.[question.correctAnswer as keyof typeof question.options];
    answerDisplay = text ? `${question.correctAnswer} (${text})` : question.correctAnswer;
  }

  return (
    <motion.div
      className="w-full max-w-3xl mx-auto mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
    >
      <div className="ml-14 p-5 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-[#D4A843]" />
          <span className="text-sm font-bold text-[#B89335]">答案解析</span>
        </div>

        {/* Correct Answer */}
        <div className="mb-3">
          <p className="text-base">
            <span className="font-medium text-gray-600">
              {isMulti ? '正确答案（多选）：' : '正确答案：'}
            </span>
            <span className="font-bold text-[#C41E3A]">{answerDisplay}</span>
          </p>
        </div>

        {/* Explanation - controlled by showExplanation setting */}
        {showExplanation && question.explanation && (
          <motion.p
            className="text-sm text-gray-600 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {question.explanation}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
