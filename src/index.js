import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import React from "react";
import ReactDOM from "react-dom/client";
import { SWRConfig } from "swr";
import App from "./App";
import { disableRevalidation } from "./utils";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import fetcher from "./services/fetcher";

/*global ZOHO*/
console.log("t", ZOHO);
ZOHO.CREATOR.init().then(function () {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <SWRConfig
        value={{
          fetcher,
          ...disableRevalidation(),
        }}
      >
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <App />
        </LocalizationProvider>
      </SWRConfig>
    </React.StrictMode>
  );
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
