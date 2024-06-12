function revalidation(revalidation) {
  return {
    revalidateOnFocus: revalidation,
    revalidateOnReconnect: revalidation,
    refreshWhenOffline: revalidation,
    refreshWhenHidden: revalidation,
    ...(revalidation ? {} : { refreshInterval: 0 }),
  };
}

export function disableRevalidation() {
  return revalidation(false);
}

export function enableRevalidation() {
  return revalidation(true);
}
