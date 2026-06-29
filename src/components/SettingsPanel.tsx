import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Upload, Download, Plus, Trash2, Edit2, Pencil, Keyboard,
  Palette, Library, ImageIcon, XCircle, Check, AlertTriangle, FileSpreadsheet,
  Users, Target, Type, Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Question, Participant } from '@/types/quiz';
import type { AppSettings } from '@/hooks/useSettings';
import { FONT_OPTIONS, GRADIENT_PRESETS } from '@/hooks/useSettings';
import { parseExcelFile, exportQuestionsToExcel, exportTemplateToExcel } from '@/utils/excelParser';
import QuestionEditor from './QuestionEditor';
import ParticipantManager from './ParticipantManager';
import { cn } from '@/lib/utils';

interface ShortcutConfig {
  key: keyof AppSettings['shortcuts'];
  label: string;
  defaultValue: string;
}

const SHORTCUT_CONFIGS: ShortcutConfig[] = [
  { key: 'showAnswer', label: '显示答案', defaultValue: 'Space' },
  { key: 'nextQuestion', label: '下一题', defaultValue: 'ArrowRight' },
  { key: 'prevQuestion', label: '上一题', defaultValue: 'ArrowLeft' },
  { key: 'randomPick', label: '随机抽题', defaultValue: 'KeyR' },
  { key: 'drawPerson', label: '抽取人员', defaultValue: 'KeyD' },
  { key: 'toggleSettings', label: '打开/关闭设置', defaultValue: 'Escape' },
];

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AppSettings;
  questions: Question[];
  participants: Participant[];
  onSettingsChange: (partial: Partial<AppSettings>) => void;
  onShortcutChange: (key: keyof AppSettings['shortcuts'], value: string) => void;
  onResetSettings: () => void;
  onResetShortcuts: () => void;
  onQuestionsChange: (questions: Question[]) => void;
  onImportQuestions: (questions: Omit<Question, 'id'>[], mode: 'append' | 'replace') => void;
  onClearQuestions: () => void;
  onParticipantAdd: (name: string) => void;
  onParticipantDelete: (id: number) => void;
  onParticipantClear: () => void;
  onParticipantImport: (names: string[]) => void;
  onParticipantResetDrawn: () => void;
}

