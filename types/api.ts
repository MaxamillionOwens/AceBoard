import { Lesson } from "types/Lesson";
import { Question } from "types/Question";

async function apiCall<ReqT, RespT>(command: string, req: ReqT): Promise<RespT> {
    const resp = await fetch(`/api/game`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ command, ...req })
    });

    const data = (await resp.json()) as RespT;
    return data;
}

export type LoginRequest = {
    username: string;
    password: string;
};

export type LoginResponse = {
    success: boolean;
    authToken: string;
};

export async function API_LOGIN(body: LoginRequest): Promise<LoginResponse> {
    return apiCall<LoginRequest, LoginResponse>("LOGIN", body);
}

export type LogoutRequest = {
    authToken: string;
};

export type LogoutResponse = {
    success: boolean;
};

export async function API_LOGOUT(body: LogoutRequest): Promise<LogoutResponse> {
    return apiCall<LogoutRequest, LogoutResponse>("LOGOUT", body);
}

export type CreateNewGameRequest = {
    lesson: Lesson;
    authToken: string;
};

export type CreateNewGameResponse = {
    code: string;
    error: boolean;
    errorMsg?: string;
};

export async function API_CREATE_NEW_GAME(body: CreateNewGameRequest): Promise<CreateNewGameResponse> {
    return apiCall<CreateNewGameRequest, CreateNewGameResponse>("CREATE_NEW_GAME", body);
}

export type ValidateSessionRequest = {
    authToken: string;
};

export type ValidateSessionResponse = {
    valid: boolean;
};

export async function API_VALIDATE_SESSION(body: ValidateSessionRequest): Promise<ValidateSessionResponse> {
    return apiCall<ValidateSessionRequest, ValidateSessionResponse>("VALIDATE_SESSION", body);
}

export type GetLessonRequest = {
    authToken: string;
};

export type GetLessonResponse = {
    lesson: Lesson;
    error: boolean;
    errorMsg?: string;
};

export async function API_GET_LESSON(body: GetLessonRequest): Promise<GetLessonResponse> {
    return apiCall<GetLessonRequest, GetLessonResponse>("GET_LESSON", body);
}

export type SetLessonRequest = {
    lesson: Lesson;
    authToken: string;
};

export type SetLessonResponse = {
    error: boolean;
    errorMsg?: string;
};

export async function API_SET_LESSON(body: SetLessonRequest): Promise<SetLessonResponse> {
    return apiCall<SetLessonRequest, SetLessonResponse>("SET_LESSON", body);
}

export type GetCurrentQuestionRequest = {
    code: string;
};

export type GetCurrentQuestionResponse = {
    question: Question | "WAITING";
    isOpen: boolean;
    error: boolean;
    errorMsg?: string;
};

export async function API_GET_CURRENT_QUESTION(body: GetCurrentQuestionRequest): Promise<GetCurrentQuestionResponse> {
    return apiCall<GetCurrentQuestionRequest, GetCurrentQuestionResponse>("GET_CURRENT_QUESTION", body);
}

export type ChangeQuestionRequest = {
    newQuestionIndex: number;
    code: string;
    authToken: string;
};

export type ChangeQuestionResponse = {
    lastPollResultSerialMap: string;
    error: boolean;
    errorMsg?: string;
};

export async function API_CHANGE_QUESTION(body: ChangeQuestionRequest): Promise<ChangeQuestionResponse> {
    return apiCall<ChangeQuestionRequest, ChangeQuestionResponse>("CHANGE_QUESTION", body);
}

export type OpenQuestionRequest = {
    code: string;
    authToken: string;
};

export type OpenQuestionResponse = {
    error: boolean;
    errorMsg?: string;
};

export async function API_OPEN_QUESTION(body: OpenQuestionRequest): Promise<OpenQuestionResponse> {
    return apiCall<OpenQuestionRequest, OpenQuestionResponse>("OPEN_QUESTION", body);
}

export type CloseQuestionRequest = {
    code: string;
    authToken: string;
};

export type CloseQuestionResponse = {
    error: boolean;
    errorMsg?: string;
};

export async function API_CLOSE_QUESTION(body: CloseQuestionRequest): Promise<CloseQuestionResponse> {
    return apiCall<CloseQuestionRequest, CloseQuestionResponse>("CLOSE_QUESTION", body);
}

export type StudentAnswerRequest = {
    code: string;
    socketId: string;
    questionId: string;
    answer: string;
};

export type StudentAnswerResponse = {
    error: boolean;
    errorMsg?: string;
};

export async function API_STUDENT_ANSWER(body: StudentAnswerRequest): Promise<StudentAnswerResponse> {
    return apiCall<StudentAnswerRequest, StudentAnswerResponse>("STUDENT_ANSWER", body);
}

export type EndGameRequest = {
    code: string;
    authToken: string;
};

export type EndGameResponse = {
    error: boolean;
    errorMsg?: string;
};

export async function API_END_GAME(body: EndGameRequest): Promise<EndGameResponse> {
    return apiCall<EndGameRequest, EndGameResponse>("END_GAME", body);
}

export type GetGameResultsRequest = {
    code: string;
    authToken: string;
};

export type GetGameResultsResponse = {
    allResults: any;
    error: boolean;
    errorMsg?: string;
};

export async function API_GET_GAME_RESULTS(body: GetGameResultsRequest): Promise<GetGameResultsResponse> {
    return apiCall<GetGameResultsRequest, GetGameResultsResponse>("GET_GAME_RESULTS", body);
}
