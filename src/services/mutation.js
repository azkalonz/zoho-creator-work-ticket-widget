import useSWRMutation from "swr/mutation";
import { settings } from "../settings";
import { zohoApi, zohoCreatorApi, zohoInventoryApi } from "./api";

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
  return useSWRMutation(`bundles?organization_id=${settings.org_id}&method=POST`, zohoInventoryApi);
}

export function useAuthenticateMutation(code) {
  return useSWRMutation(`?code=${code}`, zohoApi);
}

export function useRefreshMutation() {
  return useSWRMutation(`?refresh_token=${settings.api.refresh_token}`, zohoApi);
}

export function useDeleteBundleMutation(id) {
  return useSWRMutation(`bundles/${id}?organization_id=${settings.org_id}&method=DELETE`, zohoInventoryApi);
}
