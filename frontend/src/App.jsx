import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { CirclePlus, SendHorizonal, FileText, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

window.addEventListener("beforeunload", async () => {
    try {
        await fetch("http://127.0.0.1:8000/clear/", {
            method: "POST",
        });
    } catch (error) {
        console.error("Failed to clear data:", error);
    }
});

function App() {
    const [files, setFiles] = useState([]);
    const [messages, setMessages] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [botMessage, setBotMessage] = useState("");

    const [language, setLanguage] = useState("en");
    const textareaRef = useRef(null);

    const handleFileChange = async (e) => {
        const selectedFiles = [...e.target.files]; // Allow multiple file selection
        setFiles([...files, ...selectedFiles]);

        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append("files", file)); // Append multiple files

        try {
            setLoading(true);
            const response = await axios.post(
                "http://127.0.0.1:8000/upload/",
                formData,
                {
                    // Note the trailing slash
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );
            console.log("Upload response:", response.data);
        } catch (error) {
            console.error("Upload error:", error);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!query.trim() || loading) return; // Prevent sending if already loading

        setMessages([...messages, { text: query, type: "user" }]);
        setQuery("");
        setLoading(true);
        setBotMessage("");

        try {
            const response = await axios.post(
                "http://127.0.0.1:8000/query/", // Note the trailing slash
                { query, language },
                { headers: { "Content-Type": "application/json" } }
            );

            const botResponse = response.data.response;

            setMessages((prev) => [
                ...prev,
                {
                    text: botResponse,
                    type: "bot",
                },
            ]);
        } catch (error) {
            console.error("Query error:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const truncateFileName = (name) => {
        const maxLength = 30;
        if (name.length <= maxLength) return name;
        const halfLength = Math.floor(maxLength / 2);
        return `${name.slice(0, halfLength)}...${name.slice(-halfLength)}`;
    };

    useEffect(() => {
        const textarea = textareaRef.current;
        const adjustHeight = () => {
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
        };
        textarea.addEventListener("input", adjustHeight);
        return () => textarea.removeEventListener("input", adjustHeight);
    }, []);

    useEffect(() => {
        const messageDiv = document.querySelector(".message");
        if (messageDiv) {
            messageDiv.scrollTop = messageDiv.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="flex w-full flex-col items-center justify-center h-screen bg-[#212121] p-6">
            {messages.length > 0 ? (
                <div className="message p-3 rounded overflow-auto w-3/4 mt-4 flex-grow scrollbar-hide">
                    {files.length > 0 && (
                        <div className="mb-4 w-full">
                                <div className="files flex justify-end space-x-2 overflow-x-auto scrollbar-hide">
                                    {files.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex-shrink-0 flex flex-row border border-[#ffffff1a] bg-[#212121] min-w-sm h-15 text-[#ececec] items-center p-2 rounded-2xl relative"
                                        >
                                            <FileText className="w-10 h-full mr-2 bg-[#ff5588] rounded-lg text-lg font-light" />
                                            <div className="flex flex-col">
                                                <span className="truncate">
                                                    {truncateFileName(
                                                        file.name
                                                    )}
                                                </span>
                                                <span className="text-sm text-gray-400">
                                                    PDF
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                        </div>
                    )}

                    {/* Messages */}
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={
                                msg.type === "user"
                                    ? "flex justify-end mb-5"
                                    : "flex justify-start mb-5"
                            }
                        >
                            <div
                                className={
                                    msg.type === "user"
                                        ? "bg-[#303030] py-2 px-5 text-md rounded-3xl break-words text-[#ececec]"
                                        : "text-left text-[#ececec] text-md break-words"
                                }
                            >
                                <ReactMarkdown
                                    remarkPlugins={[remarkBreaks, remarkGfm]}
                                    components={{
                                        ul: ({ children }) => (
                                            <ul className="list-disc pl-5 text-[#ececec]">
                                                {children}
                                            </ul>
                                        ),
                                        ol: ({ children }) => (
                                            <ol className="list-decimal pl-5 text-[#ececec]">
                                                {children}
                                            </ol>
                                        ),
                                        li: ({ children }) => (
                                            <li className="ml-4">{children}</li>
                                        ),
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start mb-5">
                            <p className=" py-2 text-md rounded-3xl break-words text-[#ececec] animate-blink">
                                {botMessage}•
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <h1 className="text-2xl font-bold mb-4 text-[#ececec]">
                    Chat with Your PDF Files
                </h1>
            )}

            <div
                className={`chat w-3/4 ${
                    messages.length > 0 ? "mt-auto" : "mt-4"
                }`}
            >
                <div className="flex w-full flex-col bg-[#303030] items-center p-4 rounded-4xl">
                    {files.length > 0 && messages.length === 0 && (
                        <div className="w-full mb-4">
                            <div className="files flex flex-row space-x-2 overflow-x-auto scrollbar-hide">
                                {files.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex-shrink-0 flex flex-row bg-[#212121] min-w-sm h-15 text-[#ececec] items-center p-2 rounded-2xl relative"
                                    >
                                        <FileText className="w-10 h-full mr-2 bg-[#ff5588] rounded-lg text-lg font-light" />
                                        <div className="flex flex-col">
                                            <span className="truncate">
                                                {truncateFileName(file.name)}
                                            </span>
                                            <span className="text-sm text-gray-400">
                                                PDF
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="w-full mb-5">
                        <textarea
                            ref={textareaRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    if (!loading) sendMessage();
                                }
                            }}
                            className="text-[#ececec] w-full focus:outline-none resize-none overflow-hidden"
                            placeholder="Ask anything"
                            rows="1"
                        ></textarea>
                    </div>
                    <div className="flex w-full justify-between">
                        <label
                            className={`w-10 h-10 flex items-center justify-center rounded-full ${
                                loading
                                    ? "opacity-50 cursor-not-allowed"
                                    : "cursor-pointer"
                            }`}
                        >
                            <CirclePlus className="w-6 h-6 text-white" />
                            <input
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={handleFileChange}
                                multiple
                                disabled={loading}
                            />
                        </label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="mb-4 p-2 rounded bg-[#303030] text-white"
                            disabled={loading}
                        >
                            <option value="en">English</option>
                            <option value="ne">नेपाली</option>
                        </select>
                        <button
                            onClick={sendMessage}
                            disabled={loading}
                            className={`text-black w-10 h-10 rounded-full flex items-center justify-center ${
                                loading
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-white cursor-pointer hover:bg-gray-100"
                            }`}
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800" />
                            ) : (
                                <SendHorizonal className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
