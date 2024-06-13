import useSWR from "swr";
import fetcher, { zohoApiFetcher } from "./fetcher";
import creatorConfig from "../lib/creatorConfig";

export function useGetAllRecords(config) {
  return useSWR(["getAllRecords", config], ([method, config]) => fetcher(method, config));
}

export function useGetRecordById(reportName, id) {
  return useSWR(
    reportName && id
      ? [
          "getRecordById",
          creatorConfig({
            reportName,
            id,
          }),
        ]
      : null,
    ([method, config]) => fetcher(method, config)
  );
}

export function useGetRecordCount(config) {
  return useSWR(["getRecordCount", config], ([method, config]) => fetcher(method, config));
}

export function useSearchItem(keyword) {
  return useSWR(!keyword ? null : `items?search_text=${keyword}&page=1&per_page=10`, zohoApiFetcher, {
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
