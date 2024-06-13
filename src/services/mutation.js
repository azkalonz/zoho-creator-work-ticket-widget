import useSWRMutation from "swr/mutation";
import { zohoApi } from "./api";

export function useAddRecordMutation() {
  return useSWRMutation("addRecord", zohoApi);
}

export function useUpdateRecordMutation() {
  return useSWRMutation("updateRecord", zohoApi);
}

export function useDeleteRecordMutation() {
  return useSWRMutation("deleteRecord", zohoApi);
}
