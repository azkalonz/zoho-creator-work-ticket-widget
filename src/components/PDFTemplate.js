import { Grid, Typography } from "@mui/material";
import React from "react";

import "./pdfTemplate.scss";
import moment from "moment";
import { settings } from "../settings";

function PDFTemplate(props) {
  const { componentRef, ...restProps } = props;
  const {
    SKU,
    Ticket_Completed,
    Work_Ticket_No,
    Created_By: { Name: { display_value: createdBy } } = {},
    Status,
    Date_field,
    Ticket_Started,
    description,
    cf_production_cell,
    cf_pre_cut_length,
  } = restProps.workTicket.currentWorkTicket;

  const { qtyToBuild, components } = restProps.workTicket;

  return (
    <Grid ref={componentRef} container className="pdf-template" rowGap={2}>
      <Grid item xs={6}>
        <Typography>Autoline Industries</Typography>
        <Typography>254 W Broadway Road</Typography>
        <Typography>Mesa, AZ 85210</Typography>
        <Typography>United States</Typography>
      </Grid>
      <Grid item xs={6} alignItems="end" display="flex" flexDirection="column">
        <Typography variant="h4">Work Ticket</Typography>
        <Typography>Work Ticket Number: #{Work_Ticket_No}</Typography>
        <Typography>Work Ticket Date: {moment(Ticket_Started || Date_field).format("ll")}</Typography>
        <Typography>Needed By: {Ticket_Completed && moment(Ticket_Completed).format("ll")}</Typography>
      </Grid>

      <Grid container className="outlined centered">
        <Grid item xs={12}>
          Assembly Description
        </Grid>
        <Grid item xs={12}>
          {description}
        </Grid>
        <Grid container xs={4}>
          <Grid item xs={12}>
            Assembly ID
          </Grid>
          <Grid item xs={12}>
            {SKU}
          </Grid>
        </Grid>
        <Grid container xs={4}>
          <Grid item xs={12}>
            Qty to Build
          </Grid>
          <Grid item xs={12}>
            {parseFloat(qtyToBuild).toFixed(settings.quantity_precision)}
          </Grid>
        </Grid>
        <Grid container xs={4}>
          <Grid item xs={12}>
            Created By
          </Grid>
          <Grid item xs={12}>
            {createdBy}
          </Grid>
        </Grid>

        <Grid container xs={4}>
          <Grid item xs={12}>
            Ticket Status
          </Grid>
          <Grid item xs={12}>
            {Status}
          </Grid>
        </Grid>
        <Grid container xs={4}>
          <Grid item xs={12}>
            Dimensional Requirements
          </Grid>
          <Grid item xs={12}>
            Refer to Print
          </Grid>
        </Grid>
        <Grid container xs={4}>
          <Grid item xs={12}>
            Production Cell
          </Grid>
          <Grid item xs={12}>
            {cf_production_cell}
          </Grid>
        </Grid>

        <Grid container xs={4}>
          <Grid item xs={12}>
            Material Cut Length
          </Grid>
          <Grid item xs={12}>
            {cf_pre_cut_length}
          </Grid>
        </Grid>
        <Grid container xs={4}>
          <Grid item xs={12}>
            Material Order Date
          </Grid>
          <Grid item xs={12}></Grid>
        </Grid>
        <Grid container xs={4}>
          <Grid item xs={12}>
            Material Order PO
          </Grid>
          <Grid item xs={12}></Grid>
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Typography>Notes:</Typography>
      </Grid>

      <Grid container xs={12} className="outlined bold">
        <Grid item xs={3} style={{ justifyContent: "center" }}>
          <Typography>Component ID</Typography>
        </Grid>
        <Grid item xs={5} style={{ justifyContent: "center" }}>
          <Typography>Description</Typography>
        </Grid>
        <Grid item xs={1} style={{ justifyContent: "center" }}>
          <Typography>Qty Req.</Typography>
        </Grid>
        <Grid item xs={1} style={{ justifyContent: "center" }}>
          <Typography>On Hand</Typography>
        </Grid>
        <Grid item xs={1} style={{ justifyContent: "center" }}>
          <Typography>Qty Avail</Typography>
        </Grid>
        <Grid item xs={1} style={{ justifyContent: "center" }}>
          <Typography>Status</Typography>
        </Grid>
        {components.map(({ sku, description, stock_on_hand, required, available }) => (
          <>
            <Grid item xs={3}>
              <Typography>{sku}</Typography>
            </Grid>
            <Grid item xs={5}>
              <Typography>{description}</Typography>
            </Grid>
            <Grid item xs={1}>
              <Typography>{parseFloat(required).toFixed(settings.quantity_precision)}</Typography>
            </Grid>
            <Grid item xs={1}>
              <Typography>{parseFloat(stock_on_hand).toFixed(settings.quantity_precision)}</Typography>
            </Grid>
            <Grid item xs={1}>
              <Typography>{parseFloat(available).toFixed(settings.quantity_precision)}</Typography>
            </Grid>
            <Grid item xs={1}>
              <Typography></Typography>
            </Grid>
          </>
        ))}
      </Grid>
      <Grid item xs={12} textAlign="center">
        <Typography>Below fields for Assembly Only. Reference Production Tracker for Manufacturing Jobs</Typography>
      </Grid>
      <Grid item xs={6}>
        <Typography>Confirm Qty Built ________________</Typography>
        <Typography>Completed By ________________</Typography>
      </Grid>

      <Grid item xs={6} alignItems="end" display="flex" flexDirection="column">
        <Typography>Start Date & Time ________________</Typography>
        <Typography>Complete Date & Time ________________</Typography>
        <Typography>Total Hours ________________</Typography>
      </Grid>
    </Grid>
  );
}

export default PDFTemplate;
