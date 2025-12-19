import { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------- Upload PDF ----------
  const uploadPDF = async () => {
    if (!file) return;

    setUploadStatus("Uploading & processing PDF...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/ai/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (data.success) {
        setUploadStatus("✅ PDF processed successfully");
      } else {
        setUploadStatus("❌ PDF processing failed");
      }
    } catch (err) {
      setUploadStatus("❌ Server error");
    }
  };

  // ---------- Ask Question ----------
  const askQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/ai/pdf-chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        }
      );

      const data = await res.json();
      setAnswer(data.answer);
    } catch (err) {
      setAnswer("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2>📄 Chat With PDF (AI RAG)</h2>

      {/* PDF Upload */}
      <div
        style={{
          border: "1px solid #ccc",
          padding: "20px",
          marginBottom: "30px",
        }}
      >
        <h4>1️⃣ Upload PDF</h4>

        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          onClick={uploadPDF}
          style={{ marginLeft: "10px" }}
        >
          Upload
        </button>

        <p>{uploadStatus}</p>
      </div>

      {/* Ask Question */}
      <div
        style={{
          border: "1px solid #ccc",
          padding: "20px",
        }}
      >
        <h4>2️⃣ Ask Question From PDF</h4>

        <input
          type="text"
          placeholder="Ask something from the document..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
          }}
        />

        <button onClick={askQuestion} disabled={loading}>
          Ask
        </button>

        {loading && <p>🤖 Thinking...</p>}

        {answer && (
          <div
            style={{
              background: "#f4f4f4",
              padding: "15px",
              marginTop: "15px",
              whiteSpace: "pre-wrap",
            }}
          >
            <strong>Answer:</strong>
            <p>{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
