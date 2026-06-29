import { motion } from 'framer-motion';
import { HelpCircle, Check, X } from 'lucide-react';
import type { Question } from '@/types/quiz';

interface QuestionCardProps {
  question: Question;
  showAnswer: boolean;
}

export default function QuestionCard({ question, showAnswer }: QuestionCardProps) {
  const isChoice = question.type === '单选' || question.type === '多选';
  const isMulti = question.type === '多选';
  const isTF = question.type === '判断';

  const correctAnswers = isMulti
    ? question.correctAnswer.split(',').map((s) => s.trim()).filter(Boolean)
    : [question.correctAnswer];

  // Include E option if present
  const allOptionKeys = question.options
    ? (['A', 'B', 'C', 'D', 'E'] as const).filter((k) => question.options && question.options[k])
    : [];

  return (
    <motion.div
      className="w-full max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
    >
      {/* Question Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C41E3A] flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 text-xs font-medium bg-[#C41E3A] text-white rounded-full">
              {question.type}题
            </span>
            <span className="text-sm text-gray-400">
              第 {question.id} 题
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 leading-relaxed">
            {question.question}
          </h2>
        </div>
      </div>

      {/* Single/Multiple Choice Options */}
      {isChoice && question.options && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-14">
          {allOptionKeys.map((key, index) => {
            const optionText = question.options?.[key];
            if (!optionText) return null;

            const isCorrect = correctAnswers.includes(key);
            const showCorrect = showAnswer && isCorrect;
            const showWrong = showAnswer && !isCorrect;

            return (
              <motion.div
                key={key}
                className={`
                  relative p-5 rounded-xl border-2 transition-all duration-500
                  ${showCorrect
                    ? 'border-green-500 bg-green-50 shadow-lg shadow-green-100'
                    : showWrong
                      ? 'border-gray-200 bg-gray-50 opacity-50'
                      : 'border-gray-200 bg-white hover:border-[#C41E3A] hover:shadow-md'
                  }
                `}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1,
                  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Single = circle, Multi = square checkbox */}
                  <span
                    className={`
                      flex-shrink-0 w-9 h-9 flex items-center justify-center
                      text-sm font-bold
                      ${isMulti ? 'rounded-lg' : 'rounded-full'}
                      ${showCorrect
                        ? 'bg-green-500 text-white'
                        : showWrong
                          ? 'bg-gray-300 text-gray-500'
                          : 'bg-[#C41E3A] text-white'
                      }
                    `}
                  >
                    {key}
                  </span>
                  <span
                    className={`
                      text-base font-medium
                      ${showCorrect
                        ? 'text-green-700'
                        : showWrong
                          ? 'text-gray-400'
                          : 'text-gray-700'
                      }
                    `}
                  >
                    {optionText}
                  </span>
                </div>

                {/* Correct Answer Checkmark */}
                {showCorrect && (
                  <motion.div
                    className="absolute top-2 right-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  >
                    <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* True/False Buttons */}
      {isTF && (
        <div className="flex gap-6 ml-14">
          {['A', 'B'].map((key, index) => {
            const isCorrect = question.correctAnswer === key;
            const label = key === 'A' ? '对' : '错';
            const showCorrect = showAnswer && isCorrect;
            const showWrong = showAnswer && !isCorrect;

            return (
              <motion.div
                key={key}
                className={`
                  flex-1 p-6 rounded-xl border-2 transition-all duration-500 flex items-center justify-center gap-3
                  ${showCorrect
                    ? 'border-green-500 bg-green-50 shadow-lg shadow-green-100'
                    : showWrong
                      ? 'border-gray-200 bg-gray-50 opacity-50'
                      : 'border-gray-200 bg-white hover:border-[#C41E3A] hover:shadow-md'
                  }
                `}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.15,
                  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                }}
              >
                {key === 'A' ? (
                  <Check className={`w-8 h-8 ${showCorrect ? 'text-green-600' : showWrong ? 'text-gray-400' : 'text-[#C41E3A]'}`} />
                ) : (
                  <X className={`w-8 h-8 ${showCorrect ? 'text-green-600' : showWrong ? 'text-gray-400' : 'text-[#C41E3A]'}`} />
                )}
                <span
                  className={`
                    text-2xl font-bold
                    ${showCorrect ? 'text-green-700' : showWrong ? 'text-gray-400' : 'text-gray-800'}
                  `}
                >
                  {label}
                </span>
                {showCorrect && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  >
                    <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
