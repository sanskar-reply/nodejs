import { VertexAI } from "@google-cloud/vertexai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// Initialize Vertex with your Cloud project and location
const vertex_ai = new VertexAI({
  project: "gen-ai-sandbox",
  location: "us-central1",
});
const model = "gemini-1.5-pro-preview-0409";

// Instantiate the models
const generativeModel = vertex_ai.preview.getGenerativeModel({
  model: model,
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 1,
    topP: 0.95,
  },
  safetySettings: [
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
  ],
});

const chat = generativeModel.startChat({});
const searchQuery = "tell me about the two races in 2020";
// const searchQuery = "give me some memorable moments at the bahrain grand prix"; 
const searchQuery2 = "what is the circuit name?"; 
// const searchQuery = "what was my first question?"; 

async function sendMessage(message) {
  const streamResult = await chat.sendMessageStream(message);
  process.stdout.write(
    "stream result: " +
      JSON.stringify((await streamResult.response).candidates[0].content) +
      "\n"
  );
}

async function generateContent(result) {
  if (result.length > 0) {
    const relevantDocument = result[0].pageContent;

    const prompt = `Based on the following information, write a short summary about ${searchQuery} and the response returned:

    ${relevantDocument}

    Summary:`;

    const response = await sendMessage(prompt);
    console.log("Generated Content:\n", response);
  } else {
    console.log("No relevant documents found for the query.");
  }
}

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

  // Perform similarity search
  const resultOne = await vectorStore.similaritySearch(searchQuery, 1);
  const resulttwo = await vectorStore.similaritySearch(searchQuery2, 1);
  // Generate content based on the search result
  await generateContent(resultOne);
  await generateContent(resulttwo);
}

// Call the function to execute the code
processPDFs();
