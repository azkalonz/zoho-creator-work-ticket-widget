import { Button } from "@mui/material";
import React, { useEffect } from "react";
import creatorConfig from "../lib/creatorConfig";
import { useAllItems } from "../services/queries";

function Main(props) {
  const { data, isLoading } = useAllItems(
    creatorConfig({
      reportName: "All_Items",
      page: 1,
      pageSize: 10,
    })
  );

  if (isLoading) {
    return <>Loading...</>;
  }

  return (
    <div>
      <Button color="primary" variant="contained">
        Testing
      </Button>
      {JSON.stringify(data)}
    </div>
  );
}

export default Main;
