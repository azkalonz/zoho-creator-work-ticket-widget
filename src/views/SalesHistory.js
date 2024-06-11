import { Button } from "@mui/material";
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import creatorConfig from "../lib/creatorConfig";

function SalesHistory(props) {
  useEffect(() => {
    creatorConfig({
      reportName: "All_Items",
      page: 1,
      pageSize: 10,
    });
    ZOHO.CREATOR.API.getAllRecords(config).then(function (response) {
      console.log("t", response);
    });
  }, []);

  return (
    <div>
      <Link to="/test">
        <Button color="primary" variant="contained">
          Nav Test
        </Button>
      </Link>
    </div>
  );
}

export default SalesHistory;
