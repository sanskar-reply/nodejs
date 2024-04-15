import { PromptTemplate } from "@langchain/core/prompts";
import { createOpenAIFunctionsAgent, AgentExecutor } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";
import { DynamicTool } from "@langchain/core/tools";

// Define tools for McLaren/F1 and Edge Cases
const tools = [
  new DynamicTool({
    name: "F1Knowledgetool",
    description: "Useful for answering questions about McLaren and Formula 1.",
    // Define your prompt template for the F1 tool
    prompt: PromptTemplate.fromTemplate(
      "Answer the following question about McLaren or Formula 1: {query}"
    ),
    // Define your output parser for the F1 tool
    func: async (query) => {
      // Implement your logic to query F1 knowledge base (e.g., using APIs or databases)
      // and return the answer as a string
    },
  }),

  new DynamicTool({
    name: "EdgeCaseHandlertool",
    description:
      "Useful for handling edge case questions outside of McLaren and Formula 1.",
    // Define your prompt template for the edge case tool
    prompt: PromptTemplate.fromTemplate(
      "Answer the following question: {query}"
    ),
    // Define your output parser for the edge case tool
    func: async (query) => {
      // Implement your logic to query a general knowledge base (e.g., search engine APIs)
      // and return the answer as a string
    },
  }),
];

// Initialize LLM
const llm = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0,
});
const prompt = new PromptTemplate({
  inputVariables: ["agent_scratchpad"],
  template: `You are a knowledgeable AI assistant specializing in McLaren and Formula 1. 
      You have access to tools like 'VertexSearchTool' to find information related to these topics. 
      For McLaren-related queries, use your knowledge and 'VertexSearchTool' to provide accurate and insightful responses. 
      For Formula 1 questions, leverage your understanding of the sport and 'VertexSearchTool' to deliver comprehensive answers.

      However, you also have access to a special tool called 'EdgeCaseHandler' for handling unrelated queries, such as baking recipes or GCP-related topics. 
      If a user's input falls outside the realm of McLaren and Formula 1, utilize 'EdgeCaseHandler' to provide the best possible response or assistance by reminding the user that you only specialise in mclaren and formula 1 racing and you can't answer anything else.

      Remember, your primary focus is McLaren and Formula 1, but you are equipped to handle diverse inquiries effectively.
      `,
});

const agent = await createOpenAIFunctionsAgent({
  llm,
  tools,
  prompt,
});

const agentExecutor = new AgentExecutor({
  agent,
  tools,
  verbose: true,
});

// Use the agent
const edgeCaseInput = await agentExecutor.invoke({
  input: `What is the best recipe for chocolate chip cookies?`,
});

console.log(`Got output ${edgeCaseInput.output}`);
const input = await agentExecutor.invoke({
  input: `Who won the 2022 Monaco Grand Prix?`,
});

console.log(`Got output ${input.output}`);
