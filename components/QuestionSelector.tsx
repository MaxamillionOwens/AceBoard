import { Question } from "types/Question";
import styles from "styles/PickQuestions.module.css";

type QuestionSelectorProps = {
    question: Question;
    checked: boolean;
    setChecked: (value: boolean) => void;
};

export default function QuestionSelector(props: QuestionSelectorProps) {
    return (
        <div className={styles.question}>
            <table>
                <tbody>
                    <tr>
                        <td>
                            <input
                                checked={props.checked}
                                className={styles.checkbox}
                                type="checkbox"
                                onChange={(e) => props.setChecked(!props.checked)}
                            />
                        </td>
                        <td style={{ paddingLeft: "12px" }}>
                            <span>{props.question?.title}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
