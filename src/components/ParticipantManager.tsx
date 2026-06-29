import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Download, Plus, Trash2, Users, AlertTriangle, Check,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Participant } from '@/types/quiz';

interface ParticipantManagerProps {
  participants: Participant[];
  onAdd: (name: string) => void;
  onDelete: (id: number) => void;
  onClear: () => void;
  onImport: (names: string[]) => void;
  onResetDrawn: () => void;
}

export default function ParticipantManager({
  participants,
  onAdd,
  onDelete,
  onClear,
  onImport,
  onResetDrawn,
}: ParticipantManagerProps) {
  const [newName, setNewName] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim());
    setNewName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImportSuccess('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        if (!text) {
          setImportError('文件内容为空');
          return;
        }
        // Parse: one name per line, or comma-separated
        const names = text
          .split(/[\n\r,]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        if (names.length === 0) {
          setImportError('未检测到有效姓名');
          return;
        }

        onImport(names);
        setImportSuccess(`成功导入 ${names.length} 人`);
        setTimeout(() => setImportSuccess(''), 3000);
      } catch {
        setImportError('解析文件失败');
      }
    };
    reader.onerror = () => {
      setImportError('读取文件失败');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    if (participants.length === 0) {
      setImportError('没有人员可导出');
      return;
    }
    const text = participants.map((p) => p.name).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `人员列表_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setImportSuccess('导出成功');
    setTimeout(() => setImportSuccess(''), 3000);
  };

  const handleClearAll = () => {
    if (confirm('确定要清空所有人员吗？此操作不可撤销。')) {
      onClear();
    }
  };

  const handleResetDrawn = () => {
    if (confirm('确定要重置所有人员的抽取状态吗？')) {
      onResetDrawn();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-gray-50 flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm text-gray-500">
          共 <span className="font-bold text-gray-800">{participants.length}</span> 人
          {' · '}
          已抽 <span className="font-bold text-gray-500">{participants.filter((p) => p.drawn).length}</span> 人
        </span>
        <div className="flex gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv,.xlsx,.xls"
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
            导入名单
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            className="text-xs"
            disabled={participants.length === 0}
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            导出名单
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetDrawn}
            className="text-xs"
            disabled={!participants.some((p) => p.drawn)}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            重置状态
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearAll}
            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
            disabled={participants.length === 0}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            清空
          </Button>
        </div>
      </div>

      {/* Add participant */}
      <div className="px-6 py-3 border-b border-gray-50">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入姓名，按回车添加..."
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="bg-[#C41E3A] hover:bg-[#A01830] text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            添加
          </Button>
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

      {/* Table */}
      <ScrollArea className="flex-1 px-6 py-2">
        {participants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Users className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">暂无人员</p>
            <p className="text-xs mt-1">在上方输入姓名添加，或导入名单</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">序号</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead className="w-20">状态</TableHead>
                <TableHead className="w-16 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((p, idx) => (
                <TableRow key={p.id} className={p.drawn ? 'opacity-50' : ''}>
                  <TableCell className="text-gray-500 text-xs">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.drawn
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-green-50 text-green-600'
                      }`}
                    >
                      {p.drawn ? '已抽取' : '未抽取'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => onDelete(p.id)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ScrollArea>
    </div>
  );
}
