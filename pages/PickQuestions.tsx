"use client";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Lesson } from "types/Lesson";
import logo from "public/logo.png";
import styles from "styles/PickQuestions.module.css";
import QuestionSelector from "components/QuestionSelector";
import Logo from "components/Logo";
import { API_CREATE_NEW_GAME, API_GET_LESSON, API_LOGOUT, API_VALIDATE_SESSION } from "types/api";

export default function PickQuestions() {
    const router = useRouter();
    const [currentLesson, setCurrentLesson] = useState<Lesson>();
    const [checkedMap, setCheckedMap] = useState<Map<string, boolean>>();

    useEffect(() => {
        async function run() {
            // Check if login is valid
            if (sessionStorage.getItem("authToken") == null) {
                alert("Invalid session");
                router.push("/");
            } else {
                const data = await API_VALIDATE_SESSION({ authToken: sessionStorage.getItem("authToken")! });

                if (data.valid == false) {
                    alert("Invalid session");
                    router.push("/");
                }
            }

            const res = await API_GET_LESSON({ authToken: sessionStorage.getItem("authToken")! });
            if (res.error) alert(res.errorMsg);

            const lesson = res.lesson;

            const newCheckedMap = new Map<string, boolean>();
            lesson.questions.forEach((q) => {
                newCheckedMap.set(q.id, true);
            });

            setCurrentLesson(lesson);
            setCheckedMap(newCheckedMap);
        }

        run();
    }, []);

    const changeLesson = (l: Lesson) => {
        const newCheckedMap = new Map<string, boolean>();
        l.questions.forEach((q) => {
            newCheckedMap.set(q.id, true);
        });
        setCheckedMap(newCheckedMap);

        setCurrentLesson(l);
    };

    const submit = async () => {
        if (currentLesson != undefined && checkedMap != undefined) {
            const lesson: Lesson = {
                name: currentLesson.name,
                questions: currentLesson.questions.filter((q) => checkedMap.get(q.id) == true)
            };

            const data = await API_CREATE_NEW_GAME({ lesson: lesson, authToken: sessionStorage.getItem("authToken")! });

            if (data.error) {
                alert(data.errorMsg);
            } else {
                sessionStorage.setItem("myCode", data.code);
                router.push("/InstructorView");
            }
        }
    };

    const logout = async () => {
        await API_LOGOUT({ authToken: sessionStorage.getItem("authToken")! });

        sessionStorage.removeItem("authToken");
        router.push("/InstructorLogin");
    };

    return (
        <>
            <Head>
                <title>Pick Questions - AceBoard</title>
                <meta name="description" content="AceBoard Question Selector" />
            </Head>

            <div id="main" style={{ width: "70%" }}>
                <Logo />
                <div id="content">
                    <table className={styles.mainTable} style={{ width: "100%" }}>
                        <tbody>
                            <tr>
                                <td className={styles.td} colSpan={2}>
                                    <div className="flex" style={{ flexDirection: "row" }}>
                                        <button
                                            style={{ marginRight: "auto" }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                router.push("/CreateNewLesson");
                                            }}
                                        >
                                            Back
                                        </button>
                                        <span style={{ fontSize: 24 }}>Pick Questions</span>
                                        <button style={{ marginLeft: "auto" }} onClick={() => logout()}>
                                            Log out
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                {/* <td className={styles.td} style={{ width: "20%" }}>
                                    <div>
                                        <div>Select Lesson</div>
                                        <select
                                            onChange={(e) => {
                                                const i = parseInt(e.target.value);
                                                changeLesson(lessons[i]);
                                            }}
                                        >
                                            {lessons.map((l) => (
                                                <option key={l.name} value={lessons.indexOf(l)}>
                                                    {l.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </td> */}
                                <td className={styles.td}>
                                    <div>
                                        <div className="flex" style={{ flexDirection: "row" }}>
                                            <button
                                                style={{ marginRight: "1em" }}
                                                onClick={() => {
                                                    const newCheckedMap = new Map(checkedMap);
                                                    newCheckedMap.forEach((value, key) => {
                                                        newCheckedMap.set(key, true);
                                                    });
                                                    setCheckedMap(newCheckedMap);
                                                }}
                                            >
                                                Select All
                                            </button>

                                            <button
                                                onClick={() => {
                                                    const newCheckedMap = new Map(checkedMap);
                                                    newCheckedMap.forEach((value, key) => {
                                                        newCheckedMap.set(key, false);
                                                    });
                                                    setCheckedMap(newCheckedMap);
                                                }}
                                            >
                                                Select None
                                            </button>
                                        </div>
                                        <div className={styles.questionsList}>
                                            {currentLesson != undefined &&
                                                currentLesson.questions.map((q) => (
                                                    <QuestionSelector
                                                        key={q.title}
                                                        question={q}
                                                        checked={checkedMap!.get(q.id)!}
                                                        setChecked={(value) => {
                                                            const newCheckedMap = new Map<string, boolean>(checkedMap);
                                                            newCheckedMap.set(q.id, value);
                                                            setCheckedMap(newCheckedMap);
                                                        }}
                                                    />
                                                ))}
                                            {currentLesson == undefined && (
                                                <div className="flex">
                                                    <b>Loading...</b>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2} style={{ paddingTop: "16px" }}>
                                    <div className="flex">
                                        <button disabled={currentLesson == undefined} onClick={submit}>
                                            <b>Start Session</b>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
