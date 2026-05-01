import { getPrompt } from "../prompts/chat.prompts.js";
import { connectDB } from "../config/mongo.client.js";
import { AiResponse } from "./Gpt.js";
import { memory } from "./chat.Memory.js";

export const getChatResponse = async (question) => {
  try {
    const db = await connectDB();
    const prompt = await getPrompt(
      question,
      memory.lastQuestion,
      memory.lastAggregate
    );

    const response = await AiResponse({ prompt });
    console.log("AI Response:", response);

    if (response.type === "irrelevant") {
      return {
        type: "text",
        data: "⚠️ This question is irrelevant.please ask something related to our data.",
      };
    }

    if (!response.collection || !Array.isArray(response.options?.aggregate)) {
      throw new Error("Invalid response format.");
    }

    const collection = db.collection(response.collection);
    const result = await collection
      .aggregate(response.options.aggregate)
      .toArray();

    memory.lastQuestion = question;
    memory.lastAggregate = response.options.aggregate;

    const userFriendly = await AiResponse({
      UserQuestion: question,
      response: JSON.stringify(result),
    });

    if (response.type === "chart") {
      // handle charts
      return {
        type: "chart",
        chartType: response.chartType || "bar",
        labels: result.map((r) => r.name || r._id),
        values: result.map((r) => r.count || r.total || r.value),
        explanation: userFriendly,
      };
    }

    return {
      type: "text",
      data: userFriendly,
    };
  } catch (err) {
    console.error("Error in getChatResponse:", err);
    return {
      type: "error",
      text: "Sorry, I couldn't process your request. Please try again.",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    };
  }
};

