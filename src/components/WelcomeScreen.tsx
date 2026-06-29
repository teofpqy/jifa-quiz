import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Shuffle, Play, FileSpreadsheet, Target } from 'lucide-react';
import { parseExcelFile } from '@/utils/excelParser';
import type { Question } from '@/types/quiz';
import type { AppSettings } from '@/hooks/useSettings';
import { getFontStyle } from '@/hooks/useSettings';

interface WelcomeScreenProps {
  onStartQuiz: (questions: Question[]) => void;
  onRandomPick: (questions: Question[]) => void;
  onDrawClick: () => void;
  defaultQuestions: Question[];
  settings: AppSettings;
  onSettingsClick: () => void;
  questionCount: number;
}

export default function WelcomeScreen({
  onStartQuiz,
  onRandomPick,
  onDrawClick,
  defaultQuestions,
  settings,
  questionCount,
}: WelcomeScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedCount, setUploadedCount] = useState(0);
  const [uploadedQuestions, setUploadedQuestions] = useState<Question[] | null>(null);

  const fontStyle = getFontStyle(settings);

  const handleFileUpload = async (file: File) => {
    setUploadError('');
    try {
      const questions = await parseExcelFile(file);
      if (questions.length === 0) {
        setUploadError('未检测到有效题目，请检查Excel格式');
        return;
      }
      setUploadedCount(questions.length);
      setUploadedQuestions(questions);
    } catch (error) {
      setUploadError((error as Error).message);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      handleFileUpload(file);
    } else {
      setUploadError('请上传 .xlsx 或 .xls 格式的Excel文件');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const hasQuestions = (uploadedQuestions && uploadedQuestions.length > 0) || questionCount > 0;

  const handleStart = () => {
    const questions = uploadedQuestions || defaultQuestions;
    if (questions.length === 0) return;
    onStartQuiz(questions);
  };

  const handleRandomPick = () => {
    const questions = uploadedQuestions || defaultQuestions;
    if (questions.length === 0) return;
    onRandomPick(questions);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    },
  };

  return (
    <motion.div
      className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={fontStyle}
    >
      {/* Title Section */}
      <motion.div className="text-center mb-10" variants={itemVariants}>
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-[3px] bg-[#C41E3A]" />
          <BookOpen className="w-8 h-8 text-[#C41E3A]" />
          <div className="w-12 h-[3px] bg-[#C41E3A]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-[#8B0000] tracking-wider mb-3">
          {settings.title || '纪法知识快问快答'}
        </h1>
        <p className="text-lg text-gray-600 tracking-wide">
          {settings.subtitle || '学纪知纪明纪守纪 · 筑牢廉洁自律防线'}
        </p>
      </motion.div>

      {/* Upload Section */}
      <motion.div className="w-full max-w-lg mb-8" variants={itemVariants}>
        <div
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-300
            ${isDragging
              ? 'border-[#C41E3A] bg-red-50'
              : 'border-gray-300 hover:border-[#C41E3A] hover:bg-gray-50'
            }
          `}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleInputChange}
          />
          <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-base text-gray-700 mb-1">
            点击上传或拖拽Excel文件到此处
          </p>
          <p className="text-sm text-gray-400">
            支持 .xlsx / .xls 格式
          </p>
        </div>

        {uploadError && (
          <motion.p
            className="text-red-600 text-sm mt-2 text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {uploadError}
          </motion.p>
        )}

        {uploadedCount > 0 && (
          <motion.div
            className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-green-700 text-sm">
              成功导入 <span className="font-bold">{uploadedCount}</span> 道题目
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Question Count Info */}
      <motion.div
        className="flex items-center gap-6 mb-8 text-sm text-gray-500"
        variants={itemVariants}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasQuestions ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span>
            {uploadedQuestions
              ? `已导入 ${uploadedQuestions.length} 题`
              : hasQuestions
                ? `共 ${questionCount} 题`
                : '请导入题库后开始答题'
            }
          </span>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div className="flex flex-col sm:flex-row gap-4 w-full max-w-md" variants={itemVariants}>
        <motion.button
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-lg shadow-lg transition-colors duration-300 ${
            hasQuestions
              ? 'bg-[#C41E3A] text-white hover:bg-[#A01830]'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={handleStart}
          whileHover={hasQuestions ? { scale: 1.03 } : {}}
          whileTap={hasQuestions ? { scale: 0.97 } : {}}
          disabled={!hasQuestions}
        >
          <Play className="w-5 h-5" />
          开始答题
        </motion.button>
        <motion.button
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-lg shadow-lg transition-colors duration-300 ${
            hasQuestions
              ? 'bg-[#D4A843] text-white hover:bg-[#B89335]'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={handleRandomPick}
          whileHover={hasQuestions ? { scale: 1.03 } : {}}
          whileTap={hasQuestions ? { scale: 0.97 } : {}}
          disabled={!hasQuestions}
        >
          <Shuffle className="w-5 h-5" />
          随机抽题
        </motion.button>
      </motion.div>

      {/* Draw Person Button */}
      {settings.drawEnabled && (
        <motion.div className="mt-4 w-full max-w-md" variants={itemVariants}>
          <motion.button
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-lg shadow-lg bg-white border-2 border-[#C41E3A] text-[#C41E3A] hover:bg-red-50 transition-colors duration-300"
            onClick={onDrawClick}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Target className="w-5 h-5" />
            抽取人员
          </motion.button>
        </motion.div>
      )}

      {/* Format Hint */}
      <motion.div
        className="mt-10 p-4 bg-gray-50 rounded-lg max-w-lg w-full"
        variants={itemVariants}
      >
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          Excel格式：题型（单选/多选/判断）、题干、选项A-E、答案、解析
        </p>
      </motion.div>
    </motion.div>
  );
}
