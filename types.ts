
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
  PHOTO_SETUP = 'PHOTO_SETUP',
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
  photo?: string;
}
