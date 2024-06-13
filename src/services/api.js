export const zohoApi = async (method, { arg }) => {
  const { callback, ...config } = arg;
  /*global ZOHO*/
  const response = await ZOHO.CREATOR.API[method](config);
  if (typeof callback === "function") {
    callback(response);
  }
  return response;
};
