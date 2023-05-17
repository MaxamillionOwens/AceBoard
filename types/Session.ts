import { Lesson } from "./Lesson";
import { Question } from "./Question";

export type SessionQuestionRound = {
    question: Question;
    playerResponses: { token: string; optionId: number }[];
};

export type Session = {
    code: string;
    playerTokens: string[];
    lesson: Lesson;
    rounds: SessionQuestionRound[];
};
