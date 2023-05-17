import { useState, useEffect } from "react";
import { Question } from "types/Question";
import { Lesson } from "types/Lesson";
import Head from "next/head";
import styles from "styles/CreateNewLesson.module.css";
import { useRouter } from "next/router";
import CNLHelpPopup from "components/CNLHelpPopup";
import Logo from "components/Logo";
import UploadBox from "components/UploadBox";
import { API_LOGOUT, API_SET_LESSON, API_VALIDATE_SESSION } from "types/api";

export default function CreateNewLesson() {
    const router = useRouter();

    // State
    const [excelFile, setExcelFile] = useState<File>();
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [lessonName, setLessonName] = useState("");
    const [showHelpPopup, setShowHelpPopup] = useState(false);

    // Check if login is valid
    useEffect(() => {
        async function run() {
            if (sessionStorage.getItem("authToken") == null) {
                alert("Invalid session");
                router.push("/");
            } else {
                const data = await API_VALIDATE_SESSION({
                    authToken: sessionStorage.getItem("authToken")!
                });

                if (data.valid == false) {
                    alert("Invalid session");
                    router.push("/");
                }
            }
        }

        run();
    }, []);

    // This lets us just call 'await readFileAs()' instead of having to
    // keep nesting code deeper in more 'reader.onload = () => {}' functions
    // https://stackoverflow.com/a/55152476
    async function readFileAs(file: File, as: "blob" | "text") {
        const result_base64 = await new Promise((resolve) => {
            let fileReader = new FileReader();
            fileReader.onload = () => resolve(fileReader.result);

            if (as == "blob") fileReader.readAsDataURL(file);
            else fileReader.readAsText(file);
        });

        return result_base64;
    }

    const submit = async () => {
        // Local variable references for guard clauses
        // to work https://stackoverflow.com/q/52264617
        const name = lessonName;
        const csv = excelFile;
        const images = imageFiles;

        const lesson: Lesson = { name: "", questions: [] };

        if (name == "") {
            alert("Enter a lesson name.");
            return;
        }

        lesson.name = name;

        if (csv == undefined) {
            alert("No CSV file was selected.");
            return;
        }

        if (images.length == 0) {
            alert("No images were selected.");
            return;
        }

        const lines = ((await readFileAs(csv, "text")) as string)
            .replaceAll("\r", "")
            .split("\n")
            .filter((line) => line != "");

        for (let l = 1; l < lines.length; l++) {
            const tokens = lines[l].split(",");

            // 7 tokens means there's at least 2 answers
            if (tokens.length < 7) {
                alert(
                    `Not enough columns in line ${
                        l + 1
                    }. Need at least 7 for Instructor, Question ID, Question Title, Image Name, Correct Answer, and at least 2 answer options.`
                );
                return;
            }

            // Check that none of the required items are empty
            for (let t = 0; t <= 4; t++) {
                if (tokens[t] == "" || tokens[t] == " ") {
                    alert(
                        `Instructor, Question ID, Question Title, Image Name, or Correct Answer was missing from line ${
                            l + 1
                        }`
                    );
                    return;
                }
            }

            const id = tokens[1];
            const imageName = tokens[2];
            const title = tokens[3];
            const correctAns = tokens[4];
            const answers: string[] = [];

            // Get answer options
            for (let t = 5; t < tokens.length; t++) {
                if (tokens[t] != "" && tokens[t] != " ") answers.push(tokens[t]);
            }

            // Check that the Correct Answer is actually in the answer list
            if (!answers.includes(correctAns)) {
                alert(
                    `Question titled ${title} has a correct answer of "${correctAns}" but is not found in the answer list.`
                );
                return;
            }

            // Find matching image
            const matches = images.filter((file) => file.name == imageName);

            if (matches.length != 1) {
                alert(`${imageName} could not be found in selected images.`);
                return;
            }

            const base64 = (await readFileAs(matches[0], "blob")) as string;

            const q: Question = {
                id: id,
                imageUrl: base64,
                title: title,
                correctAns: correctAns,
                answers: answers
            };

            lesson.questions.push(q);
        }

        const data = await API_SET_LESSON({ authToken: sessionStorage.getItem("authToken")!, lesson: lesson });
        if (!data.error) router.push("/PickQuestions");
        else alert(data.errorMsg);
    };

    const logout = async () => {
        await API_LOGOUT({ authToken: sessionStorage.getItem("authToken")! });

        sessionStorage.removeItem("authToken");
        router.push("/InstructorLogin");
    };

    return (
        <>
            <Head>
                <title>Create New Lesson - AceBoard</title>
                <meta name="description" content="AceBoard Create New Lesson" />
            </Head>

            <div id="main" style={{ width: "70%" }}>
                <Logo />

                <div style={{ marginBottom: "200px" }} id="content">
                    <CNLHelpPopup opened={showHelpPopup} onClose={() => setShowHelpPopup(false)} />
                    <table className={styles.table} style={{ width: "100%" }}>
                        <tbody>
                            <tr style={{ borderBottom: "1px solid black" }}>
                                <td className={styles.td} colSpan={4}>
                                    <div className="flex" style={{ flexDirection: "row" }}>
                                        <button style={{ marginRight: "auto" }} onClick={() => router.push("/")}>
                                            Home
                                        </button>
                                        <span style={{ fontSize: "24px" }}>Create New Lesson</span>
                                        <button style={{ marginLeft: "auto" }} onClick={() => logout()}>
                                            Log out
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                        <tbody className={styles.DivWScroll}>
                            <tr>
                                <td className={styles.td} style={{ textAlign: "center" }}>
                                    <span style={{ fontSize: "24px" }}>
                                        <b>Lesson Name:</b>
                                        <br />
                                        {lessonName ? lessonName : "<Enter a New Lesson Name>"}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ textAlign: "center" }}>
                                    <div className="flex">
                                        <b>Enter a New Lesson Name</b>
                                        <input
                                            type="text"
                                            id="lessonInput"
                                            style={{ width: "100%" }}
                                            minLength={1}
                                            maxLength={20}
                                            required
                                        />
                                        <button
                                            style={{ marginTop: "1em" }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                let newLessonInput = (
                                                    document.getElementById("lessonInput") as HTMLInputElement
                                                ).value;
                                                if (newLessonInput == "") {
                                                    alert("Must be at least one character long.");
                                                } else {
                                                    (document.getElementById("lessonInput") as HTMLInputElement).value =
                                                        "";
                                                    setLessonName(newLessonInput);
                                                }
                                            }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td className={styles.td}>
                                    <UploadBox
                                        files={[excelFile!]}
                                        onChangeFiles={(files) => setExcelFile(files[0])}
                                        accepts={[".csv"]}
                                        title="Import Lesson Question(s)"
                                        description="Maximum of 1 file"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className={styles.td}>
                                    <UploadBox
                                        files={imageFiles}
                                        onChangeFiles={(files) => setImageFiles(files)}
                                        accepts={[".png", ".jpg", ".jpeg"]}
                                        title="Import Question(s) Images"
                                        description="1 Image Per Question"
                                        multiple
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className={styles.td} colSpan={4}>
                                    <div className="flex" style={{ flexDirection: "row" }}>
                                        <button style={{ margin: "left" }} onClick={() => setShowHelpPopup(true)}>
                                            Help
                                        </button>
                                        <button style={{ margin: "right" }} onClick={() => submit()}>
                                            <b>Next</b>
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
