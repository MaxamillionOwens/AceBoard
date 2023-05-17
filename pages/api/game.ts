import { NextApiRequest, NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import { Server as NetServer } from "http";
import { Lesson } from "types/Lesson";
import { v4 as uuid } from "uuid";
import { Socket } from "net";
import { Question } from "types/Question";
import { readFileSync } from "fs";
import { join } from "path";
import * as API from "types/api";

type NextApiResponseServerIO = NextApiResponse & {
    socket: Socket & {
        server: NetServer;
    };
};

type User = string;
type Answer = string;
type PollResult = Map<User, Answer>;
type PollResultSet = PollResult[];

type Session = {
    socketServer: SocketIOServer;
    lesson: Lesson;
    pollResultSets: Map<Question, PollResultSet>;
    currentQuestion: Question | "WAITING";
    instructorAuthToken: string;
    open: boolean;
};

export const config = {
    api: {
        bodyParser: {
            sizeLimit: "1000mb",
            timeout: 10000
        },
        responseLimit: false
    }
};

// Read instructor login from config file
let adminUsername = "admin",
    adminPassword = "password";
try {
    const obj = JSON.parse(readFileSync(join(process.cwd(), "credentials.json"), "utf-8"));
    if (
        obj["username"] != undefined &&
        obj["password"] != undefined &&
        obj["username"] != "" &&
        obj["password"] != ""
    ) {
        adminUsername = obj["username"];
        adminPassword = obj["password"];
        console.log("Successfully read login credentials from credentials.json");
    } else {
        console.log("Username or password missing from credentials.json. Defaulting to 'admin' and 'password'");
    }
} catch (e) {
    console.log("Unable to read login credentials from credentials.json. Defaulting to 'admin' and 'password'");
}

const instructorAuthTokens = new Array<string>();
const sessions = new Map<string, Session>(); // Map key = session code
const lessonStorage = new Map<string, Lesson>(); // key = instructor auth token

const usedSessionCodes: string[] = [];
function generateSessionCode(): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let sessionCode = "";
    for (let i = 0; i < 6; i++) {
        sessionCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    if (usedSessionCodes.includes(sessionCode)) {
        return generateSessionCode();
    } else {
        usedSessionCodes.push(sessionCode);
        return sessionCode;
    }
}

function serializeMap(map: Map<string, string>): string {
    return JSON.stringify(Array.from(map.entries()));
}

//
// API HANDLERS
//

function LOGIN(data: API.LoginRequest): API.LoginResponse {
    if (data.username == adminUsername && data.password == adminPassword) {
        const authToken = uuid();
        instructorAuthTokens.push(authToken);
        console.log(`${authToken} logged in`);

        return { success: true, authToken: authToken };
    }
    return { success: false, authToken: "" };
}

function LOGOUT(data: API.LogoutRequest): API.LogoutResponse {
    if (instructorAuthTokens.includes(data.authToken)) {
        instructorAuthTokens.splice(instructorAuthTokens.indexOf(data.authToken), 1);
        console.log(`${data.authToken} logged out.`);

        // Delete any sessions and socket servers that exist for that instructor
        sessions.forEach((session, key) => {
            if (session.instructorAuthToken == data.authToken) {
                sessions.delete(key);

                console.log(`Destroyed session ${key} because ${data.authToken} logged out.`);
            }
        });

        return { success: true };
    }
    return { success: false };
}

function CREATE_NEW_GAME(res: NextApiResponseServerIO, data: API.CreateNewGameRequest): API.CreateNewGameResponse {
    if (instructorAuthTokens.includes(data.authToken)) {
        const code = generateSessionCode();

        if (code == null) {
            console.log("Failed to create new session code");
            return { code: "", error: true, errorMsg: "Failed to create new session code" };
        }

        const httpServer: NetServer = res.socket.server as any;
        const server = new SocketIOServer(httpServer, {
            path: `/api/game/${code}`
        });

        lessonStorage.set(data.authToken, data.lesson);

        const session: Session = {
            socketServer: server,
            instructorAuthToken: data.authToken,
            lesson: data.lesson,
            pollResultSets: new Map<Question, PollResultSet>(),
            currentQuestion: "WAITING",
            open: false
        };

        data.lesson.questions.forEach((question) => {
            const set: PollResultSet = [];
            session.pollResultSets.set(question, set);
        });

        sessions.set(code, session);
        console.log(`New Socket.io server for session ${code} with authToken ${data.authToken}...`);

        return { code: code, error: false };
    }
    return { code: "", error: true, errorMsg: "Invalid session" };
}

function VALIDATE_SESSION(data: API.ValidateSessionRequest): API.ValidateSessionResponse {
    const valid = instructorAuthTokens.includes(data.authToken);

    if (valid) return { valid: true };
    return { valid: false };
}

function SET_LESSON(data: API.SetLessonRequest): API.SetLessonResponse {
    if (instructorAuthTokens.includes(data.authToken)) {
        lessonStorage.set(data.authToken, data.lesson);
        return { error: false };
    }
    return { error: true, errorMsg: "Invalid session" };
}

function GET_LESSON(data: API.GetLessonRequest): API.GetLessonResponse {
    // Check if the instructor is valid
    if (instructorAuthTokens.includes(data.authToken)) {
        if (lessonStorage.has(data.authToken)) {
            return { lesson: lessonStorage.get(data.authToken)!, error: false };
        }
        return { lesson: { name: "", questions: [] }, error: true, errorMsg: "No lesson found" };
    }

    return { lesson: { name: "", questions: [] }, error: true, errorMsg: "Invalid session" };
}

function GET_CURRENT_QUESTION(data: API.GetCurrentQuestionRequest): API.GetCurrentQuestionResponse {
    if (sessions.has(data.code)) {
        const { currentQuestion } = sessions.get(data.code)!;
        return { question: currentQuestion, isOpen: sessions.get(data.code)!.open, error: false };
    }
    return { question: "WAITING", isOpen: false, error: true, errorMsg: "No session with that code exists" };
}

function CHANGE_QUESTION(data: API.ChangeQuestionRequest): API.ChangeQuestionResponse {
    // Check if the instructor is valid
    if (sessions.has(data.code) && sessions.get(data.code)!.instructorAuthToken == data.authToken) {
        const session = sessions.get(data.code)!;

        session.currentQuestion = session.lesson.questions[data.newQuestionIndex];

        session.open = false;

        session.socketServer.emit("CHANGE_QUESTION", session.lesson.questions[data.newQuestionIndex]);

        const pollResults = session.pollResultSets.get(session.currentQuestion)!;
        if (pollResults.length == 0) {
            //pollResults.push(new Map<User, Answer>());
            return { lastPollResultSerialMap: serializeMap(new Map<User, Answer>()), error: false };
        } else {
            return { lastPollResultSerialMap: serializeMap(pollResults[pollResults.length - 1]), error: false };
        }
    }
    return {
        lastPollResultSerialMap: "",
        error: true,
        errorMsg: "Session code and auth token do not match"
    };
}

function OPEN_QUESTION(data: API.OpenQuestionRequest): API.OpenQuestionResponse {
    if (sessions.has(data.code) && sessions.get(data.code)!.instructorAuthToken == data.authToken) {
        const session = sessions.get(data.code)!;

        if (session.currentQuestion == "WAITING")
            return { error: true, errorMsg: "Current question: WAITING. Can't open WAITING" };

        session.open = true;
        session.socketServer.emit("OPEN_QUESTION", session.currentQuestion);

        const pollResults = session.pollResultSets.get(session.currentQuestion)!;
        pollResults.push(new Map<User, Answer>());

        return { error: false };
    }
    return { error: true, errorMsg: "Session code and auth token do not match" };
}

function CLOSE_QUESTION(data: API.CloseQuestionRequest): API.CloseQuestionResponse {
    if (sessions.has(data.code) && sessions.get(data.code)!.instructorAuthToken == data.authToken) {
        const session = sessions.get(data.code)!;
        session.open = true;

        session.socketServer.emit("CLOSE_QUESTION", session.currentQuestion);

        return { error: false };
    }
    return { error: true, errorMsg: "Session code and auth token do not match" };
}

function STUDENT_ANSWER(data: API.StudentAnswerRequest): API.StudentAnswerResponse {
    if (sessions.has(data.code)) {
        const session = sessions.get(data.code)!;
        if (session.currentQuestion != "WAITING" && session.open) {
            const pollSet = session.pollResultSets.get(session.currentQuestion)!;
            const poll = pollSet[pollSet.length - 1];
            poll.set(data.socketId, data.answer);

            session.socketServer.emit("ANSWERED", {
                user: data.socketId,
                questionId: data.questionId,
                answer: data.answer
            });

            return { error: false };
        } else {
            return { error: true, errorMsg: "Question is not open yet" };
        }
    }
    return { error: true, errorMsg: "No session with that code exists" };
}

function END_GAME(data: API.EndGameRequest): API.EndGameResponse {
    if (sessions.has(data.code) && sessions.get(data.code)!.instructorAuthToken == data.authToken) {
        const session = sessions.get(data.code)!;
        session.open = false;
        session.socketServer.emit("END_GAME");

        return { error: false };
    }
    return { error: true, errorMsg: "Session code and auth token do not match" };
}

function GET_GAME_RESULTS(data: API.GetGameResultsRequest): API.GetGameResultsResponse {
    if (sessions.has(data.code) && sessions.get(data.code)!.instructorAuthToken == data.authToken) {
        const session = sessions.get(data.code)!;

        const object: any = {};

        session.pollResultSets.forEach((pollResultSet, question) => {
            const set: any[] = [];

            pollResultSet.forEach((pollResult) => {
                set.push(Array.from(pollResult.entries()));
            });

            object[question.id] = set;
        });

        return { allResults: object, error: false };
    }
    return { allResults: {}, error: true, errorMsg: "Session code and auth token do not match" };
}

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
    if (req.body != null) {
        const body = req.body;

        if (body.command == undefined) res.status(400).json({ error: "No command specified" });

        switch (body.command) {
            case "LOGIN":
                res.status(200).json(LOGIN(body));
                break;
            case "LOGOUT":
                res.status(200).json(LOGOUT(body));
                break;
            case "CREATE_NEW_GAME":
                res.status(200).json(CREATE_NEW_GAME(res, body));
                break;
            case "VALIDATE_SESSION":
                res.status(200).json(VALIDATE_SESSION(body));
                break;
            case "SET_LESSON":
                res.status(200).json(SET_LESSON(body));
                break;
            case "GET_LESSON":
                res.status(200).json(GET_LESSON(body));
                break;
            case "GET_CURRENT_QUESTION":
                res.status(200).json(GET_CURRENT_QUESTION(body));
                break;
            case "CHANGE_QUESTION":
                res.status(200).json(CHANGE_QUESTION(body));
                break;
            case "OPEN_QUESTION":
                res.status(200).json(OPEN_QUESTION(body));
                break;
            case "CLOSE_QUESTION":
                res.status(200).json(CLOSE_QUESTION(body));
                break;
            case "STUDENT_ANSWER":
                res.status(200).json(STUDENT_ANSWER(body));
                break;
            case "END_GAME":
                res.status(200).json(END_GAME(body));
                break;
            case "GET_GAME_RESULTS":
                res.status(200).json(GET_GAME_RESULTS(body));
                break;
        }
    } else {
        res.status(400).json({ error: "No body was sent in request" });
    }
}
