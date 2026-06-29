import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import type { Question, QuestionType } from '@/types/quiz';

interface QuestionEditorProps {
  question?: Question | null;
  onSave: (question: Omit<Question, 'id'>) => void;
  onCancel: () => void;
}

const emptyChoice = { A: '', B: '', C: '', D: '', E: '' };

export default function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
  const isEditing = !!question;
  const [type, setType] = useState<QuestionType>('单选');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState({ ...emptyChoice });
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (question) {
      setType(question.type);
      setQuestionText(question.question);
      setOptions(question.options ? { ...emptyChoice, ...question.options } : { ...emptyChoice });
      setCorrectAnswer(question.correctAnswer);
      setExplanation(question.explanation);
    } else {
      setType('单选');
      setQuestionText('');
      setOptions({ ...emptyChoice });
      setCorrectAnswer('');
      setExplanation('');
    }
    setErrors({});
  }, [question]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!questionText.trim()) newErrors.question = '请输入题目内容';

    if (type === '单选' || type === '多选') {
      if (!options.A.trim()) newErrors.A = '请输入选项A';
      if (!options.B.trim()) newErrors.B = '请输入选项B';
      if (!options.C.trim()) newErrors.C = '请输入选项C';
      if (!options.D.trim()) newErrors.D = '请输入选项D';

      if (type === '单选') {
        if (!correctAnswer || !['A', 'B', 'C', 'D', 'E'].includes(correctAnswer)) {
          newErrors.correctAnswer = '请选择正确答案';
        }
      } else {
        if (!correctAnswer.trim()) {
          newErrors.correctAnswer = '请输入正确答案（如 A,B,C）';
        }
      }
    } else if (type === '判断') {
      if (!correctAnswer || !['A', 'B'].includes(correctAnswer)) {
        newErrors.correctAnswer = '请选择正确答案（对/错）';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const cleanOptions = type === '判断' ? null : {
      A: options.A.trim(),
      B: options.B.trim(),
      C: options.C.trim(),
      D: options.D.trim(),
      ...(options.E.trim() ? { E: options.E.trim() } : {}),
    };

    onSave({
      type,
      question: questionText.trim(),
      options: cleanOptions,
      correctAnswer: correctAnswer.trim(),
      explanation: explanation.trim(),
    });
  };

  const handleOptionChange = (key: keyof typeof options, value: string) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleMultiAnswerToggle = (key: string) => {
    const current = correctAnswer.split(',').map((s) => s.trim()).filter(Boolean);
    if (current.includes(key)) {
      setCorrectAnswer(current.filter((k) => k !== key).join(','));
    } else {
      const sorted = [...current, key].sort();
      setCorrectAnswer(sorted.join(','));
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Content */}
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#C41E3A]" />
            <h2 className="text-lg font-bold text-gray-800">
              {isEditing ? '编辑题目' : '添加题目'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-5">
          {/* Question Type */}
          <div className="space-y-2">
            <Label>题型</Label>
            <RadioGroup
              value={type}
              onValueChange={(v) => {
                setType(v as QuestionType);
                setCorrectAnswer('');
                setErrors({});
              }}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="单选" id="type-single" />
                <Label htmlFor="type-single" className="cursor-pointer font-normal">单选题</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="多选" id="type-multi" />
                <Label htmlFor="type-multi" className="cursor-pointer font-normal">多选题</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="判断" id="type-tf" />
                <Label htmlFor="type-tf" className="cursor-pointer font-normal">判断题</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="question-text">题目内容</Label>
            <Textarea
              id="question-text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="请输入题目内容..."
              rows={3}
              className={errors.question ? 'border-red-500' : ''}
            />
            <AnimatePresence>
              {errors.question && (
                <motion.p
                  className="text-red-500 text-xs"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.question}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Choice Options - only for 单选/多选 */}
          <AnimatePresence>
            {(type === '单选' || type === '多选') && (
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Label>选项</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(['A', 'B', 'C', 'D'] as const).map((key) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#C41E3A] text-white text-xs flex items-center justify-center font-bold">
                          {key}
                        </span>
                        <Input
                          value={options[key]}
                          onChange={(e) => handleOptionChange(key, e.target.value)}
                          placeholder={`选项${key}`}
                          className={`flex-1 ${errors[key] ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {errors[key] && (
                        <p className="text-red-500 text-xs ml-8">{errors[key]}</p>
                      )}
                    </div>
                  ))}
                </div>
                {/* Option E */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#C41E3A] text-white text-xs flex items-center justify-center font-bold">
                      E
                    </span>
                    <Input
                      value={options.E}
                      onChange={(e) => handleOptionChange('E', e.target.value)}
                      placeholder="选项E（可选）"
                      className="flex-1"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Correct Answer */}
          <div className="space-y-2">
            <Label>正确答案</Label>

            {/* Single Choice - Radio */}
            {type === '单选' && (
              <RadioGroup
                value={correctAnswer}
                onValueChange={setCorrectAnswer}
                className="flex gap-4 flex-wrap"
              >
                {(['A', 'B', 'C', 'D', 'E'] as const)
                  .filter((key) => key !== 'E' || options.E.trim())
                  .map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <RadioGroupItem value={key} id={`answer-${key}`} />
                      <Label htmlFor={`answer-${key}`} className="cursor-pointer font-normal">{key}</Label>
                    </div>
                  ))}
              </RadioGroup>
            )}

            {/* Multi Choice - Checkboxes */}
            {type === '多选' && (
              <div className="flex gap-4 flex-wrap">
                {(['A', 'B', 'C', 'D', 'E'] as const)
                  .filter((key) => key !== 'E' || options.E.trim())
                  .map((key) => {
                    const selected = correctAnswer.split(',').map((s) => s.trim()).filter(Boolean).includes(key);
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <Checkbox
                          id={`manswer-${key}`}
                          checked={selected}
                          onCheckedChange={() => handleMultiAnswerToggle(key)}
                        />
                        <Label htmlFor={`manswer-${key}`} className="cursor-pointer font-normal">{key}</Label>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* True/False - Radio */}
            {type === '判断' && (
              <RadioGroup
                value={correctAnswer}
                onValueChange={setCorrectAnswer}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="A" id="tf-a" />
                  <Label htmlFor="tf-a" className="cursor-pointer font-normal">对（正确）</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="B" id="tf-b" />
                  <Label htmlFor="tf-b" className="cursor-pointer font-normal">错（错误）</Label>
                </div>
              </RadioGroup>
            )}

            <AnimatePresence>
              {errors.correctAnswer && (
                <motion.p
                  className="text-red-500 text-xs"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.correctAnswer}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <Label htmlFor="explanation">答案解析</Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="请输入答案解析（可选）..."
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#C41E3A] hover:bg-[#A01830] text-white"
          >
            <Save className="w-4 h-4 mr-1" />
            保存
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
