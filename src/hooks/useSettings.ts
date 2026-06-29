import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'jifa-quiz-settings-v4';

export interface AppSettings {
  title: string;
  subtitle: string;
  drawEnabled: boolean;
  importMode: 'append' | 'replace';
  showExplanation: boolean;
  fontFamily: string;
  fontSize: number;
  backgroundType: 'color' | 'image' | 'gradient';
  backgroundColor: string;
  backgroundImage: string | null;
  backgroundGradient: string;
  shortcuts: {
    showAnswer: string;
    nextQuestion: string;
    prevQuestion: string;
    randomPick: string;
    toggleSettings: string;
    drawPerson: string;
  };
}

export const FONT_OPTIONS = [
  { value: 'system', label: '系统默认' },
  { value: 'SimSun, serif', label: '宋体' },
  { value: 'SimHei, sans-serif', label: '黑体' },
  { value: 'KaiTi, serif', label: '楷体' },
  { value: 'Microsoft YaHei, sans-serif', label: '微软雅黑' },
  { value: 'FangSong, serif', label: '仿宋' },
];

export const GRADIENT_PRESETS = [
  { value: 'linear-gradient(135deg, #FAFAF7 0%, #F5F0EB 100%)', label: '暖白渐变' },
  { value: 'linear-gradient(135deg, #E8F4F8 0%, #D4E8ED 100%)', label: '淡蓝渐变' },
  { value: 'linear-gradient(135deg, #F0F7F0 0%, #E0F0E0 100%)', label: '淡绿渐变' },
  { value: 'linear-gradient(135deg, #FFF5F5 0%, #FFE8E8 100%)', label: '淡红渐变' },
  { value: 'linear-gradient(135deg, #F8F0FF 0%, #EDE0FF 100%)', label: '淡紫渐变' },
  { value: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)', label: '暖黄渐变' },
];

const DEFAULT_SETTINGS: AppSettings = {
  title: '纪法知识快问快答',
  subtitle: '学纪知纪明纪守纪 · 筑牢廉洁自律防线',
  drawEnabled: true,
  importMode: 'append',
  showExplanation: true,
  fontFamily: 'system',
  fontSize: 16,
  backgroundType: 'color',
  backgroundColor: '#FAFAF7',
  backgroundImage: null,
  backgroundGradient: GRADIENT_PRESETS[0].value,
  shortcuts: {
    showAnswer: 'Space',
    nextQuestion: 'ArrowRight',
    prevQuestion: 'ArrowLeft',
    randomPick: 'KeyR',
    toggleSettings: 'Escape',
    drawPerson: 'KeyD',
  },
};

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        shortcuts: { ...DEFAULT_SETTINGS.shortcuts, ...parsed.shortcuts },
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
    applySettingsToDOM(settings);
  }, [settings]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateShortcut = useCallback((key: keyof AppSettings['shortcuts'], value: string) => {
    setSettings((prev) => ({
      ...prev,
      shortcuts: { ...prev.shortcuts, [key]: value },
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS });
  }, []);

  const resetShortcuts = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      shortcuts: { ...DEFAULT_SETTINGS.shortcuts },
    }));
  }, []);

  return {
    settings,
    updateSettings,
    updateShortcut,
    resetSettings,
    resetShortcuts,
  };
}

export function getBackgroundStyle(settings: AppSettings): React.CSSProperties {
  const style: React.CSSProperties = {};

  switch (settings.backgroundType) {
    case 'color':
      style.background = settings.backgroundColor;
      break;
    case 'gradient':
      style.background = settings.backgroundGradient;
      break;
    case 'image':
      if (settings.backgroundImage) {
        style.backgroundImage = `url(${settings.backgroundImage})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
        style.backgroundRepeat = 'no-repeat';
      } else {
        style.background = settings.backgroundColor;
      }
      break;
  }

  return style;
}

export function getFontStyle(settings: AppSettings): React.CSSProperties {
  return {
    fontFamily: settings.fontFamily === 'system'
      ? "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif"
      : settings.fontFamily,
    fontSize: `${settings.fontSize}px`,
  };
}

function applySettingsToDOM(settings: AppSettings) {
  const root = document.documentElement;
  root.style.setProperty('--quiz-font-family', settings.fontFamily === 'system'
    ? "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    : settings.fontFamily
  );
  root.style.setProperty('--quiz-font-size', `${settings.fontSize}px`);
}
