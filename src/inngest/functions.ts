import { inngest } from "./client";
import { openai, createAgent, createTool, createNetwork } from "@inngest/agent-kit";
import { Sandbox } from '@e2b/code-interpreter'
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { z } from "zod";
import { PROMPT } from "@/prompt";


export const codeAgent = inngest.createFunction(
  { id: "code-generator" },
  { event: "code/code.generator" },
  async ({ event, step }) => {
    const sandboxid = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("vibe-coder-vivekg")
      return sandbox.sandboxId
    })

    console.log("Incoming event data:", event.data);
    const prompt = event.data?.text;

    if (typeof prompt !== "string" || prompt.length === 0) {
      throw new Error("Prompt is not a valid non-empty string.");
    }

    if (!prompt) {
      console.log("Missing prompt value in event data.");
      return {
        error: "No prompt provided",
        output: `Cannot generate snippet: No input provided.`,
      };
    }
    // 
    const codingAgent = createAgent({
      model: openai({model: "gpt-3.5-turbo-1106"}),
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      tools: [
        // Terminal tool
        createTool({
          name: "terminal",
          description: "Use terminal to run command",
          parameters:
            z.object({
              command: z.string().describe("The command to run in the terminal"),
            }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };
              try {
                const sandbox = await getSandbox(sandboxid)
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data
                  }
                })
                return result.stdout
              } catch (err) {
                console.error(
                  `command failed: ${err} \nstdout: ${buffers.stdout}\nstderror: ${buffers.stderr}`
                )
                return `command failed: ${err} \nstdout: ${buffers.stdout}\nstderror: ${buffers.stderr}`
              }
            })
          },
        }),

        // Create or update files tool
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters:
            z.object({
              files: z.array(
                z.object({
                  path: z.string().describe("The file path"),
                  content: z.string().describe("The file content")
                })
              ).describe("Array of files to create or update")
            }),
          handler: async ({ files }, { step, network }) => {
            const newFiles = await step?.run("createOrUpdateFiles", async () => {
              try {
                const updatedFiles = network.state.data.files || {};
                const sandbox = await getSandbox(sandboxid);
                for (const file of files) {
                  await sandbox.files.write(file.path, file.content)
                  updatedFiles[file.path] = file.content
                }
                return updatedFiles
              } catch (err) {
                return "Error: " + err
              }
            })
            if (typeof newFiles === "object" && newFiles !== null) {
              network.state.data.files = newFiles
            }
            return newFiles
          }
        }),

        // Read files tool
        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string().describe("File path to read")).describe("Array of file paths to read")
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxid);
                const contents = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file)
                  contents.push({ path: file, content })
                }
                return JSON.stringify(contents)
              } catch (err) {
                return "Error : " + err;
              }
            })
          }
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantTextMessageText = lastAssistantTextMessageContent(result)
          if (lastAssistantTextMessageText && network) {
            if (lastAssistantTextMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantTextMessageText
            }
          }
          return result
        }
      }
    });

    const network = createNetwork({
      name: "coding-agent-network",
      agents: [codingAgent],
      maxIter: 3,
      router: async ({ network }) => {
        const summary = network.state.data.summary
        if (summary) {
          return;
        }
        return codingAgent;
      }
    })

    const result = await network.run(prompt)

    const sandboxurl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxid);
      const host = sandbox.getHost(3000);
      return `https://${host}`
    })

    return {
      url: sandboxurl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary
    };
  }
);