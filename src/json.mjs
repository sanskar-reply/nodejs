import { createOpenAIFunctionsAgent, AgentExecutor } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";
import { DynamicTool } from "@langchain/core/tools";
import * as hub from "langchain/hub";

const llm = new ChatOpenAI({
    model: "gpt-3.5-turbo",
    temperature: 0,
  });

  const query = "What's the weather in London?";
const jsonData = {
  "city": "London",
  "temperature": 15,
  "conditions": "Cloudy",
};

const prompt = await hub.pull("hwchase17/openai-tools-agent");

async function summarizeJsonResult(query, jsonData) {
  const agent = await createOpenAIFunctionsAgent({
    llm,
    prompt,
  });
  
  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    verbose: true,
  });

  const result2 = await agentExecutor.invoke({
    input: `{query} Can you summarize this JSON data for me: {data}`,
  });
  
  console.log(`Got output ${result2.output}`);
}

summarizeJsonResult(query, jsonData)
  .then(summary => console.log(summary))
  .catch(error => console.error(error));