import { zohoApiFetcher } from "./fetcher";

export const zohoCreatorApi = async (method, { arg }) => {
  const { callback, ...config } = arg;
  /*global ZOHO*/
  const response = await ZOHO.CREATOR.API[method](config).catch((q) => {
    console.error(q);
  });
  if (typeof callback === "function") {
    callback(response);
  }
  return response;
};

export const zohoInventoryApi = async (endpoint, { arg }) => {
  const { callback, ...requestData } = arg;
  requestData.api = "ZOHO_INVENTORY";
  const response = await zohoApiFetcher(endpoint, requestData);
  if (typeof callback === "function") {
    callback(response);
  }
  return response;
};

export const zohoApi = async (endpoint, { arg }) => {
  const { callback, ...requestData } = arg || {};
  requestData.api = "ROOT";
  const response = await zohoApiFetcher(endpoint, requestData);
  if (typeof callback === "function") {
    callback(response);
  }
  return response;
};
