import useSWRMutation from "swr/mutation";
import { zohoCreatorApi, zohoInventoryApi } from "./api";
import { zoho_client } from "./fetcher";

export function useAddRecordMutation() {
  return useSWRMutation("addRecord", zohoCreatorApi);
}

export function useUpdateRecordMutation() {
  return useSWRMutation("updateRecord", zohoCreatorApi);
}

export function useDeleteRecordMutation() {
  return useSWRMutation("deleteRecord", zohoCreatorApi);
}

export function useCreateBundleMutation() {
  return useSWRMutation(`bundles?organization_id=${zoho_client.org_id}&method=POST`, zohoInventoryApi);
}

export function useDeleteBundleMutation(id) {
  return useSWRMutation(`bundles/${id}?organization_id=${zoho_client.org_id}&method=DELETE`, zohoInventoryApi);
}
