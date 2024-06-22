import axios from "axios";
import { settings } from "../settings";

/*global ZOHO*/
const fetcher = (method, config) => ZOHO.CREATOR.API[method](config).then((res) => res.data || res.result);

export const zohoAxiosInstance = axios.create({
  baseURL: "https://ksportusa.com/zoho/zohoapi.php",
  headers: {
    "Content-type": "application/json",
  },
});
export const zohoApiFetcher = (url, args = {}) => {
  switch (args.api) {
    case "ZOHO_INVENTORY":
      url = "?url=https://www.zohoapis.com/inventory/v1/" + url;
      if (url.indexOf("organization_id") < 0) {
        url += url.indexOf("?") >= 0 ? `&organization_id=${settings.org_id}` : `?organization_id=${settings.org_id}`;
      }
      url = encodeURI(url);
      break;
  }
  args.url = url;
  return zohoAxiosInstance(args).then((res) => res.data);
};

export function zohoMultiApiFetcher(urls, api = "ZOHO_INVENTORY") {
  return Promise.all(urls.map((url) => zohoApiFetcher(url, { api })));
}

export function creatorMultiApiFetcher(configs) {
  return Promise.all(configs.map(({ method, ...config }) => fetcher(method, config).catch((q) => console.error(q))));
}

export default fetcher;
