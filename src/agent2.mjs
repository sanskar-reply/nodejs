// agent implementation with all the right tools, most up to date
import { ChatOpenAI } from "@langchain/openai";
import { DynamicTool } from "@langchain/core/tools";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { convertToOpenAIFunction } from "@langchain/core/utils/function_calling";
import { RunnableSequence } from "@langchain/core/runnables";
import { AgentExecutor } from "langchain/agents";
import { formatToOpenAIFunctionMessages } from "langchain/agents/format_scratchpad";
import { OpenAIFunctionsAgentOutputParser } from "langchain/agents/openai/output_parser";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";

// Define chat model
const model = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0,
});

// Define custom tool
const VertexSearchTool = new DynamicTool({
  name: "VertexSearchTool",
  description:
    "Use this tool whenever user asks to Search for information on a formula 1 drivers using Vertex AI Search, for example if the query is of the ",
  func: async function search(input) {
    const projectId = "mrl-mrt-s-prj-visualisation";
    const location = "global"; // Options: 'global', 'us', 'eu'
    const collectionId = "default_collection"; // Options: 'default_collection'
    const dataStoreId = "quali_1713191117703";
    const servingConfigId = "default_config"; // Options: 'default_config'
    const searchQuery = input; // edit for user input coming here

    const { SearchServiceClient } =
      require("@google-cloud/discoveryengine").v1beta;
    // https://cloud.google.com/generative-ai-app-builder/docs/locations#specify_a_multi-region_for_your_data_store
    const apiEndpoint =
      location === "global"
        ? "discoveryengine.googleapis.com"
        : `${location}-discoveryengine.googleapis.com`;

    // Instantiates a client
    const client = new SearchServiceClient({ apiEndpoint: apiEndpoint });

    // The full resource name of the search engine serving configuration.
    // Example: projects/{projectId}/locations/{location}/collections/{collectionId}/dataStores/{dataStoreId}/servingConfigs/{servingConfigId}
    // You must create a search engine in the Cloud Console first.
    const name = client.projectLocationCollectionDataStoreServingConfigPath(
      projectId,
      location,
      collectionId,
      dataStoreId,
      servingConfigId
    );

    const request = {
      pageSize: 10,
      query: searchQuery,
      servingConfig: name,
    };

    const IResponseParams = {
      ISearchResult: 0,
      ISearchRequest: 1,
      ISearchResponse: 2,
    };

    // Perform search request
    const response = await client.search(request, {
      autoPaginate: false,
    });
    const results = response[IResponseParams.ISearchResponse].results;

    const formattedResults = [];

    for (const result of results) {
      const documentData = result.document.structData.fields;
      const formattedData = {};

      // Assuming your structData fields have keys matching the desired output format
      for (const key in documentData) {
        formattedData[key] =
          documentData[key].stringValue || documentData[key].numberValue;
        // Adapt this based on the actual data types in your structData
      }

      formattedResults.push(formattedData);
    }

    console.log(formattedResults); // This will now output the data in the desired format
  },
});

function testing (){
  console.log('just logging hello')
}

const testTool = new DynamicTool({
  name: "testTool",
  description:
    "This tools is used whenever a user wants to run a test their query/input or a thought they have just had",

    func: async function testToolFunction(){
      testing();
    }
})

