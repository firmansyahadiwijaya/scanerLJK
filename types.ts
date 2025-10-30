
export enum AppState {
  UPLOAD_KEY,
  SET_SCORES,
  SCANNING,
}

export interface Scores {
  multipleChoice: number;
  complexMultipleChoice: number;
  essay: number;
}

export interface KeyAnswers {
  multipleChoice: { number: number; answer: string }[];
  complexMultipleChoice: { number: number; answers: string[] }[];
  essay: { number: number; keyPoints: string }[];
}

export interface GradedStudent {
  id: number;
  scores: {
    multipleChoiceScore: number;
    complexMultipleChoiceScore: number;
    essayScore: number;
    totalScore: number;
  };
}
