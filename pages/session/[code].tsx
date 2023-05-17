"use client";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Socket, connect } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { Question } from "types/Question";
import logo from "public/logo.png";
import styles from "styles/StudentView.module.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Logo from "components/Logo";
import {
    API_GET_CURRENT_QUESTION,
    API_STUDENT_ANSWER,
    GetCurrentQuestionRequest,
    GetCurrentQuestionResponse,
    StudentAnswerRequest,
    StudentAnswerResponse
} from "types/api";

export default function Session() {
    const router = useRouter();

    const [question, setQuestion] = useState<Question | "WAITING">();
    const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap>>();
    const [open, setOpen] = useState(false);

    /*
        https://stackoverflow.com/a/66910060
        
        When using useRouter() the { code } property will be
        undefined during pre-rendering, so we need to connect
        to the web socket after it has a value
    */
    useEffect(() => {
        if (router.query.code != undefined) {
            // connect to socket server
            const newSocket = connect(process.env.BASE_URL!, {
                path: `/api/game/${router.query.code}`
            });

            // log socket connection
            newSocket.on("connect", async () => {
                console.log("SOCKET CONNECTED!", newSocket.id);

                // Get current question
                const data = await API_GET_CURRENT_QUESTION({ code: router.query.code as string });

                if (!data.error) {
                    setQuestion(data.question);
                    setOpen(data.isOpen);
                }
            });

            newSocket.on("disconnect", () => {
                console.log("SOCKET DISCONNECTED");
            });

            newSocket.on("connect_error", () => {
                newSocket.disconnect();
                alert("Error connecting to socket endpoint, check session code");
                router.back();
            });

            newSocket.on("CHANGE_QUESTION", (q: Question) => {
                setQuestion(q);
                setOpen(false);
            });

            newSocket.on("OPEN_QUESTION", (q: Question) => {
                setOpen(true);
            });

            newSocket.on("CLOSE_QUESTION", (q: Question) => {
                setOpen(false);
            });

            newSocket.on("END_GAME", () => {
                setOpen(false);

                if (newSocket != undefined) newSocket.disconnect();
                alert("Game has ended.");

                router.push("/");
            });

            setSocket(newSocket);
        }
    }, []);

    const sendAnswer = async (answer: string) => {
        if (question === "WAITING") return;

        const data = await API_STUDENT_ANSWER({
            answer: answer,
            questionId: question!.id,
            code: router.query.code! as string,
            socketId: socket!.id
        });
        console.log(data);

        if (data.error == false)
            toast.success("Answer submitted", {
                position: toast.POSITION.TOP_CENTER,
                autoClose: 500
            });
    };

    if (socket == undefined || (socket != undefined && socket.connected == false)) {
        return (
            <>
                <Head>
                    <title>{router.query.code as string} - AceBoard</title>
                    <meta name="description" content="AceBoard In-Game View" />
                </Head>
                <p>Connecting...</p>
            </>
        );
    } else if (question == "WAITING") {
        return (
            <>
                <Head>
                    <title>{router.query.code as string} - AceBoard</title>
                    <meta name="description" content="AceBoard In-Game View" />
                </Head>
                <p>Waiting for teacher to start...</p>
            </>
        );
    } else if (question != undefined) {
        return (
            <>
                <Head>
                    <title>{router.query.code as string} - AceBoard</title>
                    <meta name="description" content="AceBoard In-Game View" />
                </Head>

                <ToastContainer />

                <div id="main" style={{ width: "70%" }}>
                    <div className="flex">
                        <Logo />

                        <Image className={styles.questionImage} src={question.imageUrl} alt={question.title} />

                        {open == true && (
                            <div className={styles.answerButton}>
                                <b>Pick an answer:</b>
                                {question.answers.map((answer) => (
                                    <button
                                        key={answer}
                                        onClick={() => sendAnswer(answer)}
                                        style={{ display: "block", margin: "10px auto" }}
                                    >
                                        {answer}
                                    </button>
                                ))}
                            </div>
                        )}
                        {open == false && <b>Question is closed for answering right now</b>}
                    </div>
                </div>
            </>
        );
    }
}
