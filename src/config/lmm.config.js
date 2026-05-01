import OpenAI from "openai";
import { conf } from "../conf/conf.js";

export const openai = new OpenAI({
  apiKey: conf.openAiKey,
});
