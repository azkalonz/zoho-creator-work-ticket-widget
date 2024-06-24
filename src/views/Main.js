import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import React, { useEffect } from "react";
import useAuth from "../hooks/useAuth.js";
import { useZohoInventoryGetQuery } from "../services/queries";

function Main() {
  const { loggedInUser, users, isReady, settings, suspenseComponent } =
    useAuth();

  if (suspenseComponent()) {
    return suspenseComponent();
  }

  const vars = {
    loggedInUser,
    users,
    settings,
    isReady,
  };

  return (
    <Paper>
      <Grid container gap={3} p={10}>
        {Object.keys(vars).map((key) => (
          <Grid item xs={12} key={key}>
            <Accordion>
              <AccordionSummary>
                <Typography>
                  <Typography variant="h5">{key}</Typography>
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <pre>{JSON.stringify(vars[key], undefined, 2)}</pre>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>
      <InventoryList />
    </Paper>
  );
}

function InventoryList() {
  const inventoryList = useZohoInventoryGetQuery(
    "items?page=1&per_page=200&filter_by=Status.Active&sort_column=name&sort_order=A&usestate=true"
  );
  const { refresh } = useAuth();

  useEffect(() => {
    if (inventoryList.data?.message === "Unauthorized.") {
      refresh.trigger();
    }
  }, [inventoryList]);

  return <>{JSON.stringify(inventoryList.data)}</>;
}

export default Main;
