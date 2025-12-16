import { useState } from "react";

function App() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔹 Call AI API
  const callAI = async () => {
    if (prompt.trim().length < 5) {
      setError("Please enter at least 5 characters");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/ai/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "AI failed");
      }

      setResult(data.result);
    } catch (err) {
      setError("Failed to fetch AI response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", fontFamily: "Arial" }}>
      <h2>AI Text Generator 🤖</h2>

      <textarea
        rows="6"
        value={prompt}
        placeholder="Enter your prompt..."
        onChange={(e) => setPrompt(e.target.value)}
        style={{ width: "100%", padding: "10px" }}
      />

      <button
        onClick={callAI}
        disabled={loading}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          cursor: "pointer",
        }}
      >
        {loading ? "Generating..." : "Generate"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h3>AI Response</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>{result}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
