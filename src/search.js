async function search() {
const projectId = 'mrl-mrt-s-prj-visualisation';
const location = 'global';              // Options: 'global', 'us', 'eu'
const collectionId = 'default_collection';     // Options: 'default_collection'
const dataStoreId = 'quali_1713191117703'
const servingConfigId = 'default_config';      // Options: 'default_config'
const searchQuery = 'what was lando\'s time for quali in Q1 and Q2?'; // edit for user input coming here

const {SearchServiceClient} = require('@google-cloud/discoveryengine').v1beta;

// For more information, refer to:
// https://cloud.google.com/generative-ai-app-builder/docs/locations#specify_a_multi-region_for_your_data_store
const apiEndpoint =
  location === 'global'
    ? 'discoveryengine.googleapis.com'
    : `${location}-discoveryengine.googleapis.com`;

// Instantiates a client
const client = new SearchServiceClient({apiEndpoint: apiEndpoint});


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
    // Warning: Should always disable autoPaginate to avoid iterate through all pages.
    //
    // By default NodeJS SDK returns an iterable where you can iterate through all
    // search results instead of only the limited number of results requested on
    // pageSize, by sending multiple sequential search requests page-by-page while
    // iterating, until it exhausts all the search results. This will be unexpected and
    // may cause high Search API usage and long wait time, especially when the matched
    // document numbers are huge.
    autoPaginate: false,
  });
  const results = response[IResponseParams.ISearchResponse].results;

  const formattedResults = [];

  for (const result of results) {
    const documentData = result.document.structData.fields;
    const formattedData = {};

    // Assuming your structData fields have keys matching the desired output format
    for (const key in documentData) {
      formattedData[key] = documentData[key].stringValue || documentData[key].numberValue; 
      // Adapt this based on the actual data types in your structData
    }

    formattedResults.push(formattedData);
  }

  console.log(formattedResults); // This will now output the data in the desired format
}

search()