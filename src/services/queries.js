import useSWR from "swr";
import fetcher from "./fetcher";

export function useAllItems(config) {
  return useSWR(["getAllRecords", config], ([method, config]) =>
    fetcher(method, config)
  );
}
