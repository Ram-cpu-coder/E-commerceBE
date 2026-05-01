import { getChatResponse } from "../services/chat.service.js";

export const handleChat = async (req, res) => {
  try {
    const { question } = req.body;
    const response = await getChatResponse(question);
    res.json(response);
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ type: "text", text: "Something went wrong." });
  }
};
