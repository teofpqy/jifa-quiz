export type QuestionType = '单选' | '多选' | '判断';

export interface Question {
  id: number;
  type: QuestionType;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    E?: string;
  } | null;
  correctAnswer: string; // 多选用逗号分隔如 "A,B,C"
  explanation: string;
}

export interface Participant {
  id: number;
  name: string;
  drawn: boolean;
}

export type ScreenState = 'welcome' | 'quiz';

export interface AppState {
  title: string;
  subtitle: string;
  drawEnabled: boolean;
  importMode: 'append' | 'replace';
}
