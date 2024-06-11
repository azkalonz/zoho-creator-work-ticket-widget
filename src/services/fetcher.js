/*global ZOHO*/
const fetcher = (method, config) =>
  ZOHO.CREATOR.API[method](config).then((res) => res.data);

export default fetcher;
