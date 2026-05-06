import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// File upload setup
const upload = multer({ storage: multer.memoryStorage() });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// 🔥 AI ANALYSIS FUNCTION
async function analyzeCode(prompt) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "AI Testing Tool"
    },
    body: JSON.stringify({
      model: "openai/gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a software testing AI.

Analyze code and return STRICT JSON:
{
  "bugs": [],
  "improvements": [],
  "testCases": [],
  "severity": "Low | Medium | High"
}`
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  const data = await response.json();

  const text = data?.choices?.[0]?.message?.content || "{}";

  try {
    return JSON.parse(text);
  } catch {
    return {
      bugs: ["AI response parsing failed"],
      improvements: [],
      testCases: [],
      severity: "Medium"
    };
  }
}

// 🔥 TEXT INPUT
app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    const result = await analyzeCode(text);

    res.json({
      message: "AI Analysis ✅",
      result
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "AI failed but server running" });
  }
});

// 🔥 FILE UPLOAD
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const code = req.file.buffer.toString();

    const result = await analyzeCode(code);

    res.json({
      message: "File Analysis ✅",
      result
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "File analysis failed" });
  }
});

const PORT = 7000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});