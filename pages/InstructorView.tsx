"use client";

import Head from "next/head";
import Image from "next/image";
import logo from "public/logo.png";
import styles from "styles/InstructorView.module.css";
import { useEffect, useMemo, useRef } from "react";
import useState from "react-usestateref";
import { useRouter } from "next/router";
import { Lesson } from "types/Lesson";
import { Question } from "types/Question";
import { connect, Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import Logo from "components/Logo";
import {
    API_CHANGE_QUESTION,
    API_CLOSE_QUESTION,
    API_END_GAME,
    API_GET_LESSON,
    API_OPEN_QUESTION,
    API_VALIDATE_SESSION
} from "types/api";

type User = string;
type Answer = string;

export default function InstructorView() {
    const router = useRouter();

    const [lesson, setLesson, lessonRef] = useState<Lesson>();
    const [currentQuestion, setCurrentQuestion, currentQuestionRef] = useState<Question | "WAITING">("WAITING");
    const [open, setOpen, openRef] = useState(false);
    const [answers, setAnswers, answersRef] = useState(new Map<User, Answer>());

    const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap>>();

    const getAnswerCount = (a: string) => {
        let total = 0;
        answers.forEach((answer, user) => {
            if (answer == a) total++;
        });
        return total;
    };

    const totalAnswers = useMemo(() => {
        let total = 0;

        if (currentQuestion != "WAITING") {
            answers.forEach(() => {
                total++;
            });
        }
        return total;
    }, [answers, currentQuestion]);

    // Authenticate, get the lesson data, and connect socket once on render
    useEffect(() => {
        const start = async () => {
            const authToken = sessionStorage.getItem("authToken");
            if (authToken == null) {
                alert("Invalid session");
                router.push("/");
                return;
            }

            const validateSession = await API_VALIDATE_SESSION({ authToken: authToken });
            if (validateSession.valid == false) {
                alert("Invalid session");
                router.push("/");
                return;
            }

            //This needs to stay below authToken : 20% fail rate if not
            const code = sessionStorage.getItem("myCode");
            if (code == null) {
                alert("Invalid session");
                router.push("/");
                return;
            }

            const getLesson = await API_GET_LESSON({ authToken: authToken });

            if (getLesson.error) {
                router.push("/");
            }

            console.log(getLesson);
            setLesson(getLesson.lesson);

            socketRef.current = connect(process.env.BASE_URL!, {
                path: `/api/game/${code}`
            });

            socketRef.current.on("connect", () => {
                console.log("SOCKET CONNECTED!", socketRef.current?.id);
            });

            socketRef.current.on("disconnect", () => {
                console.log("SOCKET DISCONNECTED");
            });

            socketRef.current.on("connect_error", () => {
                socketRef.current?.disconnect();
                alert("Error connecting to socket endpoint");
                router.push("/");
            });

            socketRef.current.on("ANSWERED", (data: { user: string; questionId: string; answer: string }) => {
                if (
                    currentQuestionRef.current != "WAITING" &&
                    data.questionId == currentQuestionRef.current.id &&
                    currentQuestionRef.current.answers.includes(data.answer)
                ) {
                    const newAnswerMap = new Map<User, Answer>(answersRef.current);
                    newAnswerMap.set(data.user, data.answer);
                    setAnswers(newAnswerMap);
                }
            });
        };

        start();
    }, []);

    const changeQuestion = async (q: Question) => {
        const data = await API_CHANGE_QUESTION({
            authToken: sessionStorage.getItem("authToken")!,
            code: sessionStorage.getItem("myCode")!,
            newQuestionIndex: lesson!.questions.indexOf(q)
        });
        console.log(data);

        if (!data.error) {
            setAnswers(new Map(JSON.parse(data.lastPollResultSerialMap)));

            setCurrentQuestion(q);

            setOpen(false);
        }
    };

    const openQuestion = async () => {
        const data = await API_OPEN_QUESTION({
            authToken: sessionStorage.getItem("authToken")!,
            code: sessionStorage.getItem("myCode")!
        });

        console.log(data);

        setOpen(true);
        setAnswers(new Map<User, Answer>());
    };

    const closeQuestion = async () => {
        const data = await API_CLOSE_QUESTION({
            authToken: sessionStorage.getItem("authToken")!,
            code: sessionStorage.getItem("myCode")!
        });

        console.log(data);

        setOpen(false);
    };

    const end = async () => {
        if (socketRef.current != undefined) socketRef.current.disconnect();

        // End game
        const data = await API_END_GAME({
            authToken: sessionStorage.getItem("authToken")!,
            code: sessionStorage.getItem("myCode")!
        });
        console.log(data);

        router.push("/SessionReport");
    };

    const colors = ["#f95513", "#45c4f7", "#29e54e", "#ad29e5", "#efec34", "#e031dd"];
    let colorIndex = colors.length;
    const getColor = () => {
        if (colorIndex == colors.length) colorIndex = 0;
        const i = colorIndex;
        colorIndex++;
        return colors[i];
    };

    if (lesson != undefined) {
        if (currentQuestion == "WAITING") {
            return (
                <>
                    <Head>
                        <title>{sessionStorage.getItem("myCode")} - AceBoard</title>
                        <meta name="description" content="AceBoard Instructor In-Game View" />
                    </Head>

                    <Logo style={{ marginBottom: "2em" }} />

                    <h1>Code: {sessionStorage.getItem("myCode")}</h1>

                    <button onClick={() => changeQuestion(lesson.questions[0])}>
                        <b>Start</b>
                    </button>
                </>
            );
        } else {
            let nextFinishButton = <></>;

            if (lesson.questions.indexOf(currentQuestion) == lesson.questions.length - 1) {
                nextFinishButton = (
                    <button className={styles.pollButton} onClick={end}>
                        <b>Finish</b>
                    </button>
                );
            } else {
                nextFinishButton = (
                    <button
                        className={styles.pollButton}
                        onClick={() => {
                            const i = lesson.questions.indexOf(currentQuestion);
                            changeQuestion(lesson.questions[i + 1]);
                        }}
                    >
                        <b>Next</b>
                    </button>
                );
            }

            return (
                <>
                    <Head>
                        <title>{sessionStorage.getItem("myCode")} - AceBoard</title>
                        <meta name="description" content="AceBoard Instructor In-Game View" />
                    </Head>

                    <Logo style={{ marginBottom: "2em" }} />

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={styles.questionImage} src={currentQuestion.imageUrl} alt="Sample question image" />

                    <div className={styles.graph}>
                        <p>Total Answers: {totalAnswers}</p>
                        {currentQuestion.answers.map((answer) => (
                            <div key={answer}>
                                {`"${answer}" - ${(
                                    (getAnswerCount(answer) / (totalAnswers == 0 ? 1 : totalAnswers)) *
                                    100
                                ).toFixed(1)}%`}

                                {currentQuestion.correctAns == answer && " (Correct)"}

                                <div
                                    className={styles.graphBar}
                                    style={{
                                        width: `${
                                            (getAnswerCount(answer)! / (totalAnswers == 0 ? 1 : totalAnswers)) * 100
                                        }%`,
                                        backgroundColor: getColor()
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    <div className={styles.sessionCode}>
                        <b>Session Code: {sessionStorage.getItem("myCode")}</b>
                    </div>

                    <div className={styles.sidebar}>
                        <div className="flex" style={{ color: "#cce3f1", marginTop: "0.25em", marginBottom: "0.25em" }}>
                            Change to Question
                        </div>
                        {lesson.questions.map((q) => (
                            <a key={q.id} href="#" className={styles.questionLink} onClick={() => changeQuestion(q)}>
                                {q.title}
                            </a>
                        ))}
                    </div>

                    <div className={styles.pollControls}>
                        {open ? (
                            <button className={styles.pollButton} onClick={closeQuestion}>
                                <b>Close</b>
                            </button>
                        ) : (
                            <button className={styles.pollButton} onClick={openQuestion}>
                                <b>Open</b>
                            </button>
                        )}
                        {nextFinishButton}
                    </div>
                </>
            );
        }
    } else {
        return <p>Loading...</p>;
    }
}
