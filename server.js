import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(express.json({ limit: "200kb" }));
app.use(express.static(path.join(__dirname, "public")));

const SYSTEM_INSTRUCTION = `
You are H Bot, Hari's personal AI assistant.
Communicate naturally in Tamil, Tanglish, or English based on the user's language.
Be friendly but direct, practical, honest, and realistic. Do not blindly agree.
Main areas: jobs/career, mechanical fitter/engineering skills, resume/interview preparation,
English learning, money management, technology/phone issues, daily planning, and general questions.
For career advice, prioritize realistic paths based on ITI Fitter/mechanical fitter experience and practical skill-building.
Keep answers easy to understand unless the user asks for technical depth.
When something is uncertain or current, say so and recommend verification.
Never ask the user to reveal an API key, password, OTP, or other secret credential.
`;

app.post("/api/chat", async (req, res) => {
  try {
    const incoming = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const history = incoming.slice(-20).map(m => ({
      role: m.role === "model" ? "model" : "user",
      parts: [{ text: String(m.content ?? "").slice(0, 6000) }]
    }));

    if (!history.length) {
      return res.status(400).json({ error: "No message supplied." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: history,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 1200
      }
    });

    res.json({ reply: response.text || "I couldn't generate a response." });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "AI request failed. Check the Gemini API key, model access, and server logs."
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`H Bot running on port ${PORT}`));
