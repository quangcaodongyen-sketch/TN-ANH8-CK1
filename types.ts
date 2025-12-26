
export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  unit: number;
  topic: string;
}

export enum GameStatus {
  START = 'START',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}

export interface EncouragementMessage {
  text: string;
  type: 'success' | 'cheer' | 'keepgoing';
}

export interface UserInfo {
  name: string;
  className: string;
  gender: 'boy' | 'girl';
  avatarUrl?: string;
}
