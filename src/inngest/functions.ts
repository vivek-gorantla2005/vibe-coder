import { inngest } from "./client";
import { gemini, createAgent } from "@inngest/agent-kit";

export const helloWorld = inngest.createFunction(
  { id: "text-summarizer" },
  { event: "summarize/text-summarizer.world" },
  async ({ event }) => {
    const summarizerAgent = createAgent({
      model: gemini({ model: "gemini-1.5-flash" }),
      name: "Text Summarizer",
      system: "You are a helpful AI assistant that summarizes input text clearly and concisely.",
    });

    const inputText = event.data?.text ?? "No input provided.";

    const { output } = await summarizerAgent.run(
      `Summarize the following text:\n\n${inputText}`
    );

    console.log("Summary:", output);

    return {
      summary: output,
    };
  }
);
