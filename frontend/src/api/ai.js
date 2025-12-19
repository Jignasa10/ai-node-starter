export async function askAI(question) {
    const res = await fetch("http://localhost:5000/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
  
    return res.json();
  }
  