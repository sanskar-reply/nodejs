import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { formatDocumentsAsString } from "langchain/util/document";
import { PromptTemplate } from "@langchain/core/prompts";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatOpenAI({});

const vectorStore = await HNSWLib.fromTexts(
  ["norris is a british racing driver"],
  [{ id: 1 }],
  new OpenAIEmbeddings()
);
const retriever = vectorStore.asRetriever();

const prompt =
  PromptTemplate.fromTemplate(`Answer the question based only on the following context:
{context}

Question: {question}`);

const chain = RunnableSequence.from([
  {
    context: retriever.pipe(formatDocumentsAsString),
    question: new RunnablePassthrough(),
  },
  prompt,
  model,
  new StringOutputParser(),
]);

const result = await chain.invoke("Who is oscar?");

console.log(result);

async function appendText() {
    const userInput = document.getElementById('user-input').value;
    const outputContainer = document.getElementById('output-container');
  
    try {
      // Invoke the LangChain agent with user input
      const result = await chain.invoke(userInput);
  
      const newEntry = document.createElement('p');
      newEntry.innerText = `Input: ${userInput} \nOutput: ${result}`;
      outputContainer.appendChild(newEntry);
    } catch (error) {
      console.error("Error invoking LangChain agent:", error);
      // Handle errors gracefully (e.g., display an error message to the user)
    }
  
    document.getElementById('user-input').value = '';
  }

  