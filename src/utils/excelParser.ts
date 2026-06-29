import * as XLSX from 'xlsx';
import type { Question, QuestionType } from '@/types/quiz';

/**
 * Parse question type string to normalized QuestionType.
 */
function parseQuestionType(typeStr: string): QuestionType | null {
  const normalized = String(typeStr || '').trim();
  if (normalized.includes('单选') || normalized === '选择') return '单选';
  if (normalized.includes('多选')) return '多选';
  if (normalized.includes('判断')) return '判断';
  return null;
}

/**
 * Parse correct answer based on question type.
 */
function parseCorrectAnswer(answerStr: string, type: QuestionType): string {
  const normalized = String(answerStr || '').trim();
  if (type === '判断') {
    // Map various truthy/falsy values
    const lower = normalized.toLowerCase();
    if (lower === '对' || lower === '√' || lower === '正确' || lower === 'yes' || lower === 'true' || lower === '1') return 'A';
    if (lower === '错' || lower === '×' || lower === 'x' || lower === '错误' || lower === 'no' || lower === 'false' || lower === '0') return 'B';
    return normalized;
  }
  // For 单选 and 多选, return as-is (comma-separated for 多选)
  return normalized;
}

/**
 * Parse an Excel file and convert to Question array.
 * Expected columns: 序号(optional), 题型, 题干/题目, 选项A, 选项B, 选项C, 选项D, 选项E, 答案, 解析
 */
export function parseExcelFile(file: File): Promise<Question[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        if (jsonData.length < 2) {
          reject(new Error('Excel文件格式不正确，至少需要包含表头和一行数据'));
          return;
        }

        // Detect header row
        const headerRow = jsonData[0];
        const colMap = mapColumns(headerRow);

        if (colMap.type === -1 || colMap.question === -1) {
          reject(new Error('Excel格式错误：缺少必要的列（题型、题目）'));
          return;
        }

        const questions: Question[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length < 2) continue;

          const type = parseQuestionType(String(row[colMap.type] || ''));
          if (!type) continue;

          const questionText = String(row[colMap.question] || '').trim();
          if (!questionText) continue;

          const options = type !== '判断' ? {
            A: colMap.optionA >= 0 ? String(row[colMap.optionA] || '').trim() : '',
            B: colMap.optionB >= 0 ? String(row[colMap.optionB] || '').trim() : '',
            C: colMap.optionC >= 0 ? String(row[colMap.optionC] || '').trim() : '',
            D: colMap.optionD >= 0 ? String(row[colMap.optionD] || '').trim() : '',
            E: colMap.optionE >= 0 ? String(row[colMap.optionE] || '').trim() : undefined,
          } : null;

          // Remove empty E option
          if (options && !options.E) {
            delete options.E;
          }

          const answerCol = colMap.answer >= 0 ? colMap.answer : (colMap.optionA >= 0 ? colMap.optionA + 5 : 0);
          const correctAnswer = parseCorrectAnswer(String(row[answerCol] || ''), type);

          const explanationCol = colMap.explanation >= 0 ? colMap.explanation : -1;
          const explanation = explanationCol >= 0 ? String(row[explanationCol] || '').trim() : '';

          questions.push({
            id: questions.length + 1,
            type,
            question: questionText,
            options,
            correctAnswer,
            explanation,
          });
        }

        resolve(questions);
      } catch (error) {
        reject(new Error('解析Excel文件失败：' + (error as Error).message));
      }
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsArrayBuffer(file);
  });
}

interface ColumnMap {
  type: number;
  question: number;
  optionA: number;
  optionB: number;
  optionC: number;
  optionD: number;
  optionE: number;
  answer: number;
  explanation: number;
}