export default function SettingsPanel({
  open,
  onOpenChange,
  settings,
  questions,
  participants,
  onSettingsChange,
  onShortcutChange,
  onResetSettings,
  onResetShortcuts,
  onQuestionsChange,
  onImportQuestions,
  onClearQuestions,
  onParticipantAdd,
  onParticipantDelete,
  onParticipantClear,
  onParticipantImport,
  onParticipantResetDrawn,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState('questions');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [recordingShortcut, setRecordingShortcut] = useState<string | null>(null);
  const [shortcutConflicts, setShortcutConflicts] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Import/Export
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImportSuccess('');
    try {
      const imported = await parseExcelFile(file);
      if (imported.length === 0) {
        setImportError('未检测到有效题目');
        return;
      }
      onImportQuestions(imported, settings.importMode);
      setImportSuccess(`成功导入 ${imported.length} 道题目（${settings.importMode === 'append' ? '追加' : '替换'}）`);
      setTimeout(() => setImportSuccess(''), 3000);
    } catch (err) {
      setImportError((err as Error).message);
    }
    e.target.value = '';
  };

  const handleExport = () => {
    if (questions.length === 0) {
      setImportError('没有题目可导出');
      return;
    }
    const blob = exportQuestionsToExcel(questions);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `纪法知识题库_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    setImportSuccess('导出成功');
    setTimeout(() => setImportSuccess(''), 3000);
  };

  const handleDownloadTemplate = () => {
    const blob = exportTemplateToExcel();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '纪法知识题库模板.xlsx';
    a.click();
    URL.revokeObjectURL(url);
    setImportSuccess('模板下载成功');
    setTimeout(() => setImportSuccess(''), 3000);
  };

  // Question CRUD
  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setShowEditor(true);
  };

  const handleEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setShowEditor(true);
  };

  const handleDeleteQuestion = (id: number) => {
    if (!confirm('确定要删除这道题吗？')) return;
    const filtered = questions.filter((q) => q.id !== id);
    onQuestionsChange(filtered);
  };

  const handleSaveQuestion = (data: Omit<Question, 'id'>) => {
    if (editingQuestion) {
      const updated = questions.map((q) =>
        q.id === editingQuestion.id ? { ...data, id: q.id } : q
      );
      onQuestionsChange(updated);
    } else {
      const newId = questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1;
      const newQuestion: Question = { ...data, id: newId };
      onQuestionsChange([...questions, newQuestion]);
    }
    setShowEditor(false);
    setEditingQuestion(null);
  };

  const handleClearAllQuestions = () => {
    if (confirm('确定要清空所有题目吗？此操作不可撤销。')) {
      onClearQuestions();
    }
  };

  // Drag & drop for background image
  const handleBgDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        onSettingsChange({ backgroundImage: ev.target?.result as string, backgroundType: 'image' });
      };
      reader.readAsDataURL(file);
    }
  }, [onSettingsChange]);

  const handleBgDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onSettingsChange({ backgroundImage: ev.target?.result as string, backgroundType: 'image' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearBackgroundImage = () => {
    onSettingsChange({ backgroundImage: null, backgroundType: 'color' });
  };

  // Shortcut recording
  useEffect(() => {
    if (!recordingShortcut) return;

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      let keyStr = e.code;
      if (e.code.startsWith('Key') || e.code.startsWith('Digit') || e.code.startsWith('Numpad')) {
        keyStr = e.code;
      } else if (e.code === 'Space') {
        keyStr = 'Space';
      } else if (e.code.startsWith('Arrow')) {
        keyStr = e.code;
      } else {
        keyStr = e.code;
      }

      const modifiers: string[] = [];
      if (e.ctrlKey && e.code !== 'ControlLeft' && e.code !== 'ControlRight') modifiers.push('Ctrl');
      if (e.altKey && e.code !== 'AltLeft' && e.code !== 'AltRight') modifiers.push('Alt');
      if (e.shiftKey && e.code !== 'ShiftLeft' && e.code !== 'ShiftRight') modifiers.push('Shift');

      const finalKey = modifiers.length > 0 ? `${modifiers.join('+')}+${keyStr}` : keyStr;

      onShortcutChange(recordingShortcut as keyof AppSettings['shortcuts'], finalKey);
      setRecordingShortcut(null);
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [recordingShortcut, onShortcutChange]);

  // Check shortcut conflicts
  useEffect(() => {
    const values = Object.values(settings.shortcuts);
    const seen = new Set<string>();
    const conflicts = new Set<string>();
    for (const v of values) {
      if (seen.has(v)) {
        conflicts.add(v);
      }
      seen.add(v);
    }
    setShortcutConflicts(conflicts);
  }, [settings.shortcuts]);

  const formatShortcutDisplay = (key: string): string => {
    return key
      .replace('ArrowUp', '↑')
      .replace('ArrowDown', '↓')
      .replace('ArrowLeft', '←')
      .replace('ArrowRight', '→')
      .replace('Space', '空格')
      .replace('Key', '')
      .replace('Digit', '')
      .replace('Numpad', '小键盘')
      .replace('Ctrl', 'Ctrl')
      .replace('Alt', 'Alt')
      .replace('Shift', 'Shift');
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[55] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Panel */}
          <motion.div
            className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-white/50"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-[#C41E3A]" />
                设置
              </h2>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 pt-3 border-b border-gray-100">
                <TabsList className="w-full">
                  <TabsTrigger value="questions" className="flex-1 flex items-center gap-1.5">
                    <Library className="w-4 h-4" />
                    题库管理
                  </TabsTrigger>
                  <TabsTrigger value="participants" className="flex-1 flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    人员管理
                  </TabsTrigger>
                  <TabsTrigger value="appearance" className="flex-1 flex items-center gap-1.5">
                    <Palette className="w-4 h-4" />
                    外观设置
                  </TabsTrigger>
                  <TabsTrigger value="shortcuts" className="flex-1 flex items-center gap-1.5">
                    <Keyboard className="w-4 h-4" />
                    快捷键
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab 1: 题库管理 */}
              <TabsContent value="questions" className="flex-1 overflow-hidden flex flex-col mt-0">
                <div className="px-6 py-3 border-b border-gray-50 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-sm text-gray-500">
                    共 <span className="font-bold text-gray-800">{questions.length}</span> 道题目
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleImportClick}
                      className="text-xs"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" />
                      导入Excel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleExport}
                      className="text-xs"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      导出Excel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownloadTemplate}
                      className="text-xs"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
                      下载模板
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddQuestion}
                      className="bg-[#C41E3A] hover:bg-[#A01830] text-white text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      添加题目
                    </Button>
                  </div>
                </div>

                {/* Import Mode */}
                <div className="px-6 py-2 border-b border-gray-50 bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 font-medium">导入模式：</span>
                    <RadioGroup
                      value={settings.importMode}
                      onValueChange={(v) => onSettingsChange({ importMode: v as 'append' | 'replace' })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem value="append" id="mode-append" />
                        <Label htmlFor="mode-append" className="text-xs cursor-pointer">追加</Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem value="replace" id="mode-replace" />
                        <Label htmlFor="mode-replace" className="text-xs cursor-pointer">替换</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Messages */}
                <AnimatePresence>
                  {importError && (
                    <motion.div
                      className="mx-6 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center gap-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {importError}
                    </motion.div>
                  )}
                  {importSuccess && (
                    <motion.div
                      className="mx-6 mt-2 p-2 bg-green-50 border border-green-200 rounded-lg text-green-600 text-xs flex items-center gap-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {importSuccess}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Question Table */}
                <ScrollArea className="flex-1 px-6 py-2">
                  {questions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Library className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm">暂无题目</p>
                      <p className="text-xs mt-1">点击"添加题目"或"导入Excel"添加</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">序号</TableHead>
                          <TableHead className="w-16">题型</TableHead>
                          <TableHead>题目</TableHead>
                          <TableHead className="w-24">答案</TableHead>
                          <TableHead className="w-20 text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {questions.map((q) => (
                          <TableRow key={q.id}>
                            <TableCell className="text-gray-500 text-xs">{q.id}</TableCell>
                            <TableCell>
                              <span className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                q.type === '单选' ? 'bg-blue-50 text-blue-600' :
                                q.type === '多选' ? 'bg-purple-50 text-purple-600' :
                                'bg-amber-50 text-amber-600'
                              )}>
                                {q.type}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate" title={q.question}>
                              {q.question}
                            </TableCell>
                            <TableCell className="text-xs font-medium text-[#C41E3A]">
                              {q.correctAnswer}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleEditQuestion(q)}
                                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  {questions.length > 0 && (
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 text-xs"
                        onClick={handleClearAllQuestions}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        清空所有题目
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Tab 2: 人员管理 */}
              <TabsContent value="participants" className="flex-1 overflow-hidden flex flex-col mt-0">
                <ParticipantManager
                  participants={participants}
                  onAdd={onParticipantAdd}
                  onDelete={onParticipantDelete}
                  onClear={onParticipantClear}
                  onImport={onParticipantImport}
                  onResetDrawn={onParticipantResetDrawn}
                />
              </TabsContent>

              {/* Tab 3: 外观设置 */}
              <TabsContent value="appearance" className="flex-1 overflow-y-auto mt-0 px-6 py-5 space-y-6">
                {/* Title */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-gray-400" />
                    首页标题
                  </Label>
                  <Input
                    value={settings.title}
                    onChange={(e) => onSettingsChange({ title: e.target.value })}
                    placeholder="输入首页标题..."
                  />
                </div>

                {/* Subtitle */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-gray-400" />
                    首页副标题
                  </Label>
                  <Input
                    value={settings.subtitle}
                    onChange={(e) => onSettingsChange({ subtitle: e.target.value })}
                    placeholder="输入首页副标题..."
                  />
                </div>

                {/* Draw Toggle */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-gray-400" />
                      人员抽取功能
                    </Label>
                    <Switch
                      checked={settings.drawEnabled}
                      onCheckedChange={(v) => onSettingsChange({ drawEnabled: v })}
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    开启后将在首页和答题页面显示"抽取人员"按钮
                  </p>
                </div>

                {/* Show Explanation Toggle */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-gray-400" />
                      显示答案解析
                    </Label>
                    <Switch
                      checked={settings.showExplanation}
                      onCheckedChange={(v) => onSettingsChange({ showExplanation: v })}
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    关闭后，点击"显示答案"时将只显示正确答案，不显示解析内容
                  </p>
                </div>

                {/* Font Family */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">字体</Label>
                  <Select
                    value={settings.fontFamily}
                    onValueChange={(v) => onSettingsChange({ fontFamily: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span style={{ fontFamily: opt.value === 'system' ? undefined : opt.value }}>
                            {opt.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Font Size */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">字体大小</Label>
                    <span className="text-sm text-gray-500 font-mono">{settings.fontSize}px</span>
                  </div>
                  <Slider
                    value={[settings.fontSize]}
                    onValueChange={([v]) => onSettingsChange({ fontSize: v })}
                    min={12}
                    max={24}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>12px</span>
                    <span>24px</span>
                  </div>
                </div>

                {/* Background Type */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">背景类型</Label>
                  <div className="flex gap-2">
                    {(['color', 'gradient', 'image'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => onSettingsChange({ backgroundType: type })}
                        className={cn(
                          'flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all',
                          settings.backgroundType === type
                            ? 'border-[#C41E3A] bg-red-50 text-[#C41E3A]'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        )}
                      >
                        {type === 'color' && '纯色'}
                        {type === 'gradient' && '渐变'}
                        {type === 'image' && '图片'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Picker */}
                <AnimatePresence mode="wait">
                  {settings.backgroundType === 'color' && (
                    <motion.div
                      className="space-y-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Label className="text-sm font-medium">背景颜色</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.backgroundColor}
                          onChange={(e) => onSettingsChange({ backgroundColor: e.target.value })}
                          className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                        />
                        <Input
                          value={settings.backgroundColor}
                          onChange={(e) => onSettingsChange({ backgroundColor: e.target.value })}
                          className="flex-1 font-mono"
                        />
                      </div>
                    </motion.div>
                  )}

                  {settings.backgroundType === 'gradient' && (
                    <motion.div
                      className="space-y-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Label className="text-sm font-medium">选择渐变</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {GRADIENT_PRESETS.map((preset) => (
                          <button
                            key={preset.value}
                            onClick={() => onSettingsChange({ backgroundGradient: preset.value })}
                            className={cn(
                              'relative h-16 rounded-lg border-2 transition-all overflow-hidden',
                              settings.backgroundGradient === preset.value
                                ? 'border-[#C41E3A] shadow-md'
                                : 'border-gray-200 hover:border-gray-300'
                            )}
                          >
                            <div
                              className="absolute inset-0"
                              style={{ background: preset.value }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 bg-white/30 backdrop-blur-sm">
                              {preset.label}
                            </span>
                            {settings.backgroundGradient === preset.value && (
                              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#C41E3A] flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {settings.backgroundType === 'image' && (
                    <motion.div
                      className="space-y-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Label className="text-sm font-medium">背景图片</Label>
                      <input
                        ref={bgFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleBgFileChange}
                      />
                      <div
                        className={cn(
                          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
                          'hover:border-[#C41E3A] hover:bg-red-50/50'
                        )}
                        onClick={() => bgFileInputRef.current?.click()}
                        onDrop={handleBgDrop}
                        onDragOver={handleBgDragOver}
                      >
                        {settings.backgroundImage ? (
                          <div className="relative">
                            <img
                              src={settings.backgroundImage}
                              alt="Background preview"
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                clearBackgroundImage();
                              }}
                              className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                            <ImageIcon className="w-8 h-8" />
                            <p className="text-sm">点击上传或拖拽图片到此处</p>
                            <p className="text-xs text-gray-300">支持 JPG、PNG、GIF 格式</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Preview */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">预览效果</Label>
                  <div
                    className="h-20 rounded-xl border-2 border-gray-200 flex items-center justify-center transition-all"
                    style={{
                      fontFamily: settings.fontFamily === 'system' ? undefined : settings.fontFamily,
                      fontSize: `${settings.fontSize}px`,
                      ...(settings.backgroundType === 'color'
                        ? { background: settings.backgroundColor }
                        : settings.backgroundType === 'gradient'
                        ? { background: settings.backgroundGradient }
                        : settings.backgroundImage
                        ? { backgroundImage: `url(${settings.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : { background: settings.backgroundColor }
                      ),
                    }}
                  >
                    <span className="text-gray-600 font-medium drop-shadow-sm">
                      {settings.title || '纪法知识快问快答'}
                    </span>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 4: 快捷键设置 */}
              <TabsContent value="shortcuts" className="flex-1 overflow-y-auto mt-0 px-6 py-5">
                <div className="space-y-3">
                  {SHORTCUT_CONFIGS.map((config) => {
                    const currentValue = settings.shortcuts[config.key];
                    const isRecording = recordingShortcut === config.key;
                    const hasConflict = shortcutConflicts.has(currentValue);

                    return (
                      <div
                        key={config.key}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-xl border transition-all',
                          isRecording ? 'border-[#C41E3A] bg-red-50' : 'border-gray-100 bg-gray-50/50'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700">{config.label}</span>
                          {hasConflict && !isRecording && (
                            <span className="text-xs text-red-500 flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              冲突
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <kbd
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-mono font-bold border min-w-[80px] text-center',
                              isRecording
                                ? 'bg-[#C41E3A] text-white border-[#C41E3A] animate-pulse'
                                : 'bg-white text-gray-700 border-gray-200'
                            )}
                          >
                            {isRecording ? '请按键...' : formatShortcutDisplay(currentValue)}
                          </kbd>
                          <Button
                            size="sm"
                            variant={isRecording ? 'default' : 'outline'}
                            className={isRecording ? 'bg-[#C41E3A] hover:bg-[#A01830] text-white' : ''}
                            onClick={() => setRecordingShortcut(isRecording ? null : config.key)}
                          >
                            {isRecording ? '取消' : '修改'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onResetShortcuts}
                  >
                    恢复默认快捷键
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => {
                  if (confirm('确定要恢复所有默认设置吗？题库数据不会被重置。')) {
                    onResetSettings();
                  }
                }}
              >
                恢复全部默认
              </Button>
              <Button
                size="sm"
                onClick={() => onOpenChange(false)}
                className="bg-[#C41E3A] hover:bg-[#A01830] text-white"
              >
                完成
              </Button>
            </div>
          </motion.div>

          {/* Question Editor Modal */}
          <AnimatePresence>
            {showEditor && (
              <QuestionEditor
                question={editingQuestion}
                onSave={handleSaveQuestion}
                onCancel={() => {
                  setShowEditor(false);
                  setEditingQuestion(null);
                }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
