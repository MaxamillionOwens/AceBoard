import { createPortal } from "react-dom";
import Image from "next/image";
import CSVEx from "public/CSVExample.png";
import styles from "styles/CNLHelpPopup.module.css";
import { useEffect, useRef } from "react";

export default function CNLHelpPopup(props: { opened: boolean; onClose: () => void }) {
    const { opened, onClose } = props;
    const scrollRectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTimeout(() => {
            scrollRectRef.current?.focus();
        }, 100);
    }, [opened]);

    if (opened) {
        return createPortal(
            <div className={styles.popupBackdrop} onClick={onClose}>
                <div id="content" className={styles.popupBody} onClick={(e) => e.stopPropagation()}>
                    <div style={{ marginBottom: "16px" }}>
                        <h2 style={{ display: "inline" }}>Help: Create New Lesson</h2>
                        <span className={styles.closeBtn} onClick={onClose}>
                            ✕
                        </span>
                    </div>
                    <div className={styles.popupBodyScrollRect} ref={scrollRectRef}>
                        <h3>Lesson Name Criteria</h3>
                        <p>
                            Enter any Lesson Name you want! So long as one is entered before clicking the
                            &quot;Next&quot; button. Must be at least one character long.
                        </p>
                        <h3>Upload CSV Criteria</h3>
                        <ol>
                            <li>
                                One CSV File can be uploaded, the file will be replaced if you upload more than once
                                before proceeding.
                            </li>

                            <li>
                                CSV Syntax checking is not done until the &quot;Next&quot; button is clicked, errors
                                that pop up to do with the file will be alerted to you once clicked.
                            </li>
                        </ol>
                        <Image className={styles.CSVExProp} id="csvexample" src={CSVEx} alt="CSV-Example"></Image>
                        <p>
                            This is the format of each column that you should have in your CSV File (This is a valid
                            file that WOULD be accepted by our parser). Let us break down the Columns and their
                            functions in the Game Session.
                        </p>
                        <ul>
                            <li>
                                The &quot;Instructor&quot; Column is just your name or abbreviation of your name(your
                                preference).
                            </li>
                            <li>
                                Qid is just used in the Game Session Backend and will be used for any errors that are
                                thrown at you to do with Questions if something went wrong in proceeding to Pick
                                Questions Page. It will also be used for the Session Report.
                            </li>
                            <li>
                                The &quot;File&quot; Column is the name of the image file corresponding to that question
                                to which will be displayed with that question during Game Sessions.
                            </li>
                            <li>
                                The &quot;Title&quot; Column is what will be displayed to students and you during the
                                Game Session of the actual &quot;Question Title&quot;
                            </li>
                            <li>
                                The &quot;Correct Answer&quot; Column is the actual correct answer of the question. A
                                sidenote, put the <i>actual</i> correct answer and not the <i>option</i> from the
                                &quot;Options&quot; Column. So for example, on the first question from the example
                                above, it is &quot;1&quot; in the &quot;Correct Answer&quot; Column which is also
                                &quot;Option 1&quot; corresponding value but not the Column name as you can see. The
                                Correct Answer is used as a way to highlight what the Correct Answer is on the Histogram
                                Feedback Chart during the Game Session.
                            </li>
                            <li>
                                The &quot;Options&quot; Column is the amount of answers to that particular question that
                                students will be able to click during the Game Session(No restraints on what is entered
                                as <i>answers</i>)
                            </li>
                            <li>
                                A sidenote, for the &quot;Option&quot; Columns, You only need at least two
                                &quot;Option&quot; Columns but we show five here to say you can have up to five answers.
                                You can choose to omit three &quot;Option&quot; Columns or just leave all the unused
                                &quot;Option&quot; Columns blank. For example, Question 2 is a <i>True and False</i>{" "}
                                Question with just those two answers with the other Columns blank, so those two answers
                                will only show up in the Game Session.
                            </li>
                        </ul>
                        <h3>Upload Images Criteria</h3>
                        <ol>
                            <li>
                                The Image(s) file names need to correspond with the &quot;File&quot; Column names
                                provided in order to proceed to Picking Questions for the Game Session
                            </li>
                            <li>
                                You can Choose to Drag N Drop all the images corresponding to all the questions at once
                                or CTRL+Left-Click all the images when the &quot;Browse&quot; button is clicked. We
                                recommend having a folder with all the images for the session that will be used for ease
                                of use. <i>There is currently no support for uploading of folders containing images.</i>
                            </li>
                            <li>
                                The &quot;Clear&quot; Button will clear all images that have been set to be uploaded so
                                far if you need to start over.
                            </li>
                        </ol>
                        <h3>Other Criteria</h3>
                        <ol>
                            <li>Error Checking is not processed until you hit the &quot;Next&quot; button.</li>
                            <li>
                                You will not be able to proceed to Picking Questions for the Game Session unless all
                                prompts have been completed error free.
                            </li>
                        </ol>
                    </div>
                </div>
            </div>,
            document.body
        );
    } else return <></>;
}
