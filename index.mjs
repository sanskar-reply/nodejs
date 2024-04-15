import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createRetrieverTool } from "langchain/tools/retriever";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { pull } from "langchain/hub";
// import * as hub from "langchain/hub";;
import { createOpenAIFunctionsAgent } from "langchain/agents";
import { AgentExecutor } from "langchain/agents";

const loader = new CheerioWebBaseLoader(
"https://www.mclaren.com/racing/formula-1/2024/japanese-grand-prix/mclaren-racing-and-vuse-announce-driven-by-change-livery/"
);
const rawDocs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
const docs = await splitter.splitDocuments(rawDocs);

const vectorstore = await MemoryVectorStore.fromDocuments(
  docs,
  new OpenAIEmbeddings()
);
const retriever = vectorstore.asRetriever();

const retrieverResult = await retriever.getRelevantDocuments(
  "how to upload a dataset"
);
console.log(retrieverResult[0]);

const prompt = await pull<ChatPromptTemplate>(
  "hwchase17/openai-functions-agent"
);

// const prompt = "You are an helpful chat agent that uses docs in your memory to answer questions"
const retrieverTool = createRetrieverTool(retriever, {
  name: "japanese grand prix search",
  description:
    "Search for information about japanese grand prix. For any questions about grand prix, you must use this tool!",
});
const tools = [retrieverTool];

const llm = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0,
});

// Get the prompt to use - you can modify this!
// If you want to see the prompt in full, you can at:
// https://smith.langchain.com/hub/hwchase17/openai-functions-agent

const agent = await createOpenAIFunctionsAgent({
  llm,
  tools,
  prompt,
});

const agentExecutor = new AgentExecutor({
  agent,
  tools,
});

const result1 = await agentExecutor.invoke({
  input: "hi!",
});

console.log(result1);