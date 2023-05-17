import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import logo from "public/logo.png";
import Logo from "components/Logo";
import { API_LOGIN } from "types/api";

export default function InstructorLogin() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const login: React.FormEventHandler = async (e) => {
        e.preventDefault();

        if (username == "" || password == "") {
            alert("Username or password missing");
            return;
        }

        const data = await API_LOGIN({
            username: username,
            password: password
        });

        if (data.success == true) {
            sessionStorage.setItem("authToken", data.authToken);
            console.log("AuthToken Created: ", data.authToken);
            router.push("/CreateNewLesson");
        } else {
            alert("Login failed");
        }
    };

    return (
        <>
            <Head>
                <title>Instructor Login - AceBoard</title>
                <meta name="description" content="AceBoard Instructor Login" />
            </Head>

            <div id="main" style={{ width: "300px" }}>
                <Logo />
                <div id="content">
                    <div className="flex" style={{ marginBottom: "0.5em" }}>
                        <strong>Instructor Login</strong>
                    </div>
                    <form onSubmit={login}>
                        <div className="input-group">
                            <label htmlFor="usernameInput">Username</label>
                            <input
                                type="text"
                                id="usernameInput"
                                autoFocus
                                value={username}
                                onInput={(e) => setUsername(e.currentTarget.value)}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="passwordInput">Password</label>
                            <input
                                type="password"
                                id="passwordInput"
                                value={password}
                                onInput={(e) => setPassword(e.currentTarget.value)}
                            />
                        </div>

                        <table style={{ width: "100%" }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: "50%" }}>
                                        <button
                                            type="button"
                                            style={{ width: "100%" }}
                                            onClick={() => {
                                                router.push("/");
                                            }}
                                        >
                                            Back
                                        </button>
                                    </td>
                                    <td style={{ width: "50%" }}>
                                        <button type="submit" style={{ width: "100%" }}>
                                            <strong>Login</strong>
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </form>
                </div>
            </div>
        </>
    );
}
