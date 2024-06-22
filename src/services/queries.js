import useSWR from "swr";
import fetcher, { creatorMultiApiFetcher, zohoApiFetcher, zohoMultiApiFetcher } from "./fetcher";
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
  return useSWR(
    !keyword ? null : `items?search_text=${keyword}&page=1&per_page=10`,
    (url) => zohoApiFetcher(url, { api: "ZOHO_INVENTORY" }),
    {
      shouldRetryOnError: false,
      errorRetryCount: 1,
    }
  );
}

export function useGetCompositeItem(id) {
  return useSWR(id ? `compositeitems/${id}` : null, (url) => zohoApiFetcher(url, { api: "ZOHO_INVENTORY" }), {
    shouldRetryOnError: false,
    errorRetryCount: 1,
  });
}

export function useGetItemSalesOrders(id) {
  return useSWR(
    !id
      ? null
      : ["confirmed"].map((status) =>
          `items/transactions/salesorders?page=1&per_page=200&sort_order=D&sort_column=date&item_id=${id}&status=${status}`.replaceAll(
            "&",
            "%26"
          )
        ),
    zohoMultiApiFetcher
  );
}

export function useGetAllRecordsMulti(configs) {
  return useSWR(!configs ? null : configs.map((q) => ({ ...q, method: "getAllRecords" })), (configs) =>
    creatorMultiApiFetcher(configs).then((q) => q.filter((q) => !!q))
  );
}
