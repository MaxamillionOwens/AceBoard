import { DragEventHandler, useState, useRef } from "react";
import uploadSymbol from "public/upload_symbol.png";
import Image from "next/image";
import styles from "styles/CreateNewLesson.module.css";

type UploadBoxProps = {
    files: File[];
    onChangeFiles: (value: File[]) => void;
    accepts: string[];
    title: string;
    description: string;
    multiple?: boolean;
};

export default function UploadBox(props: UploadBoxProps) {
    const [dragging, setDragging] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    const onDragOver: DragEventHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const onDragEnter: DragEventHandler = (e) => {
        setDragging(true);
    };

    const onDragLeave: DragEventHandler = (e) => {
        setDragging(false);
    };

    const onDrop: DragEventHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();

        setDragging(false);
        onInput([...e.dataTransfer.files]);
    };

    const onInput = (files: File[]) => {
        let valid = true;
        files.forEach((file) => {
            let matched = false;
            props.accepts.forEach((type) => {
                if (file.type.match(type)) matched = true;
            });

            if (!matched) valid = false;
        });
        if (valid) props.onChangeFiles(files);
        else alert(`One or more files didn't match any of the allowed file types.`);
    };

    let fileList = <></>;
    if (props.multiple && props.files.length > 0) {
        fileList = (
            <ul>
                {props.files.map((file) => (
                    <li key={file.name}>{file.name}</li>
                ))}
            </ul>
        );
    } else if (!props.multiple && props.files[0] != undefined) {
        fileList = <b>{props.files[0].name}</b>;
    }

    return (
        <div className="flex">
            <b>{props.title}</b>

            <div
                className={styles.uploadBox}
                onDragOver={onDragOver}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                style={{ backgroundColor: dragging ? "lightblue" : "white" }}
            >
                <input
                    type="file"
                    ref={inputRef}
                    value="" // apparently fixes a bug where the Browse btn stops working after clearing on Chrome
                    accept={props.accepts.toString()}
                    onChange={(e) => onInput([...e.currentTarget.files!])}
                    multiple={props.multiple}
                    hidden
                />
                <div className="flex" style={{ textAlign: "center" }}>
                    <Image className={styles.uploadSymbol} src={uploadSymbol} alt="Upload Files" />
                    Drag & Drop files
                    <br />
                    or
                    <button onClick={() => inputRef.current!.click()}>Browse</button>
                    <small style={{ color: "grey" }}>
                        Supported file types: <b>{props.accepts.join(", ")}</b>
                        <br />
                        <b>{props.description}</b>
                        <br />
                        {fileList}
                        {props.multiple && props.files.length > 0 && (
                            <button onClick={() => props.onChangeFiles([])}>Clear</button>
                        )}
                    </small>
                </div>
            </div>
        </div>
    );
}
