import { zohoApiFetcher } from "./fetcher";

export const zohoCreatorApi = async (method, { arg }) => {
  const { callback, ...config } = arg;
  /*global ZOHO*/
  const response = await ZOHO.CREATOR.API[method](config);
  if (typeof callback === "function") {
    callback(response);
  }
  return response;
};

export const zohoInventoryApi = async (endpoint, { arg }) => {
  const { callback, ...requestData } = arg;
  const response = await zohoApiFetcher(endpoint, requestData);
  if (typeof callback === "function") {
    callback(response);
  }
  return response;
};
