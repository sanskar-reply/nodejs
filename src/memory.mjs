//testing and immplementing memory 

// import { ChatOpenAI } from "@langchain/openai";
// import { ConversationSummaryMemory } from "langchain/memory";
// import { LLMChain } from "langchain/chains";
// import { PromptTemplate } from "@langchain/core/prompts";

// export const run = async () => {
//   const memory = new ConversationSummaryMemory({
//     memoryKey: "chat_history",
//     llm: new ChatOpenAI({ model: "gpt-3.5-turbo", temperature: 0 }),
//   });

//   const model = new ChatOpenAI();
//   const prompt =
//     PromptTemplate.fromTemplate(`The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.

//   Current conversation:
//   {chat_history}
//   Human: {input}
//   AI:`);
//   const chain = new LLMChain({ llm: model, prompt, memory });

//   const res1 = await chain.call({ input: "Hi! I'm Jim." });
//   console.log({ res1, memory: await memory.loadMemoryVariables({}) });

//   const res2 = await chain.call({ input: "What's my name?" });
//   console.log({ res2, memory: await memory.loadMemoryVariables({}) });
// };

// run()
import { createOpenAIFunctionsAgent, AgentExecutor } from "langchain/agents";

const memory = {
  chat_history: [],
};

// Function to add new interactions to memory
function addToMemory(input, output) {
  memory.chat_history.push({ role: "human", content: input });
  memory.chat_history.push({ role: "assistant", content: output });
}

// ... your tools and prompt definition ...
const agent = createOpenAIFunctionsAgent({ llm, tools, prompt }); 

const agentExecutor = new AgentExecutor({
  agent,
  tools,
  verbose: true,
});

async function runAgent(input) {
  const result = await agentExecutor.invoke({ input });
  console.log(`Got output ${result.output}`);

  // Add interaction to memory
  addToMemory(input, result.output);

  // You can now access past interactions from memory.chat_history
}

// Example usage
runAgent("Who is Hamilton?");
runAgent("What was the question I asked before?"); // This will now work