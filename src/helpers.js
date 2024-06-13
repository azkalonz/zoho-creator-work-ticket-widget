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

export function formatCurrency(value) {
  var number = value;

  var options = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
    currency: "USD",
  };
  var formattedNum = number.toLocaleString("en-US", options);

  return formattedNum;
}
