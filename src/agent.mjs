import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { PromptTemplate } from "@langchain/core/prompts";

const addTool = new DynamicStructuredTool({
  name: "add",
  description: "Add two integers together.",
  schema: z.object({
    firstInt: z.number(),
    secondInt: z.number(),
  }),
  func: async ({ firstInt, secondInt }) => {
    return (firstInt + secondInt).toString();
  },
});

const multiplyTool = new DynamicStructuredTool({
  name: "multiply",
  description: "Multiply two integers together.",
  schema: z.object({
    firstInt: z.number(),
    secondInt: z.number(),
  }),
  func: async ({ firstInt, secondInt }) => {
    return (firstInt * secondInt).toString();
  },
});

const exponentiateTool = new DynamicStructuredTool({
  name: "exponentiate",
  description: "Exponentiate the base to the exponent power.",
  schema: z.object({
    base: z.number(),
    exponent: z.number(),
  }),
  func: async ({ base, exponent }) => {
    return (base ** exponent).toString();
  },
});

const tools = [addTool, multiplyTool, exponentiateTool];

import * as hub from "langchain/hub";;
const prompt = await hub.pull("hwchase17/openai-tools-agent");
// const prompt = new PromptTemplate({
//     inputVariables: ['agent_scratchpad'],
//     template: `you are a great math agent which has access to mutliple tools such as addtool, multiply tool and exponential tool that you can leverage to give an answer back to user's query`})

import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";

const model = new ChatOpenAI({
  model: "gpt-3.5-turbo-1106",
  temperature: 0,
});

const agent = await createOpenAIToolsAgent({
  llm: model,
  tools,
  prompt,
});

const agentExecutor = new AgentExecutor({
  agent,
  tools,
  verbose: true,
});

await agentExecutor.invoke({
    input:
      "Take 3 to the fifth power and multiply that by the sum of twelve and three, then square the whole result",
  });