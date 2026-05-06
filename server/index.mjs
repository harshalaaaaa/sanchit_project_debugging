import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fetch from "node-fetch";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ✅ Rate limiting (basic protection)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 20 // 20 requests/min
});
app.use(limiter);

// ✅ File upload (limit size)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB max
});

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// ✅ SAFE DEFAULT RESPONSE (prevents frontend crash)
const defaultResult = {
  severity: "Low",
  bugs: [],
  improvements: [],
  testCases: []
};

// 🔥 HELPER: Extract JSON safely
function extractJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from messy AI output
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }
    return defaultResult;
  }
}

// 🔥 AI ANALYSIS FUNCTION
async function analyzeCode(prompt) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15 sec timeout

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `You are a strict software testing AI.

Return ONLY valid JSON. No explanation.

Format:
{
  "severity": "Low | Medium | High",
  "bugs": ["..."],
  "improvements": ["..."],
  "testCases": ["..."]
}`
          },
          {
            role: "user",
            content: `Analyze this code:\n\n${prompt}`
          }
        ]
      })
    });

    clearTimeout(timeout);

    const data = await response.json();

    const text = data?.choices?.[0]?.message?.content || "{}";

    const parsed = extractJSON(text);

    // ✅ Ensure safe structure
    return {
      severity: parsed.severity || "Low",
      bugs: parsed.bugs || [],
      improvements: parsed.improvements || [],
      testCases: parsed.testCases || []
    };

  } catch (err) {
    console.error("AI Error:", err);

    return {
      severity: "Error",
      bugs: ["AI request failed"],
      improvements: [],
      testCases: []
    };
  }
}

// 🔥 HEALTH CHECK
app.get("/", (req, res) => {
  res.send("🚀 Backend is running");
});

// 🔥 TEXT ANALYSIS
app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        message: "No input provided",
        result: defaultResult
      });
    }

    const result = await analyzeCode(text);

    res.json({
      message: "AI Analysis ✅",
      result
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
      result: defaultResult
    });
  }
});

// 🔥 FILE UPLOAD ANALYSIS
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
        result: defaultResult
      });
    }

    const code = req.file.buffer.toString();

    const result = await analyzeCode(code);

    res.json({
      message: "File Analysis ✅",
      result
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "File processing failed",
      result: defaultResult
    });
  }
});

// ✅ PORT (Render compatible)
const PORT = process.env.PORT || 7000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});