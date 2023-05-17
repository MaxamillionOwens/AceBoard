import React, { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import logo from "public/logo.png";
import styles from "styles/SessionReport.module.css";
import Logo from "components/Logo";
import { useRouter } from "next/router";
import { API_GET_GAME_RESULTS, API_GET_LESSON, API_LOGOUT, LogoutRequest } from "types/api";
import { Lesson } from "types/Lesson";
import { Question } from "types/Question";

const downloadFile = ({ data, fileName, fileType }: { data: any; fileName: string; fileType: string }) => {
    const blob = new Blob([data], { type: fileType });

    const a = document.createElement("a");
    a.download = fileName;
    a.href = window.URL.createObjectURL(blob);
    const clickEvt = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true
    });
    a.dispatchEvent(clickEvt);
    a.remove();
};

function exportToCsv(data: any, filename: string) {
    let headers = ["Question,Attempt,Correct Answer,All Answers,Total"];

    let usersCsv = sessionReport.reduce((acc: any, q: any) => {
        const { question_title, attempt_num, correct_answer, answers, total } = q;
        acc.push([question_title, attempt_num, correct_answer, answers, total].join(","));
        return acc;
    }, []);

    downloadFile({
        data: [...headers, ...usersCsv].join("\n"),
        fileName: filename,
        fileType: "text/csv"
    });
}

function getQuestionFromId(id: string, lesson: Lesson): Question | null {
    lesson.questions.forEach((q) => {
        if (q.id == id) return q;
    });
    return null;
}

type ReportQuestion = {
    question_title: string;
    attempt_num: number;
    correct_answer: string;
    answers: string[];
    total: string;
};

const sessionReport: ReportQuestion[] = [];

export default function SessionReport() {
    const router = useRouter();

    const [lesson, setLesson] = useState<Lesson>();
    const [results, setResults] = useState<any>();

    const logout = async () => {
        await API_LOGOUT({ authToken: sessionStorage.getItem("authToken")! });

        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("myCode");
        router.push("/InstructorLogin");
    };

    useEffect(() => {
        async function start() {
            if (sessionStorage.getItem("authToken") == null || sessionStorage.getItem("myCode") == null) {
                alert("Invalid session");
                router.push("/");
            }

            const getLesson = await API_GET_LESSON({ authToken: sessionStorage.getItem("authToken")! });
            console.log(getLesson);
            if (!getLesson.error) {
                setLesson(getLesson.lesson);
            } else {
                alert(getLesson.errorMsg);
                router.push("/");
            }

            const getResults = await API_GET_GAME_RESULTS({
                authToken: sessionStorage.getItem("authToken")!,
                code: sessionStorage.getItem("myCode")!
            });
            console.log(getResults);
            if (!getResults.error) {
                setResults(getResults.allResults);
            } else {
                alert(getLesson.errorMsg);
                router.push("/");
            }
        }

        start();
    }, []);

    if (lesson == undefined || results == undefined) {
        return (
            <>
                <Head>
                    <title>Session Report - AceBoard</title>
                    <meta name="description" content="AceBoard Session Report" />
                </Head>

                <div>Loading...</div>
            </>
        );
    }

    let rows: JSX.Element[] = [];
    let question_num = 0;
    Object.keys(results).forEach((questionId: any) => {
        const attempts = results[questionId];

        for (let i = 0; i < attempts.length; i++) {
            let new_question: ReportQuestion = {
                question_title: lesson.questions[question_num].title,
                attempt_num: i + 1,
                correct_answer: lesson.questions[question_num].correctAns,
                answers: [],
                total: ""
            };
            const answerCount = new Map<string, number>();
            let totalAnswers = 0;

            const attempt = attempts[i];
            attempt.forEach((answerArray: any) => {
                const answer = answerArray[1];

                if (answerCount.has(answer)) {
                    answerCount.set(answer, answerCount.get(answer)! + 1);
                } else answerCount.set(answer, 1);

                totalAnswers++;
            });

            let num_correct: any;
            if (answerCount.has(lesson.questions[question_num].correctAns)) {
                num_correct = answerCount.get(lesson.questions[question_num].correctAns);
            } else {
                num_correct = 0;
            }
            let incorrect_string = "";
            for (let j = 0; j < lesson.questions[question_num].answers.length; j++) {
                let wrong_num: any = 0;
                if (lesson.questions[question_num].answers[j] != lesson.questions[question_num].correctAns) {
                    if (answerCount.has(lesson.questions[question_num].answers[j])) {
                        wrong_num = answerCount.get(lesson.questions[question_num].answers[j]);
                    } else {
                        wrong_num = 0;
                    }
                    incorrect_string +=
                        lesson.questions[question_num].answers[j] +
                        ": " +
                        wrong_num +
                        "(" +
                        ((wrong_num / totalAnswers) * 100).toFixed(2) +
                        "%)\n";
                }
                let answer_text = lesson.questions[question_num].answers[j];
                if (answer_text == lesson.questions[question_num].correctAns) {
                    answer_text += ": #" + num_correct;
                } else {
                    answer_text += ": #" + wrong_num;
                }
                new_question.answers[j] = answer_text;
            }

            new_question.total += "Total: #" + totalAnswers;

            sessionReport.push(new_question);

            rows.push(
                <tr>
                    <td>{lesson.questions[question_num].title}</td>
                    <td>#{i + 1}</td>
                    <td>
                        {lesson.questions[question_num].correctAns}: {num_correct} (
                        {((num_correct / totalAnswers) * 100).toFixed(2)}%)
                    </td>
                    <td>{incorrect_string}</td>
                    <td>{totalAnswers}</td>
                </tr>
            );
        }
        question_num++;
    });

    return (
        <>
            <Head>
                <title>Session Report - AceBoard</title>
                <meta name="description" content="AceBoard Session Report" />
            </Head>

            <div id="main" style={{ width: "70%" }}>
                <Logo />
                <div id="content">
                    <div className="flex header" style={{ flexDirection: "row", marginBottom: "10px" }}>
                        <button
                            style={{ marginRight: "auto" }}
                            onClick={(e) => {
                                e.preventDefault;
                                let filename = prompt("Please Enter Filename (leave blank for default)");
                                if (filename == "" || filename == null) {
                                    let date = new Date();
                                    filename = date.getMonth() + 1 + "-" + date.getDate() + "-" + date.getFullYear();
                                    filename +=
                                        "_" + date.getHours() + "-" + date.getMinutes() + "-" + date.getSeconds();
                                }
                                exportToCsv(results, filename);
                            }}
                        >
                            <strong>Download</strong>
                        </button>
                        <span style={{ fontSize: 24 }}>
                            <strong>Session Report</strong>
                        </span>
                        <button style={{ marginLeft: "auto" }} onClick={() => logout()}>
                            <strong>Log out</strong>
                        </button>
                    </div>
                    <div>
                        <table className={styles.table}>
                            <tbody>
                                <tr>
                                    <th>Question</th>
                                    <th>Attempt</th>
                                    <th>Correct</th>
                                    <th>Incorrect</th>
                                    <th>Total</th>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className={styles.tableContainer}>
                        <table id="mainTable" className={styles.table}>
                            <tbody className={styles.tbody}>{rows}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
