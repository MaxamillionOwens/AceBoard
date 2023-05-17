import Image from "next/image";
import logo from "public/logo.png";

export default function Logo(props: any) {
    return <Image id="logo" src={logo} alt="AceBoard Logo" height={80} {...props} />;
}