const RAGtool = new DynamicTool({
  name: "RAGtools",
  description:
    "Use this tool whenever user asks to Search for infomration on a formula 1 drivers using the uplaoded documents",
//     import { VertexAI } from "@google-cloud/vertexai";
// import { MemoryVectorStore } from "langchain/vectorstores/memory";
// import { OpenAIEmbeddings } from "@langchain/openai";
// import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
// import { PDFLoader } from "langchain/document_loaders/fs/pdf";
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
func: async function ragTool(input) {

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

    const prompt = `Based on the following information, write a short summary about ${searchQuery} and the resposne returned:

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
}
});

const EdgeCaseTool = new DynamicTool({
  name: "EdgeCaseTool",
  description:
    "Use this tool whenever user asks irrelevant questions, i.e. questions that are not related to eithe McLaren Racing, Lanod Norris, Oscar Poiastri or Formula 1. Remind the user to ask quetsions only related to these topics. You are very clever, handle these kind of responses with caution.",
  func: async function search(input) {
    const lowerCaseInput = input.toLowerCase();

    // Check for keywords related to McLaren Racing or Formula 1
    if (
      lowerCaseInput.includes("mclaren") ||
      lowerCaseInput.includes("formula 1") ||
      lowerCaseInput.includes("f1") ||
      lowerCaseInput.includes("racing") ||
      lowerCaseInput.includes("grand prix")
    ) {
      // Input is relevant, so we can proceed with normal processing (not shown here)
      return "Relevant input: Processing..."; // Replace with your actual processing logic
    } else {
      // Input is irrelevant, use the LLM to generate a response
      const prompt = `The user asked an irrelevant question: ${input}. Respond smartly and guide them back to the topic of McLaren Racing or Formula 1. Be creative and avoid repeating the same response too often.`;

      // Replace this with your actual LLM API call
      const response = await executorWithMemory.invoke({
        input: prompt,
        chatHistory: chatHistory,
      });

      return response;
    }
  },
});

// Make all the tools available
const tools = [VertexSearchTool, RAGtool, testTool];

// Define prompt template
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a very powerful chat assistant called Freddie. You only answer questions on McLaren Racing and Formula 1. you can use toos like vertexsearchtool to answer user queries. If a user wants to test a theory, invoke the testTool and give back a response",
  ],
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

// Bind functions to model
const modelWithFunctions = model.bind({
  functions: tools.map((tool) => convertToOpenAIFunction(tool)),
});

// Create runnable agent sequence
const runnableAgent = RunnableSequence.from([
  {
    input: (i) => i.input,
    agent_scratchpad: (i) => formatToOpenAIFunctionMessages(i.steps),
  },
  prompt,
  modelWithFunctions,
  new OpenAIFunctionsAgentOutputParser(),
]);

// Create agent executor wihtout memory
const executor = AgentExecutor.fromAgentAndTools({
  agent: runnableAgent,
  tools,
});

const MEMORY_KEY = "chat_history";
const memoryPrompt = ChatPromptTemplate.fromMessages([
  ["system", "You are very powerful assistant, with excellent memory"],
  new MessagesPlaceholder(MEMORY_KEY),
  ["user", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

const chatHistory = [];

// Create agent executor with memory
const agentWithMemory = RunnableSequence.from([
  {
    input: (i) => i.input,
    agent_scratchpad: (i) => formatToOpenAIFunctionMessages(i.steps),
    chat_history: (i) => i.chat_history,
  },
  memoryPrompt,
  modelWithFunctions,
  new OpenAIFunctionsAgentOutputParser(),
]);

const executorWithMemory = AgentExecutor.fromAgentAndTools({
  agent: agentWithMemory,
  tools,
});

async function updateChatHistory(input, output) {
  chatHistory.push(new HumanMessage(input));
  chatHistory.push(new AIMessage(output));
}

async function processInputAndAddToChatHistory(input) {
  const result = await executorWithMemory.invoke({
    input,
    chat_history: chatHistory,
  });
  await updateChatHistory(result.input, result.output);
  console.log(result);
}

// Example usage:
await processInputAndAddToChatHistory("I would like to test a theory, I think we live in a simulation");
await processInputAndAddToChatHistory("Who is lando?");
await processInputAndAddToChatHistory("What is his age?");
await processInputAndAddToChatHistory("who are we talking about??");
await processInputAndAddToChatHistory("What was my second questions?");
await processInputAndAddToChatHistory("tell em a joke");

async function uploadDocs() {
  console.log(`helo`);
  // Get the selected files from the file input element
  const fileInput = document.getElementById("fileInput"); // Replace 'fileInput' with the actual ID of your file input element
  const files = fileInput.files;

  // Create an array to store the documents
  const docs = [];

  // Iterate over the selected files and process each one
  for (const file of files) {
    // Check if the file is a PDF
    if (file.type === "application/pdf") {
      // Create a new PDFLoader instance for the file
      const pdfLoader = new PDFLoader(file);

      // Load the PDF document
      const doc = await pdfLoader.load();

      // Add the document to the docs array
      docs.push(doc);
    } else {
      // Handle non-PDF files (e.g., display an error message)
      console.error("Invalid file type:", file.type);
    }
  }

  // Split the documents into chunks using the RecursiveCharacterTextSplitter
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const splitDocs = await textSplitter.splitDocuments(docs);

  // Load the documents into the vector store
  const vectorStore = await MemoryVectorStore.fromDocuments(
    docs,
    new OpenAIEmbeddings()
  );
}

// TODO
// add a function for chathistory append after each input-output pair done
// add a prompt template for better agent routing through tools 
// call function that uplaods the files and stores in a Vector database 
// add rag tool function to process pdfs from gemenilongcontextwindow to main
