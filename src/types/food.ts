export interface Food {
  id: number;
  name: string;
  kind: string;
  spice: number;
  fill: number;
  warm: number;
  ease: number;
  comfort: number;
  light: number;
  themes: string[];
  match?: number;
}

export interface AnswerEffect {
  set?: Record<string, number | string>;
  add?: Record<string, number>;
}

export interface Question {
  q: string;
  a: [string, AnswerEffect][];
}

export interface AppState {
  hunger: number;
  energy: number;
  spice: number;
  comfort: number;
  time: number;
  warm: number;
  social: string;
  ageGroup?: string;
  [key: string]: number | string | undefined;
}

export interface Verdict {
  title: string;
  line: string;
}

export interface ThemeItem {
  key: string;
  label: string;
  desc: string;
}
