import { AddOutlined, DeleteOutline, PrintOutlined, SaveOutlined } from "@mui/icons-material";
import {
  Alert,
  AppBar,
  Autocomplete,
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  Grid,
  InputLabel,
  LinearProgress,
  List,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { formatCurrency } from "../helpers.js";
import useConfirmDialog from "../hooks/useConfirmDialog";
import creatorConfig from "../lib/creatorConfig";
import {
  useAddRecordMutation,
  useCreateBundleMutation,
  useDeleteBundleMutation,
  useUpdateRecordMutation,
} from "../services/mutation";
import { useGetAllRecords, useGetCompositeItem, useGetRecordById, useSearchItem } from "../services/queries";
import { useReactToPrint } from "react-to-print";
import PDFTemplate from "../components/PDFTemplate.js";

function Main(props) {
  /*global ZOHO*/
  const { assembly_sku, assembly_id, work_ticket_id } = ZOHO.CREATOR.UTIL.getQueryParams();
  const [workTicketID, setWorkTicketID] = useState(work_ticket_id);
  const [assemblySKU, setAssemblySKU] = useState(work_ticket_id ? null : assembly_sku);
  const [assemblyID, setAssemblyID] = useState(work_ticket_id ? null : assembly_id);
  const [workTicketNumber, setWorkTicketNumber] = useState(0);
  const [workTicketDate, setWorkTicketDate] = useState(moment(new Date()));
  const [status, setStatus] = useState("Open");
  const [ticketStarted, setTicketStarted] = useState();
  const [ticketCompleted, setTicketCompleted] = useState();
  const [bundleId, setBundleId] = useState();
  const [createdBy, setCreatedBy] = useState();
  const [qtyToBuild, setQtyToBuild] = useState(1);
  const [error, setError] = useState("");
  const [toastSuccess, setToastSuccess] = useState(false);
  const [components, setComponents] = useState();
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [excludedComponents, setExcludedComponents] = useState([]);
  const componentToPrint = useRef();

  const { setDialog, setOpen } = useConfirmDialog();
  const {
    trigger: addWorkTicket,
    isMutating: isAddingWorkTicket,
    data: addedWorkTicket,
    error: workTicketError,
  } = useAddRecordMutation();
  const {
    trigger: updateWorkTicket,
    isMutating: isUpdatingWorkTicket,
    data: savedWorkTicket,
    error: workTicketSaveError,
  } = useUpdateRecordMutation();

  const { trigger: createBundle } = useCreateBundleMutation();
  const { trigger: deleteBundle } = useDeleteBundleMutation(bundleId);

  const handlePrint = useReactToPrint({
    documentTitle: "Print This Document",
    onBeforePrint: () => console.log("before printing..."),
    onAfterPrint: () => console.log("after printing..."),
    removeAfterPrint: true,
  });

  const {
    data: currentWorkTicket,
    mutate: mutateCurrentWorkTicket,
    isLoading: isCurrentWorkTicketLoading,
  } = useGetRecordById("All_Work_Tickets", workTicketID);
  const { data: lastWorkTicket, isLoading: isLastWorkTicketLoading } = useGetAllRecords(
    !assemblySKU
      ? null
      : creatorConfig({
          reportName: "All_Work_Tickets",
          page: 1,
          pageSize: 1,
        })
  );

  const { data: relatedWorkTickets, isLoading: isRelatedWorkTicketsLoading } = useGetAllRecords(
    !assemblySKU
      ? null
      : creatorConfig({
          reportName: "All_Work_Tickets",
          page: 1,
          pageSize: 200,
          criteria: `SKU=="${assemblySKU}" && Status=="Open"${workTicketID ? " && ID!=" + workTicketID : ""}`,
        })
  );
  const { data: users, isLoading: isUsersLoading } = useGetAllRecords(
    !assemblySKU
      ? null
      : creatorConfig({
          reportName: "All_Users",
          page: 1,
          pageSize: 200,
        })
  );
  const {
    data: compositeItem,
    mutate: mutateCompositeItem,
    isLoading: isCompositeItemLoading,
  } = useGetCompositeItem(assemblyID);
  const {
    data: assemblyItem,
    mutate: mutateAssemblyItem,
    isLoading: isAssemblyItemLoading,
  } = useSearchItem(assemblySKU);

  useEffect(() => {
    if (!isAddingWorkTicket) {
      setOpen(false);
    }
  }, [isAddingWorkTicket]);

  useEffect(() => {
    if (addedWorkTicket?.data?.ID) {
      const param = {
        action: "open",
        url: `#Page:Create_Work_Ticket?work_ticket_id=${addedWorkTicket.data.ID}`,
        window: "same",
      };
      /*global ZOHO */
      ZOHO.CREATOR.UTIL.navigateParentURL(param);
    }
  }, [addedWorkTicket]);

  useEffect(() => {
    if (!isUpdatingWorkTicket) {
      setOpen(false);
      if (!savedWorkTicket?.error) {
        if (savedWorkTicket?.data) {
          setToastSuccess(true);
        }
      } else {
        setError(JSON.stringify(savedWorkTicket.error));
      }
    }
  }, [savedWorkTicket, isUpdatingWorkTicket]);

  useEffect(() => {
    if (!isCurrentWorkTicketLoading && currentWorkTicket?.ID) {
      setQtyToBuild(currentWorkTicket.Quantity);
      setAssemblySKU(currentWorkTicket.SKU);
      setAssemblyID(currentWorkTicket.Assembly_ID);
      setWorkTicketDate(currentWorkTicket.Date_field);
      setWorkTicketID(currentWorkTicket.ID);
      setCreatedBy(currentWorkTicket.Created_By?.ID);
      setTicketStarted(currentWorkTicket.Ticket_Started);
      setTicketCompleted(currentWorkTicket.Ticket_Completed);
      setCreatedBy(currentWorkTicket.Created_By?.ID);
      setStatus(currentWorkTicket.Status);
      setBundleId(currentWorkTicket.Bundle_ID);
    }
  }, [currentWorkTicket, isCurrentWorkTicketLoading]);

  useEffect(() => {
    if (!currentWorkTicket && lastWorkTicket?.length) {
      setWorkTicketNumber(lastWorkTicket?.length ? parseInt(lastWorkTicket[0].Work_Ticket_No) + 1 : 1);
    } else if (currentWorkTicket) {
      setWorkTicketNumber(currentWorkTicket.Work_Ticket_No);
    }
  }, [lastWorkTicket, currentWorkTicket]);

  useEffect(() => {
    if (workTicketError) {
      setError(workTicketError.responseText);
    } else if (workTicketSaveError) {
      setError(workTicketSaveError.responseText);
    }
  }, [workTicketError, workTicketSaveError]);

  useEffect(() => {
    if (compositeItem?.composite_item?.mapped_items && (workTicketID ? currentWorkTicket?.ID : true)) {
      let excluded = currentWorkTicket?.Excluded_Components || "";
      excluded = excluded.split(",");

      setComponents(compositeItem?.composite_item?.mapped_items?.filter((q) => excluded.indexOf(q.item_id) < 0));
      setExcludedComponents(excluded);
    }
  }, [compositeItem, currentWorkTicket]);

  if (!assemblySKU) {
    return <Alert severity="info">Search an assembly item to create work ticket.</Alert>;
  }

  if (
    isAssemblyItemLoading ||
    isCompositeItemLoading ||
    isLastWorkTicketLoading ||
    isUsersLoading ||
    isCurrentWorkTicketLoading ||
    isRelatedWorkTicketsLoading
  ) {
    return <LinearProgress />;
  }

  if (assemblyItem.items?.length <= 0) {
    return <Alert severity="error">{assemblySKU} was not found!</Alert>;
  }

  const handleSave = (forceBundleId = null) => {
    setError(null);
    setToastSuccess(false);
    setOpen(true);

    const formData = {
      data: {
        SKU: assemblySKU,
        Quantity: qtyToBuild,
        Date_field: moment(workTicketDate).format("DD-MMM-YYYY"),
        Created_By: createdBy,
        Assembly_ID: assemblyID,
        Ticket_Started: null,
        Ticket_Completed: null,
        Status: status,
        Bundle_ID: forceBundleId || bundleId,
        Excluded_Components: excludedComponents.join(","),
      },
    };
    if (!formData.data.Created_By) {
      const user = users.find((q) => q.Email === ZOHO.CREATOR.UTIL.getInitParams().loginUser);
      formData.data.Created_By = user?.ID;
    }
    if (ticketStarted) {
      formData.data.Ticket_Started = moment(ticketStarted).format("DD-MMM-YYYY");
    }
    if (ticketCompleted) {
      formData.data.Ticket_Completed = moment(ticketCompleted).format("DD-MMM-YYYY");
    }

    if (currentWorkTicket?.ID) {
      if (!bundleId && status === "Completed" && forceBundleId === null) {
        setDialog({
          title: "Work Ticket Completion",
          open: true,
          content: (
            <Typography>
              You are about to mark this work ticket as complete. Continue to create the bundle in Zoho and complete
              this work ticket.
            </Typography>
          ),
          onClose: (value) => {
            if (value === true) {
              setTimeout(() => {
                handleCreateBundle();
              }, 1000);
            }
          },
          actions: (onClose) => (
            <>
              <Button
                variant="contained"
                onClick={() => {
                  onClose(true, true);
                }}
              >
                Continue
              </Button>
              <Button
                onClick={() => {
                  onClose(false, true);
                }}
              >
                Close
              </Button>
            </>
          ),
        });
      } else {
        setDialog({
          title: "Saving work ticket...",
          controlled: true,
        });
        updateWorkTicket(
          creatorConfig({
            reportName: "All_Work_Tickets",
            id: currentWorkTicket.ID,
            data: formData,
          })
        );
      }
    } else {
      setDialog({
        title: "Creating work ticket...",
        controlled: true,
      });
      addWorkTicket(
        creatorConfig({
          formName: "Work_Ticket",
          data: formData,
        })
      );
    }
  };

  const __handleDelete = () => {
    if (workTicketID) {
      updateWorkTicket(
        creatorConfig({
          reportName: "All_Work_Tickets",
          id: workTicketID,
          data: {
            data: {
              Status: "Deleted",
            },
          },
          callback: () => {
            deleteBundle({
              method: "POST",
              callback: (response) => {
                if (response?.code !== 0) {
                  setError(JSON.stringify(response.message));
                }
                handleNew();
              },
            });
          },
        })
      );
    }
  };

  const handleDelete = () => {
    setDialog({
      title: "Confirm",
      open: true,
      content: <Typography>Are you sure you want to delete this work ticket?</Typography>,
      onClose: (value) => {
        if (value === true) {
          __handleDelete();
        }
      },
      actions: (onClose) => (
        <>
          <Button
            variant="contained"
            onClick={() => {
              onClose(true, true);
            }}
          >
            Yes
          </Button>
          <Button
            onClick={() => {
              onClose(false, true);
            }}
          >
            No
          </Button>
        </>
      ),
    });
  };

  const handleNew = () => {
    const param = {
      action: "open",
      url: "#Page:Create_Work_Ticket",
      window: "same",
    };
    /*global ZOHO */
    ZOHO.CREATOR.UTIL.navigateParentURL(param);
  };

  const handleCloseToast = () => {
    setToastSuccess(false);
  };

  const getAvailableStock = (quantityNeeded, initialAvailableStock) => {
    if (relatedWorkTickets?.length) {
      relatedWorkTickets.forEach((wt) => {
        initialAvailableStock -= parseInt(wt.Quantity) * quantityNeeded;
      });
    }
    if (!bundleId)
      initialAvailableStock = parseInt(initialAvailableStock) - parseInt(quantityNeeded) * parseInt(qtyToBuild);

    if (isNaN(initialAvailableStock)) return "";

    return initialAvailableStock;
  };

  const handleClick = (event, id) => {
    if (status === "Completed") return;
    const selectedIndex = selectedComponents.indexOf(id);

    if (selectedIndex < 0 && selectedComponents.length + 1 === components.length) {
      return;
    }

    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedComponents, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedComponents.slice(1));
    } else if (selectedIndex === selectedComponents.length - 1) {
      newSelected = newSelected.concat(selectedComponents.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedComponents.slice(0, selectedIndex),
        selectedComponents.slice(selectedIndex + 1)
      );
    }
    setSelectedComponents(newSelected);
  };

  const handleRemoveComponents = () => {
    let selected = [...selectedComponents, ...excludedComponents];
    setComponents(components.filter((q) => selected.indexOf(q.item_id) < 0));
    setExcludedComponents(
      compositeItem?.composite_item?.mapped_items?.filter((q) => selected.indexOf(q.item_id) >= 0).map((q) => q.item_id)
    );
    setSelectedComponents([]);
  };

  const handleResetComponents = () => {
    if (compositeItem?.composite_item?.mapped_items) {
      setExcludedComponents([]);
      setComponents(compositeItem?.composite_item?.mapped_items);
    }
  };

  const isSelected = (id) => selectedComponents.indexOf(id) !== -1;

  const handleCreateBundle = () => {
    setOpen(true);
    setDialog({
      title: "Creating bundle in Zoho...",
      controlled: true,
    });
    const data = {
      date: moment(ticketCompleted).format("YYYY-MM-DD"),
      description: workTicketItem.description,
      composite_item_id: assemblyID,
      composite_item_name: workTicketItem.name,
      composite_item_sku: assemblySKU,
      quantity_to_bundle: qtyToBuild,
      line_items: components.map(({ item_id, name, description, quantity, inventory_account_id: account_id }) => ({
        item_id,
        name,
        description,
        quantity_consumed: quantity,
        account_id,
        warehouse_id: primaryWarehouse?.warehouse_id,
      })),
      is_completed: true,
    };
    createBundle({
      method: "POST",
      data,
      callback: (response) => {
        if (response?.code !== 0) {
          setError(JSON.stringify(response?.message));
        } else if (response.bundle?.bundle_id) {
          setBundleId(response.bundle?.bundle_id);
          setOpen(false);
          handleSave(response.bundle?.bundle_id);
        }
        mutateCompositeItem(assemblyID);
        mutateCurrentWorkTicket("All_Work_Tickets", workTicketID);
        mutateAssemblyItem(assemblySKU);
        setOpen(false);
      },
    });
  };

  const workTicketItem = assemblyItem?.items?.[0];
  const primaryWarehouse = compositeItem?.composite_item?.warehouses?.[0];

  return (
    <>
      <Snackbar
        open={toastSuccess}
        autoHideDuration={3000}
        message="Success"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={handleCloseToast}
      />
      {error && <Alert severity="error">{error}</Alert>}
      <Paper>
        <AppBar position="sticky">
          <ButtonGroup variant="text" color="white">
            <Button startIcon={<DeleteOutline />} onClick={handleDelete} disabled={!workTicketID}>
              Delete
            </Button>
            <Button startIcon={<AddOutlined />} onClick={handleNew}>
              New
            </Button>
            <Button
              disabled={!components || !currentWorkTicket}
              startIcon={<PrintOutlined />}
              onClick={() => {
                handlePrint(null, () => componentToPrint.current);
              }}
            >
              Print
            </Button>
            <Button startIcon={<SaveOutlined />} onClick={() => handleSave()}>
              Save
            </Button>
          </ButtonGroup>
        </AppBar>
        {!workTicketItem && <LinearProgress />}
        <Grid container p={4}>
          <Grid item xs={6}>
            <List style={{ flexDirection: "row", display: "flex", gap: 6 }}>
              {!workTicketItem &&
                new Array(6)
                  .fill(0)
                  .map((a, i) => <Skeleton width={100 / 6 + "%"} height={80} animation="wave" key={i} />)}
              {!!workTicketItem && (
                <>
                  <ListItemText primary={workTicketItem.sku} secondary="SKU" />
                  <ListItemText primary={workTicketItem.name} secondary="Description" />

                  <ListItemText primary={workTicketItem.stock_on_hand} secondary="Qty On Hand" />
                  <ListItemText primary={workTicketItem.unit.toUpperCase()} secondary="UOM" />
                  <ListItemText primary={formatCurrency(workTicketItem.purchase_rate)} secondary="Purchase Cost" />
                  <ListItemText
                    primary={formatCurrency(
                      components?.reduce((acc, obj) => acc + obj.purchase_rate * obj.quantity * qtyToBuild, 0) || 0
                    )}
                    secondary="Total Cost"
                  />
                </>
              )}
            </List>
            <Toolbar
              sx={{
                display: "flex",
                gap: 1,
                padding: "0!important",
              }}
            >
              {currentWorkTicket?.Bundle_ID && (
                <TextField
                  value={bundleId}
                  label="Bundle ID"
                  onChange={(e) => {
                    setBundleId(e.target.value);
                  }}
                  onBlur={(e) => {
                    if (e.target.value !== currentWorkTicket.Bundle_ID) {
                      setDialog({
                        open: true,
                        title: "Confirm Bundle ID",
                        content: (
                          <Typography>
                            Changing the Bundle ID will unbind the work ticket to the created bundle in Zoho.
                          </Typography>
                        ),
                        onClose: (value) => {
                          if (value !== true) {
                            setBundleId(currentWorkTicket.Bundle_ID);
                            setStatus(currentWorkTicket?.Status);
                          } else {
                            setStatus("Open");
                          }
                        },
                        actions: (handleClose) => (
                          <>
                            <Button
                              onClick={() => {
                                handleClose(true, true);
                              }}
                            >
                              Yes, I know
                            </Button>
                            <Button
                              onClick={() => {
                                handleClose(false, true);
                              }}
                            >
                              Cancel
                            </Button>
                          </>
                        ),
                      });
                    } else {
                      setBundleId(currentWorkTicket.Bundle_ID);
                      setStatus(currentWorkTicket?.Status);
                    }
                  }}
                />
              )}
              <Autocomplete
                options={users}
                getOptionLabel={(option) => option.Name.display_value}
                sx={{ width: 300 }}
                disableClearable
                disabled={!!bundleId}
                value={
                  createdBy
                    ? users.find((q) => q.ID === createdBy)
                    : users.find((q) => q.Email === ZOHO.CREATOR.UTIL.getInitParams().loginUser)
                }
                renderInput={(params) => <TextField {...params} label="Created By" variant="outlined" />}
                renderOption={(props, option) => (
                  <Box {...props} key={option.ID}>
                    <Avatar sx={{ width: 30, height: 30, fontSize: "small" }}>
                      {option.Name.first_name[0]}
                      {option.Name.last_name[0]}
                    </Avatar>
                    &nbsp;&nbsp;
                    <Typography>{option.Name.display_value}</Typography>
                  </Box>
                )}
                onChange={(e, value) => {
                  setCreatedBy(value.ID);
                }}
              />
              <DatePicker
                disabled={status === "Completed"}
                label="Ticket Started"
                value={ticketStarted ? moment(ticketStarted) : null}
                onChange={(val) => {
                  setTicketStarted(val);
                }}
              />
              <DatePicker
                label="Ticket Completed"
                disabled={status === "Completed" && !!bundleId}
                value={ticketCompleted ? moment(ticketCompleted) : null}
                onChange={(val) => {
                  setTicketCompleted(val);
                }}
              />
              <Select
                value={status}
                disabled={status === "Completed" && !!bundleId}
                onChange={(e) => {
                  setStatus(e.target.value);
                  if (e.target.value === "Completed" && !ticketCompleted) {
                    setTicketCompleted(new Date());
                    if (!ticketStarted) {
                      setTicketStarted(new Date());
                    }
                  } else {
                    setTicketCompleted(null);
                    if (!currentWorkTicket?.Ticket_Started) {
                      setTicketStarted(null);
                    }
                  }
                }}
              >
                <MenuItem value="Open">Open</MenuItem>
                <MenuItem value="Completed" disabled={!currentWorkTicket}>
                  Completed
                </MenuItem>
              </Select>
            </Toolbar>
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
            <DatePicker
              id="work-ticket-date"
              disabled
              onChange={(newValue) => {
                setWorkTicketDate(newValue);
              }}
              defaultValue={moment(workTicketDate)}
            />
            <InputLabel shrink={false} htmlFor="qty-to-build">
              <Typography>Qty To Build</Typography>
            </InputLabel>
            <TextField
              id="qty-to-build"
              variant="outlined"
              type="number"
              value={qtyToBuild}
              disabled={status === "Completed"}
              onChange={(e) => {
                setQtyToBuild(e.target.value);
              }}
              onBlur={(e) => {
                if (e.target.value <= 0) {
                  setQtyToBuild(1);
                }
              }}
              inputProps={{
                style: {
                  width: 230,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} mt={3}>
            {components?.length !== compositeItem?.composite_item?.mapped_items?.length && (
              <Alert severity="info">
                {!!bundleId
                  ? "One or more components were not included in the bundle."
                  : "One or more components will not be included in the bundle."}{" "}
                <Button onClick={handleResetComponents} disabled={!!bundleId}>
                  Reset
                </Button>
              </Alert>
            )}
            {!!components && !!currentWorkTicket && (
              <div style={{ display: "none" }}>
                <PDFTemplate
                  componentRef={componentToPrint}
                  workTicket={{
                    currentWorkTicket: {
                      ...{
                        ...currentWorkTicket,
                        Ticket_Completed: ticketCompleted,
                        Ticket_Started: ticketStarted,
                        Created_By: { display_value: createdBy },
                        Date_field: workTicketDate,
                        Status: status,
                      },
                      ...workTicketItem,
                    },
                    components: components.map((d) => {
                      const { actual_available_stock, quantity, purchase_rate } = d;
                      return {
                        ...d,
                        unitCost: formatCurrency(purchase_rate),
                        totalUnitCost: formatCurrency(purchase_rate * quantity * qtyToBuild),
                        required: quantity * qtyToBuild,
                        available: getAvailableStock(quantity, actual_available_stock),
                      };
                    }),
                    qtyToBuild,
                  }}
                />
              </div>
            )}
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      disabled={status === "Completed"}
                      indeterminate={selectedComponents.length > 0 && selectedComponents.length < components.length - 1}
                      checked={selectedComponents.length > 0 && selectedComponents.length === components.length - 1}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedComponents(
                            [...components]
                              .reverse()
                              .slice(0, components.length - 1)
                              .map((c) => c.item_id)
                          );
                        } else {
                          setSelectedComponents([]);
                        }
                      }}
                    />
                  </TableCell>
                  {selectedComponents.length === 0 && (
                    <>
                      <TableCell>Item</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Unit Cost</TableCell>
                      <TableCell>Total Unit Cost</TableCell>
                      <TableCell>Required</TableCell>
                      <TableCell>On Hand</TableCell>
                      <TableCell>Available</TableCell>
                    </>
                  )}
                  {selectedComponents.length > 0 && (
                    <>
                      <TableCell colSpan={7}>
                        <Button startIcon={<DeleteOutline />} onClick={handleRemoveComponents}>
                          Remove
                        </Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {components
                  ?.sort((a, b) => a.sku - b.sku)
                  .map((d) => {
                    const { actual_available_stock, name, sku, quantity, stock_on_hand, item_id, purchase_rate } = d;
                    const selected = isSelected(item_id);

                    return (
                      <TableRow key={sku} onClick={(event) => handleClick(event, item_id)} selected={selected}>
                        <TableCell padding="checkbox">
                          <Checkbox checked={selected} disabled={status === "Completed"} />
                        </TableCell>
                        <TableCell>{sku}</TableCell>
                        <TableCell>{name}</TableCell>
                        <TableCell>{formatCurrency(purchase_rate)}</TableCell>
                        <TableCell>{formatCurrency(purchase_rate * quantity * qtyToBuild)}</TableCell>
                        <TableCell>{quantity * qtyToBuild}</TableCell>
                        <TableCell>{stock_on_hand}</TableCell>
                        <TableCell>{getAvailableStock(quantity, actual_available_stock)}</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </Grid>
        </Grid>
      </Paper>
    </>
  );
}

export default Main;