function mapColumns(headers: string[]): ColumnMap {
  const map: ColumnMap = {
    type: -1, question: -1, optionA: -1, optionB: -1,
    optionC: -1, optionD: -1, optionE: -1, answer: -1, explanation: -1,
  };

  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || '').trim().toLowerCase();
    if (h.includes('题型') || h === 'type') map.type = i;
    else if ((h.includes('题') && (h.includes('目') || h.includes('干'))) || h === 'question' || h === '题目') map.question = i;
    else if (h.includes('选项a') || h.includes('a') || h === 'a选项' || h === 'option_a') map.optionA = i;
    else if (h.includes('选项b') || h.includes('b') || h === 'b选项' || h === 'option_b') map.optionB = i;
    else if (h.includes('选项c') || h.includes('c') || h === 'c选项' || h === 'option_c') map.optionC = i;
    else if (h.includes('选项d') || h.includes('d') || h === 'd选项' || h === 'option_d') map.optionD = i;
    else if (h.includes('选项e') || h.includes('e') || h === 'e选项' || h === 'option_e') map.optionE = i;
    else if (h.includes('答案') || h === 'answer' || h === 'correct') map.answer = i;
    else if (h.includes('解析') || h === 'explanation' || h === 'explain') map.explanation = i;
  }

  // If no explicit mapping found, fall back to positional
  if (map.type === -1 && headers.length >= 8) {
    // Assume: 题型(0), 题目(1), 选项A(2), 选项B(3), 选项C(4), 选项D(5), 选项E(6), 答案(7), 解析(8)
    map.type = 0;
    map.question = 1;
    map.optionA = 2;
    map.optionB = 3;
    map.optionC = 4;
    map.optionD = 5;
    map.optionE = 6;
    map.answer = 7;
    map.explanation = 8;
  }

  return map;
}

/**
 * Export a template Excel with headers and sample data.
 */
export function exportTemplateToExcel(): Blob {
  const headers = ['题型', '题干', '选项A', '选项B', '选项C', '选项D', '选项E', '答案', '解析'];
  const samples: string[][] = [
    ['单选', '中国共产党纪律处分条例规定，党员受到警告处分的，（ ）内不得在党内提升职务。', '六个月', '一年', '一年半', '两年', '', 'B', '根据《中国共产党纪律处分条例》第十条规定...'],
    ['多选', '以下属于党的纪律处分的有（ ）。', '警告', '严重警告', '撤销党内职务', '留党察看', '开除党籍', 'A,B,C,D,E', '根据《中国共产党纪律处分条例》第八条规定...'],
    ['判断', '党员受到开除党籍处分，五年内不得重新入党。', '', '', '', '', '', 'A', '根据《中国共产党纪律处分条例》第十三条规定，正确。A=对，B=错'],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...samples]);

  worksheet['!cols'] = [
    { wch: 8 },   // 题型
    { wch: 50 },  // 题干
    { wch: 20 },  // 选项A
    { wch: 20 },  // 选项B
    { wch: 20 },  // 选项C
    { wch: 20 },  // 选项D
    { wch: 20 },  // 选项E
    { wch: 15 },  // 答案
    { wch: 60 },  // 解析
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '模板');

  const data = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Export questions array to an Excel file blob.
 */
export function exportQuestionsToExcel(questions: Question[]): Blob {
  const headers = ['题型', '题干', '选项A', '选项B', '选项C', '选项D', '选项E', '答案', '解析'];
  const rows: string[][] = [];

  for (const q of questions) {
    if (q.type === '单选' || q.type === '多选') {
      rows.push([
        q.type,
        q.question,
        q.options?.A ?? '',
        q.options?.B ?? '',
        q.options?.C ?? '',
        q.options?.D ?? '',
        q.options?.E ?? '',
        q.correctAnswer,
        q.explanation,
      ]);
    } else {
      // 判断题
      rows.push([
        q.type,
        q.question,
        '',
        '',
        '',
        '',
        '',
        q.correctAnswer,
        q.explanation,
      ]);
    }
  }

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 50 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 60 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '题库');

  const data = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
