import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import React from "react";
import creatorConfig from "../lib/creatorConfig";
import {
  useGetAllRecords,
  useSearchZohoInventoryItem,
} from "../services/queries";

function Main(props) {
  /*global ZOHO*/
  var { assembly_sku } = ZOHO.CREATOR.UTIL.getQueryParams();
  const { data, isLoading } = useGetAllRecords(
    creatorConfig({
      reportName: "All_Composite_Items",
      page: 1,
      pageSize: 10,
      ...(assembly_sku ? { criteria: `SKU==["${assembly_sku}"]` } : {}),
    })
  );
  console.log(data);
  const { data: d, isLoading: i } = useSearchZohoInventoryItem("voo-ten");

  return (
    <>
      <Grid container>
        <Grid item xs={6}></Grid>
        <Grid item xs={6}></Grid>
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
              {data?.map((d) => (
                <TableRow key={d.Mapped_Item_SKU}>
                  <TableCell>{d.Mapped_Item_SKU}</TableCell>
                  <TableCell>{d.Mapped_Item_SKU}</TableCell>
                  <TableCell>{d.Mapped_Item_SKU}</TableCell>
                  <TableCell>{d.Mapped_Item_SKU}</TableCell>
                  <TableCell>{d.Mapped_Item_SKU}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Grid>
      </Grid>
    </>
  );
}

export default Main;
