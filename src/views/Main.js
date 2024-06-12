import {
  Alert,
  Grid,
  InputLabel,
  LinearProgress,
  List,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import creatorConfig from "../lib/creatorConfig";
import { useGetAllRecords, useGetCompositeItem, useGetRecordCount, useSearchItem } from "../services/queries";
import { DatePicker } from "@mui/x-date-pickers";

function Main(props) {
  /*global ZOHO*/
  var { assembly_sku, assembly_id } = ZOHO.CREATOR.UTIL.getQueryParams();
  const [qtyToBuild, setQtyToBuild] = useState(1);
  const { data, isLoading } = useGetAllRecords(
    !assembly_sku
      ? null
      : creatorConfig({
          reportName: "All_Composite_Items",
          page: 1,
          pageSize: 10,
          criteria: `SKU==["${assembly_sku}"]`,
        })
  );
  const { data: lastWorkTicket, isLoading: isLastWorkTicketLoading } = useGetAllRecords(
    creatorConfig({
      reportName: "All_Work_Tickets",
      page: 1,
      pageSize: 1,
    })
  );
  const { data: compositeItem, isLoading: isCompositeItemLoading } = useGetCompositeItem(assembly_id);
  const { data: assemblyItem, isLoading: isAssemblyItemLoading } = useSearchItem(assembly_sku);

  const getComponentDetails = (sku) => {
    if (!compositeItem) return;
    return compositeItem.composite_item.mapped_items.find((q) => q.sku === sku);
  };

  if (isAssemblyItemLoading || isCompositeItemLoading || isLoading || isLastWorkTicketLoading) {
    return <LinearProgress />;
  }

  if (assemblyItem.items?.length <= 0) {
    return <Alert severity="error">{assembly_sku} was not found!</Alert>;
  }

  const workTicketItem = assemblyItem.items[0];
  const workTicketNumber = lastWorkTicket?.length ? parseInt(lastWorkTicket[0].Work_Ticket_No) + 1 : 1;

  if (!assembly_sku) {
    return <Alert severity="info">Search an assembly item to create work ticket.</Alert>;
  }

  return (
    <Paper>
      <Grid container p={4}>
        <Grid item xs={6}>
          <List>
            <ListItemText primary={workTicketItem.sku} secondary="SKU" />
            <ListItemText primary={workTicketItem.name} secondary="Description" />
            <ListItemText primary={workTicketItem.actual_available_stock} secondary="Qty On Hand" />
          </List>
        </Grid>
        <Grid item xs={6} display="flex" flexDirection="column" alignItems="end">
          <InputLabel shrink={false} htmlFor="work-ticket-no">
            <Typography>Work Ticket No.</Typography>
          </InputLabel>
          <TextField
            id="work-ticket-no"
            variant="outlined"
            type="number"
            value={workTicketNumber}
            disabled
            inputProps={{
              style: {
                width: 230,
              },
            }}
          />

          <InputLabel shrink={false} htmlFor="work-ticket-date">
            <Typography>Date</Typography>
          </InputLabel>
          <DatePicker id="work-ticket-date" onChange={(newValue) => console.log(newValue)} />

          <InputLabel shrink={false} htmlFor="qty-to-build">
            <Typography>Qty To Build</Typography>
          </InputLabel>
          <TextField
            id="qty-to-build"
            variant="outlined"
            type="number"
            onChange={(e) => {
              setQtyToBuild(e.target.value);
            }}
            inputProps={{
              style: {
                width: 230,
              },
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Required</TableCell>
                <TableCell>On Hand</TableCell>
                <TableCell>Available</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.map((d) => {
                const { actual_available_stock, name, sku, quantity } = getComponentDetails(d.Mapped_Item_SKU);
                return (
                  <TableRow key={d.Mapped_Item_SKU}>
                    <TableCell>{sku}</TableCell>
                    <TableCell>{name}</TableCell>
                    <TableCell>{quantity}</TableCell>
                    <TableCell>{actual_available_stock}</TableCell>
                    <TableCell>{actual_available_stock - quantity * qtyToBuild}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default Main;
