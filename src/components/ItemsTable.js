import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import React, { useState } from "react";
import creatorConfig from "../lib/creatorConfig";
import { useGetAllRecords, useGetRecordCount } from "../services/queries";

function ItemsTable() {
  const [globalFilter, setGlobalFilter] = useState();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const { data, isLoading: isItemsLoading } = useGetAllRecords(
    creatorConfig({
      reportName: "All_Items",
      page: pagination.pageIndex,
      pageSize: pagination.pageSize,
      ...(globalFilter ? { criteria: `SKU=="${globalFilter}"` } : {}),
    })
  );
  const { data: totalItems, isLoading: isCountLoading } = useGetRecordCount(
    creatorConfig({
      reportName: "All_Items",
    })
  );
  const isLoading = isCountLoading || isItemsLoading;
  console.log("total", isCountLoading, totalItems);

  const table = useMaterialReactTable({
    columns: [
      {
        accessorKey: "Item_Name",
        header: "Item Name",
      },
      {
        accessorKey: "SKU",
        header: "SKU",
      },
    ],
    data: data || [],
    state: { pagination, isLoading, globalFilter },
    enableGlobalFilter: true,
    manualPagination: true,
    rowCount: totalItems?.records_count,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div>
      <MaterialReactTable table={table} />
    </div>
  );
}

export default ItemsTable;
