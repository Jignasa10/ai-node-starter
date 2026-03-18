import { useState, useEffect, useRef } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const bottomRef = useRef(null);

  const sessionIdRef = useRef(
    localStorage.getItem("sessionId") || crypto.randomUUID()
  );

  localStorage.setItem("sessionId", sessionIdRef.current);

  /* ---------------- LOAD CHAT HISTORY ---------------- */
  useEffect(() => {
    const loadHistory = async () => {
      const res = await fetch(
        `http://localhost:5000/api/history/${sessionIdRef.current}`
      );
      const data = await res.json();

      if (data.messages?.length) {
        setMessages(data.messages);
      } else {
        setMessages([
          {
            role: "assistant",
            content:
              "Hi 👋 You can chat normally or upload a PDF and ask questions.",
          },
        ]);
      }
    };

    loadHistory();
  }, []);

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------------- PDF UPLOAD ---------------- */
  const uploadPDF = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", sessionIdRef.current);

    await fetch("http://localhost:5000/api/upload-pdf", {
      method: "POST",
      body: formData,
    });

    setPdfUploaded(true);

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "✅ PDF uploaded successfully. Ask PDF-related questions or chat normally.",
      },
    ]);
  };

  /* ---------------- SEND MESSAGE ---------------- */
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const res = await fetch("http://localhost:5000/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userText,
        sessionId: sessionIdRef.current,
      }),
    });

    const data = await res.json();
    const answer = data.answer || "";
    const mode = data.mode || "chat";

    /* typing animation */
    let typed = "";
    for (let char of answer) {
      typed += char;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: typed + "▌",
          mode,
        };
        return updated;
      });
      await new Promise((r) => setTimeout(r, 15));
    }

    setMessages((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = {
        role: "assistant",
        content: typed,
        mode,
      };
      return updated;
    });

    setLoading(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 font-semibold text-lg flex justify-between">
        <span>PDF + Chat AI 🤖</span>
        {pdfUploaded && (
          <span className="text-green-600 text-sm">📄 PDF Ready</span>
        )}
      </div>

      {/* Upload */}
      <div className="p-4 bg-white border-b">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => uploadPDF(e.target.files[0])}
        />
        <p className="text-xs text-gray-500 mt-1">
          PDF is optional — normal chat works anytime
        </p>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] px-4 py-2 rounded-lg text-sm
                ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-800 shadow"
                }`}
            >
              {msg.role === "assistant" && msg.mode && (
                <div className="text-xs text-gray-400 mb-1">
                  {msg.mode === "pdf" ? "📄 From PDF" : "💬 General Chat"}
                </div>
              )}
              {msg.content || "Typing..."}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4 flex gap-2">
        <input
          className="flex-1 border rounded-lg px-4 py-2"
          placeholder="Ask anything… (PDF-related or normal)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className={`px-6 py-2 rounded-lg ${
            loading ? "bg-gray-400" : "bg-blue-600 text-white"
          }`}
        >
          {loading ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default App;
