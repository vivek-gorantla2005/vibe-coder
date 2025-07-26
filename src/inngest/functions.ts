import { inngest } from "./client";
import { gemini, createAgent } from "@inngest/agent-kit";
import { Sandbox } from '@e2b/code-interpreter'
import { getSandbox } from "./utils";


export const codeAgent = inngest.createFunction(
  { id: "code-generator" },
  { event: "code/code.generator" },
  async ({ event,step }) => {
    const sandboxid = await step.run("get-sandbox-id",async()=>{
      const sandbox = await Sandbox.create("vibe-coder-vivekg2005")
      return sandbox.sandboxId
    })
    console.log("Incoming event data:", event.data);
    const prompt = event.data?.text;
    if (!prompt) {
      console.log("Missing prompt value in event data.");
      return {
        error: "No prompt provided",
        output: `Cannot generate snippet: No input provided.`,
      };
    }
    const codingAgent = createAgent({
      model: gemini({ model: "gemini-1.5-flash" }),
      name: "code-agent",
      system: "You are an expert next.js developer. You write readable, maintable code. You write simple Next.js and React snippets",
    });

    const { output } = await codingAgent.run(
      `Write the following snippet: ${prompt}`
    );

    console.log("code:", output);

    const sandboxurl = await step.run("get-sandbox-url",async()=>{
      const sandbox = await getSandbox(sandboxid);
      const host =  sandbox.getHost(3000);
      return `https://${host}`
    })


    return {output, sandboxurl};
  }
);
