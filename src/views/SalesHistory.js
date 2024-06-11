import { Button } from "@mui/material";
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import creatorConfig from "../lib/creatorConfig";

function SalesHistory(props) {
  console.log(props.match);
  useEffect(() => {
    let config = creatorConfig({
      reportName: "All_Items",
      page: 1,
      pageSize: 10,
    });
    /*global ZOHO*/
    ZOHO.CREATOR.API.getAllRecords(config).then(function (response) {
      console.log("t", response);
    });
  }, []);

  return (
    <div>
      <Link to="/test">
        <Button color="primary" variant="contained">
          Testing
        </Button>
      </Link>
      <Link to="/">
        <Button color="primary" variant="contained">
          Testing 2
        </Button>
      </Link>
    </div>
  );
}

export default SalesHistory;
