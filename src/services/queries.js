import useSWR from "swr";
import fetcher, { zohoApiFetcher, zoho_client } from "./fetcher";

export function useGetAllRecords(config) {
  return useSWR(["getAllRecords", config], ([method, config]) => fetcher(method, config));
}

export function useGetRecordCount(config) {
  return useSWR(["getRecordCount", config], ([method, config]) => fetcher(method, config));
}

export function useSearchItem(keyword) {
  return useSWR(`items?search_text=${keyword}&page=1&per_page=10`, zohoApiFetcher, {
    shouldRetryOnError: false,
    errorRetryCount: 1,
  });
}

export function useGetCompositeItem(id) {
  return useSWR(id ? `compositeitems/${id}` : null, zohoApiFetcher, {
    shouldRetryOnError: false,
    errorRetryCount: 1,
  });
}
