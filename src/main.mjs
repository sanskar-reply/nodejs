import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createOpenAIFunctionsAgent, AgentExecutor } from "langchain/agents";
import { PromptTemplate } from "@langchain/core/prompts";
import { DynamicTool } from "@langchain/core/tools";
import { VertexAI } from "@google-cloud/vertexai";
import { z } from "zod";
import * as hub from "langchain/hub";

const llm = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0,
});

const tools = [
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

  new DynamicTool({
    name: "VertexSearchTool",
    description:
      "Search for information on a formula 1 drivers using Vertex AI Search",
    func: async function search() {
      const projectId = "mrl-mrt-s-prj-visualisation";
      const location = "global"; // Options: 'global', 'us', 'eu'
      const collectionId = "default_collection"; // Options: 'default_collection'
      const dataStoreId = "bq-drivers_1712227458255";
      const servingConfigId = "default_config"; // Options: 'default_config'
      const searchQuery = "Google"; // edit for user input coming here

      const { SearchServiceClient } =
        require("@google-cloud/discoveryengine").v1beta;

      // For more information, refer to:
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

      for (const result of results) {
        console.log(result);
      }
    },
  }),
];

// const prompt = new PromptTemplate({
//   inputVariables: ['agent_scratchpad'],
//   template: `You are a helpful AI assistant with access to various tools.
//     You can use 'FOO' to get the value of foo, 'random-number-generator' to generate random numbers,
//     and 'VertexSearchTool' to find information related to specific topics.
//     Based on the user's input, choose the appropriate tool and provide the best response.
//     If the user asks about a specific topic, like 'hamilton', use 'VertexSearchTool' to retrieve relevant information.
//     `,
// });

const prompt = await hub.pull("hwchase17/openai-tools-agent");

// const prompt = ChatPromptTemplate.fromMessages(
//   ["system", "You are an exceptional chat agent called freddie, you specialise in mclaren racing and formula 1. You can answer all the user queries factually. Use {agent_scratchpad} to map out your thinking and reasoning and show it to the user. to keep context of the conversation. "],
//   ["history", "{chat_history}"],
//   ["human", "{input}"],
//   ["placeholder", "{agent_scratchpad}"],
//   ["tool"], ["{VertexSearchTool}"],
// )

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

const result2 = await agentExecutor.invoke({
  input: `Who is hamilton, why is he successful?`,
});

console.log(`Got output ${result2.output}`);

const result3 = await agentExecutor.invoke({
  input: `Who is hamilton, why is he successful?`,
});

console.log(`Got output ${result3.output}`);
