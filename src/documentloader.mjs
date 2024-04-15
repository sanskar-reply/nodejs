import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAI } from "langchain/llms/openai";

async function processPDFs() {
  // Load all PDFs within the specified directory
  const directoryLoader = new DirectoryLoader("data/", {
    ".pdf": (path) => new PDFLoader(path),
  });

  const docs = await directoryLoader.load();
  // console.log({ docs });

  // Additional steps: Split text into chunks with any TextSplitter
  // You can then use it as context or save it to memory afterwards.
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const splitDocs = await textSplitter.splitDocuments(docs);
  // console.log({ splitDocs });

  // Load the docs into the vector store
  const vectorStore = await MemoryVectorStore.fromDocuments(
    docs,
    new OpenAIEmbeddings()
  );
  // Search for the most similar document
  const resultOne = await vectorStore.similaritySearch("Lando Norris", 1);
  console.log(resultOne);
  async function queryDocs(query) {
    const results = await vectorStore.similaritySearch(query, 3); // Get top k results
    const combinedDocs = results
      .map((result) => result.pageContent)
      .join("\n\n");

    const response = await llm.call(
      `Given the following documents, answer the question: ${query}\n\n${combinedDocs}`
    );
    return response;
  }

  // Set up OpenAI for query answering
  const llm = new OpenAI({ temperature: 0 }); // Adjust temperature as needed

  // Example usage:
  const userQuery = "What is Lando Norris known for?";
  const answer = await queryDocs(userQuery);
  console.log(answer);
}

// Call the function to execute the code
processPDFs();
