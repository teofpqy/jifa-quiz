import initSqlJs from 'sql.js';
import type { Question, QuestionType, Participant } from '@/types/quiz';

const DB_STORAGE_KEY = 'jifa-quiz-db-v4';

let dbInstance: DatabaseManager | null = null;

export class DatabaseManager {
  private db: any = null;
  private SQL: any = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    this.SQL = await initSqlJs({
      locateFile: (_file: string) => `./sql-wasm.wasm`,
    });

    // Try to load existing database from localStorage
    const stored = localStorage.getItem(DB_STORAGE_KEY);
    if (stored) {
      try {
        const binary = this.base64ToUint8Array(stored);
        this.db = new this.SQL.Database(binary);
      } catch {
        this.db = new this.SQL.Database();
      }
    } else {
      this.db = new this.SQL.Database();
    }

    this.createTables();
    this.migrateFromV3();
    this.saveToStorage();
    this.initialized = true;
  }

  private createTables(): void {
    // Questions table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('单选','多选','判断')),
        question TEXT NOT NULL,
        optionA TEXT,
        optionB TEXT,
        optionC TEXT,
        optionD TEXT,
        optionE TEXT,
        correctAnswer TEXT NOT NULL,
        explanation TEXT,
        createdAt INTEGER DEFAULT (strftime('%s','now'))
      )
    `);

    // Participants table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        drawn INTEGER DEFAULT 0,
        createdAt INTEGER DEFAULT (strftime('%s','now'))
      )
    `);

    // Settings table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);
  }

  private migrateFromV3(): void {
    // Check if we need to migrate from v3 localStorage format
    try {
      const oldQuestions = localStorage.getItem('jifa-quiz-questions');
      if (oldQuestions) {
        const parsed = JSON.parse(oldQuestions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if questions table is empty
          const result = this.db.exec('SELECT COUNT(*) as count FROM questions');
          const count = result[0]?.values[0]?.[0] as number || 0;
          if (count === 0) {
            // Migrate old questions
            for (const q of parsed) {
              let type: QuestionType = '单选';
              if (q.type === '填空') {
                type = '判断'; // Convert 填空 to 判断 as closest equivalent
              } else if (q.type === '选择') {
                type = '单选';
              }

              const options = q.options;
              this.db.run(
                `INSERT INTO questions (type, question, optionA, optionB, optionC, optionD, optionE, correctAnswer, explanation)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  type,
                  q.question || '',
                  options?.A || '',
                  options?.B || '',
                  options?.C || '',
                  options?.D || '',
                  options?.E || '',
                  q.correctAnswer || '',
                  q.explanation || '',
                ]
              );
            }
          }
        }
        // Remove old key to prevent re-migration
        localStorage.removeItem('jifa-quiz-questions');
      }

      // Migrate old settings
      const oldSettings = localStorage.getItem('jifa-quiz-settings');
      if (oldSettings) {
        const parsed = JSON.parse(oldSettings);
        const existing = this.getSetting('shortcuts');
        if (!existing && parsed.shortcuts) {
          // Migrate shortcuts with updated defaults
          const migratedShortcuts = {
            showAnswer: parsed.shortcuts.showAnswer || 'Space',
            nextQuestion: parsed.shortcuts.nextQuestion || 'ArrowRight',
            prevQuestion: parsed.shortcuts.prevQuestion || 'ArrowLeft',
            randomPick: parsed.shortcuts.randomPick || 'KeyR',
            toggleSettings: parsed.shortcuts.toggleSettings || 'Escape',
            drawPerson: 'KeyD',
          };
          this.setSetting('shortcuts', JSON.stringify(migratedShortcuts));
        }
        localStorage.removeItem('jifa-quiz-settings');
      }
    } catch {
      // Ignore migration errors
    }
  }

  saveToStorage(): void {
    try {
      const binary = this.db.export();
      const base64 = this.uint8ArrayToBase64(binary);
      localStorage.setItem(DB_STORAGE_KEY, base64);
    } catch {
      // Ignore storage errors (e.g., quota exceeded)
    }
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i]);
    }
    return btoa(binaryString);
  }

  // ===== Questions =====

  getAllQuestions(): Question[] {
    const result = this.db.exec('SELECT * FROM questions ORDER BY id');
    if (!result.length) return [];

    const columns = result[0].columns;
    const rows = result[0].values;

    return rows.map((row: unknown[]) => this.rowToQuestion(columns, row));
  }

  private rowToQuestion(columns: string[], row: any[]): Question {
    const get = (name: string) => row[columns.indexOf(name)];

    const type = get('type') as QuestionType;
    const options = type === '判断'
      ? { A: '对', B: '错', C: '', D: '' }
      : { A: get('optionA') || '', B: get('optionB') || '', C: get('optionC') || '', D: get('optionD') || '', E: get('optionE') || '' };

    return {
      id: get('id') as number,
      type,
      question: (get('question') as string) || '',
      options: type === '判断' ? null : options,
      correctAnswer: (get('correctAnswer') as string) || '',
      explanation: (get('explanation') as string) || '',
    };
  }

  addQuestion(q: Omit<Question, 'id'>): number {
    const options = q.options;
    this.db.run(
      `INSERT INTO questions (type, question, optionA, optionB, optionC, optionD, optionE, correctAnswer, explanation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        q.type,
        q.question,
        options?.A || '',
        options?.B || '',
        options?.C || '',
        options?.D || '',
        options?.E || '',
        q.correctAnswer,
        q.explanation,
      ]
    );
    this.saveToStorage();
    const result = this.db.exec('SELECT last_insert_rowid() as id');
    return result[0]?.values[0]?.[0] as number;
  }

  updateQuestion(q: Question): void {
    const options = q.options;
    this.db.run(
      `UPDATE questions SET type=?, question=?, optionA=?, optionB=?, optionC=?, optionD=?, optionE=?, correctAnswer=?, explanation=?
       WHERE id=?`,
      [
        q.type,
        q.question,
        options?.A || '',
        options?.B || '',
        options?.C || '',
        options?.D || '',
        options?.E || '',
        q.correctAnswer,
        q.explanation,
        q.id,
      ]
    );
    this.saveToStorage();
  }

  deleteQuestion(id: number): void {
    this.db.run('DELETE FROM questions WHERE id=?', [id]);
    this.saveToStorage();
  }

  clearQuestions(): void {
    this.db.run('DELETE FROM questions');
    this.db.run('DELETE FROM sqlite_sequence WHERE name="questions"');
    this.saveToStorage();
  }

  importQuestions(questions: Omit<Question, 'id'>[], mode: 'append' | 'replace'): void {
    if (mode === 'replace') {
      this.clearQuestions();
    }

    for (const q of questions) {
      const options = q.options;
      this.db.run(
        `INSERT INTO questions (type, question, optionA, optionB, optionC, optionD, optionE, correctAnswer, explanation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          q.type,
          q.question,
          options?.A || '',
          options?.B || '',
          options?.C || '',
          options?.D || '',
          options?.E || '',
          q.correctAnswer,
          q.explanation,
        ]
      );
    }
    this.saveToStorage();
  }

  getQuestionCount(): number {
    const result = this.db.exec('SELECT COUNT(*) as count FROM questions');
    if (!result.length) return 0;
    return result[0].values[0][0] as number;
  }

  // ===== Participants =====

  getAllParticipants(): Participant[] {
    const result = this.db.exec('SELECT * FROM participants ORDER BY id');
    if (!result.length) return [];

    const columns = result[0].columns;
    const rows = result[0].values;

    return rows.map((row: unknown[]) => ({
      id: row[columns.indexOf('id')] as number,
      name: (row[columns.indexOf('name')] as string) || '',
      drawn: (row[columns.indexOf('drawn')] as number) === 1,
    }));
  }

  addParticipant(name: string): number {
    try {
      this.db.run('INSERT INTO participants (name, drawn) VALUES (?, 0)', [name]);
      this.saveToStorage();
      const result = this.db.exec('SELECT last_insert_rowid() as id');
      return result[0]?.values[0]?.[0] as number;
    } catch {
      // UNIQUE constraint violation
      return -1;
    }
  }

  deleteParticipant(id: number): void {
    this.db.run('DELETE FROM participants WHERE id=?', [id]);
    this.saveToStorage();
  }

  clearParticipants(): void {
    this.db.run('DELETE FROM participants');
    this.db.run('DELETE FROM sqlite_sequence WHERE name="participants"');
    this.saveToStorage();
  }

  markDrawn(id: number): void {
    this.db.run('UPDATE participants SET drawn=1 WHERE id=?', [id]);
    this.saveToStorage();
  }

  resetAllDrawn(): void {
    this.db.run('UPDATE participants SET drawn=0');
    this.saveToStorage();
  }

  getAvailableParticipants(): Participant[] {
    return this.getAllParticipants().filter((p) => !p.drawn);
  }

  importParticipants(names: string[]): void {
    for (const name of names) {
      const trimmed = name.trim();
      if (trimmed) {
        try {
          this.db.run('INSERT OR IGNORE INTO participants (name, drawn) VALUES (?, 0)', [trimmed]);
        } catch {
          // ignore
        }
      }
    }
    this.saveToStorage();
  }

  // ===== Settings =====

  getSetting(key: string): string | null {
    try {
      const result = this.db.exec('SELECT value FROM settings WHERE key=?', [key]);
      if (result.length && result[0].values.length) {
        return result[0].values[0][0] as string;
      }
    } catch {
      // ignore
    }
    return null;
  }

  setSetting(key: string, value: string): void {
    this.db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
    this.saveToStorage();
  }

  getSettings(): Record<string, string> {
    const result: Record<string, string> = {};
    try {
      const dbResult = this.db.exec('SELECT key, value FROM settings');
      if (dbResult.length) {
        for (const row of dbResult[0].values) {
          result[row[0] as string] = row[1] as string;
        }
      }
    } catch {
      // ignore
    }
    return result;
  }
}

export async function getDatabase(): Promise<DatabaseManager> {
  if (!dbInstance) {
    dbInstance = new DatabaseManager();
    await dbInstance.init();
  }
  return dbInstance;
}

export function resetDatabase(): void {
  dbInstance = null;
  localStorage.removeItem(DB_STORAGE_KEY);
}
