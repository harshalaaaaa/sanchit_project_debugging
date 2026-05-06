import React, { useState } from "react";

function App() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);

  // TEXT ANALYSIS
  const analyzeCode = async () => {
    try {
      const res = await fetch("https://sanchit-project-debugging.onrender.com/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: code })
      });

      const data = await res.json();
      setResult(data.result || {});
    } catch (err) {
      console.error(err);
      alert("Error analyzing code");
    }
  };

  // FILE UPLOAD
  const uploadFile = async (e) => {
    try {
      const file = e.target.files[0];

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("https://sanchit-project-debugging.onrender.com/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      setResult(data.result || {});
    } catch (err) {
      console.error(err);
      alert("Error uploading file");
    }
  };

  // DOWNLOAD REPORT
  const downloadReport = () => {
    if (!result) return;

    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "report.json";
    a.click();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🚀 AI Testing Tool</h1>

      <textarea
        rows="10"
        cols="80"
        placeholder="Paste your code..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <br /><br />

      <button onClick={analyzeCode}>Analyze Code</button>

      <br /><br />

      <input type="file" onChange={uploadFile} />

      <br /><br />

      {result && (
        <div style={{ marginTop: 20 }}>
          <h2>📊 Result</h2>

          <p><strong>Severity:</strong> {result.severity || "N/A"}</p>

          {/* BUGS */}
          <div style={{ background: "#ffe6e6", padding: 10 }}>
            <h3>🔴 Bugs</h3>
            <ul>
              {(result.bugs || []).map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>

          {/* IMPROVEMENTS */}
          <div style={{ background: "#fff5cc", padding: 10 }}>
            <h3>🟡 Improvements</h3>
            <ul>
              {(result.improvements || []).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {/* TEST CASES */}
          <div style={{ background: "#e6ffe6", padding: 10 }}>
            <h3>🟢 Test Cases</h3>
            <ul>
              {(result.testCases || []).map((t, idx) => (
                <li key={idx}>{t}</li>
              ))}
            </ul>
          </div>

          <br />
          <button onClick={downloadReport}>⬇ Download Report</button>
        </div>
      )}
    </div>
  );
}

export default App;