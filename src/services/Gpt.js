import { openai } from "../config/lmm.config.js";

export const AiResponse = async ({
  prompt = "",
  UserQuestion = "",
  response = null,
} = {}) => {
  if (UserQuestion) {
    prompt = `
User asked: "${UserQuestion}"

The AI returned the following result:
${response}

 Your task is to present this result in a clean, user-friendly, non-technical HTML layout.

 You must:
- Choose the best HTML layout based on the content and the question
- You MAY use <table>, <ul>, <div>, or <p> — WHICHEVER fits best
- Avoid excessive vertical spacing.
- Use Bootstrap spacing classes like mb-2 or gap-2 for consistent look.
- Keep the original structure and fields of the data
- Do NOT include MongoDB, JSON, code, or query explanation
- DO NOT hardcode the layout — make it dynamically appropriate

The goal is to help a non-technical person visually understand the result easily.`;
  }

  const gptResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: !UserQuestion
          ? "You are a helpful assistant that writes MongoDB aggregation queries."
          : "You are a helpful assistant that explains AI-generated data using clear, clean, non-technical HTML (with Bootstrap styling using className). Choose the layout dynamically based on user needs and content. Never include code.",
      },
      { role: "user", content: prompt },
    ],
  });

  let raw = gptResponse.choices[0].message?.content;

  if (UserQuestion && raw) {
    raw = raw.replace(/"([^"]+)"/g, "$1"); // clean quotes if needed
  }

  return UserQuestion ? raw : JSON.parse(raw);
};
