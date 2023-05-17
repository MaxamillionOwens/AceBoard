import Logo from "components/Logo";
import { useRouter } from "next/router";
import { useState } from "react";

export default function Home() {
    const router = useRouter();
    const [sessionCode, setSessionCode] = useState("");

    return (
        <div id="main" style={{ width: "300px" }}>
            <Logo />

            <div id="content">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!sessionCode) {
                            alert("Session code is empty");
                        } else if (sessionCode.length < 6) {
                            alert("Session code is too short");
                        } else if (sessionCode.length > 6) {
                            alert("Session code is too long");
                        } else {
                            router.push(`/session/${sessionCode}`);
                        }
                    }}
                >
                    <div className="input-group">
                        <label htmlFor="sessionCodeInput">Session Code</label>
                        <input
                            type="text"
                            id="sessionCodeInput"
                            autoFocus
                            value={sessionCode}
                            onInput={(e) => setSessionCode(e.currentTarget.value.toUpperCase())}
                        />
                    </div>
                    <button type="submit" style={{ width: "100%" }} onClick={(e) => {}}>
                        <strong>Join Session</strong>
                    </button>
                </form>
            </div>
            <div className="flex" style={{ marginTop: "1em" }}>
                <button style={{ width: "100%" }} onClick={() => router.push("/InstructorLogin")}>
                    <strong>Instructor Login</strong>
                </button>
            </div>
        </div>
    );
}
