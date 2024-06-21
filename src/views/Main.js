import { AddOutlined, DeleteOutline, Launch, LoginOutlined, PrintOutlined, SaveOutlined } from "@mui/icons-material";
import {
  Alert,
  AppBar,
  Autocomplete,
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  CircularProgress,
  Grid,
  InputLabel,
  LinearProgress,
  Link,
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
  Tooltip,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import PDFTemplate from "../components/PDFTemplate.js";
import useConfirmDialog from "../hooks/useConfirmDialog";
import creatorConfig from "../lib/creatorConfig";
import fetcher, { zohoAxiosInstance } from "../services/fetcher.js";
import {
  useAddRecordMutation,
  useAuthenticateMutation,
  useCreateBundleMutation,
  useDeleteBundleMutation,
  useRefreshMutation,
  useUpdateRecordMutation,
} from "../services/mutation";
import {
  useGetAllRecords,
  useGetCompositeItem,
  useGetItemSalesOrders,
  useGetRecordById,
  useSearchItem,
} from "../services/queries";
import { settings } from "../settings.js";
import {
  formatCurrency,
  getAuthenticationLink,
  getZohoInventoryBundleLink,
  getZohoInventoryItemLink,
} from "../utils.js";

function Main(props) {
  /*global ZOHO*/
  const { assembly_sku, assembly_id, work_ticket_id, code, state } = ZOHO.CREATOR.UTIL.getQueryParams();
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

  const {
    trigger: updateSettings,
    isMutating: isSettingsUpdating,
    data: savedSettings,
    error: settingsSaveError,
  } = useUpdateRecordMutation();

  const { trigger: createBundle } = useCreateBundleMutation();
  const { trigger: deleteBundle } = useDeleteBundleMutation(bundleId);

  const { trigger: authenticate, data: authenticateData, isMutating: isAuthenticating } = useAuthenticateMutation(code);
  const { trigger: refresh, data: refreshData, isMutating: isRefreshing } = useRefreshMutation();

  const { data: _zohoSettings, isLoading: _isZohoSettingsLoading } = useGetAllRecords(
    creatorConfig({
      reportName: "All_Settings",
      page: 1,
      pageSize: 1,
    })
  );

  const { data: zohoSettings, isLoading: isZohoSettingsLoading } = useGetRecordById(
    !_zohoSettings?.length ? null : "All_Settings",
    _zohoSettings?.[0].ID
  );
  const [isReady, setIsReady] = useState(!!zohoSettings?.api__access_token);

  const {
    data: currentWorkTicket,
    isLoading: isCurrentWorkTicketLoading,
    mutate: mutateCurrentWorkTicket,
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

  const { data: committedSalesOrders } = useGetItemSalesOrders(!isReady ? null : assemblyID);

  const {
    data: compositeItem,
    mutate: mutateCompositeItem,
    isLoading: isCompositeItemLoading,
  } = useGetCompositeItem(!isReady ? null : assemblyID);

  const { data: relatedWorkTickets, isLoading: isRelatedWorkTicketsLoading } = useGetAllRecords(
    !assemblySKU || !compositeItem?.composite_item?.mapped_items
      ? null
      : creatorConfig({
          reportName: "All_Work_Tickets",
          page: 1,
          pageSize: 200,
          criteria: `(SKU=="${assemblySKU}" && Status=="Open"${
            workTicketID ? " && ID!=" + workTicketID : ""
          }) || ${compositeItem?.composite_item?.mapped_items
            .map((q) => `(SKU=="${q.sku}" && Status=="Open"${workTicketID ? " && ID!=" + workTicketID : ""})`)
            .join(" || ")}`,
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
    data: assemblyItem,
    mutate: mutateAssemblyItem,
    isLoading: isAssemblyItemLoading,
  } = useSearchItem(!isReady ? null : assemblySKU);

  useEffect(() => {
    if (!isAddingWorkTicket) {
      setOpen(false);
    }
  }, [isAddingWorkTicket]);

  useEffect(() => {
    if (assemblyItem?.error === true && settings.api.refresh_token && assemblyItem.message == "Unauthorized.") {
      refresh();
    } else if (assemblyItem?.error === true) {
      setError(assemblyItem.message);
    }
  }, [assemblyItem]);

  useEffect(() => {
    if (refreshData?.access_token) {
      handleAuth(refreshData, encodeURI(JSON.stringify({ work_ticket_id, assembly_id, assembly_sku })));
    }
  }, [refreshData]);

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
      handleSetInitialValues(currentWorkTicket);
    }
  }, [currentWorkTicket, isCurrentWorkTicketLoading]);

  useEffect(() => {
    if (zohoSettings) {
      let s = { ...zohoSettings };
      delete s.ID;
      Object.keys(s).map((key) => {
        let path = key.split("__");
        let option = path[0];
        let settingKey = path[1];
        let settingKey2 = path[2];
        if (s[key] == "true" || s[key] == "false") {
          s[key] = eval(s[key]);
        }
        if (path.length > 2) {
          settings[option][settingKey][settingKey2] = s[key];
        } else if (path.length > 1) {
          settings[option][settingKey] = s[key];
        } else {
          settings[option] = s[key];
        }
      });
      if (settings.api.access_token) {
        zohoAxiosInstance.defaults.headers.common.Authorization = settings.api.access_token;
        setIsReady(true);
      }
    }
  }, [zohoSettings]);

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
    } else if (settingsSaveError) {
      setError(settingsSaveError.responseText);
    }
  }, [workTicketError, workTicketSaveError, settingsSaveError]);

  useEffect(() => {
    if (
      !isCompositeItemLoading &&
      compositeItem?.composite_item?.mapped_items &&
      (workTicketID ? currentWorkTicket?.ID : true)
    ) {
      let excluded = currentWorkTicket?.Excluded_Components || "";
      excluded = excluded.split(",");

      setComponents(compositeItem?.composite_item?.mapped_items?.filter((q) => excluded.indexOf(q.item_id) < 0));
      setExcludedComponents(excluded);
    }
  }, [compositeItem, currentWorkTicket, isCompositeItemLoading]);

  useEffect(() => {
    if (!!code && zohoSettings?.ID) {
      authenticate();
    }
  }, [code, zohoSettings]);

  useEffect(() => {
    if (authenticateData?.access_token) {
      handleAuth(authenticateData, state);
    }
  }, [isAuthenticating]);

  const handleAuth = (data, state) => {
    settings.api.access_token = data.access_token;
    settings.api.refresh_token = data.refresh_token;
    settings.api.scope = data.scope;
    updateSettings(
      creatorConfig({
        reportName: "All_Settings",
        id: zohoSettings.ID,
        data: {
          data: {
            api__access_token: data.access_token,
            api__refresh_token: data.refresh_token,
            api__scope: data.scope,
          },
        },
        callback: (authData) => {
          const param = {
            action: "open",
            url: `#Page:Create_Work_Ticket?`,
            window: "same",
          };
          if (state) {
            let s = JSON.parse(decodeURI(state));
            Object.keys(s).map((q) => {
              param.url += `${q}=${s[q]}&`;
            });
          }
          /*global ZOHO */
          ZOHO.CREATOR.UTIL.navigateParentURL(param);
        },
      })
    );
  };

  const handlePrint = useReactToPrint({
    documentTitle: "Print This Document",
    onBeforePrint: () => console.log("before printing..."),
    onAfterPrint: () => console.log("after printing..."),
    removeAfterPrint: true,
  });

  const handleSave = (forceBundleId = null, initialCallback) => {
    setError(null);
    setToastSuccess(false);
    setOpen(true);
    const callback = () => {
      if (typeof initialCallback === "function") initialCallback();
      handleRefreshData();
    };

    const formData = {
      data: {
        SKU: assemblySKU,
        Quantity: getQtyToBuild(),
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
            callback,
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

  const getQtyToBuild = () => {
    if (!qtyToBuild) return 1;
    return qtyToBuild;
  };

  const getRequiredQuantity = (quantity, liveUpdate = true) =>
    quantity * (liveUpdate ? getQtyToBuild() : currentWorkTicket?.Quantity || 1);

  const getTotalCost = (liveUpdate = true) =>
    components?.reduce(
      (acc, obj) =>
        acc + obj.purchase_rate * obj.quantity * (liveUpdate ? getQtyToBuild() : currentWorkTicket?.Quantity || 1),
      0
    ) || 0;

  const getTotalUnitCost = (purchaseRate, quantity, liveUpdate = false) => {
    return formatCurrency(purchaseRate * quantity * (liveUpdate ? getQtyToBuild() : currentWorkTicket?.Quantity || 1));
  };

  const getSettings = () => (workTicketID ? "editing_work_ticket" : "creating_work_ticket");

  const getAvailableStock = (quantityNeeded, initialAvailableStock, liveUpdate = true) => {
    if (relatedWorkTickets?.length) {
      relatedWorkTickets.forEach((wt) => {
        initialAvailableStock += parseInt(wt.Quantity) * quantityNeeded;
      });
    }
    if (!bundleId)
      initialAvailableStock =
        parseInt(initialAvailableStock) -
        parseInt(quantityNeeded) * parseInt(liveUpdate ? getQtyToBuild() : parseInt(currentWorkTicket?.Quantity) || 0);

    if (isNaN(initialAvailableStock)) return "";

    return initialAvailableStock;
  };

  const getCommittedStock = () => {
    let committed = 0;
    if (committedSalesOrders?.length) {
      committedSalesOrders.forEach((q) => {
        q.salesorders.forEach((qq) => {
          committed += qq.item_quantity;
        });
      });
    }
    return committed;
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
      quantity_to_bundle: getQtyToBuild(),
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
        handleRefreshData();
        setOpen(false);
      },
    });
  };

  const handleRefreshData = async () => {
    const updated = await fetcher(
      "getRecordById",
      creatorConfig({
        reportName: "All_Work_Tickets",
        id: workTicketID,
      })
    );
    mutateCurrentWorkTicket(updated);
    mutateCompositeItem();
    mutateAssemblyItem();
  };

  const handleSetInitialValues = (data) => {
    setQtyToBuild(data.Quantity);
    setAssemblySKU(data.SKU);
    setAssemblyID(data.Assembly_ID);
    setWorkTicketDate(data.Date_field);
    setWorkTicketID(data.ID);
    setCreatedBy(data.Created_By?.ID);
    setTicketStarted(data.Ticket_Started);
    setTicketCompleted(data.Ticket_Completed);
    setCreatedBy(data.Created_By?.ID);
    setStatus(data.Status);
    setBundleId(data.Bundle_ID);
  };

  const workTicketItem = assemblyItem?.items?.[0];
  const primaryWarehouse = compositeItem?.composite_item?.warehouses?.[0];

  if (isAuthenticating) {
    return (
      <Box display="flex" alignItems="center" gap={2} p={3} component={Paper}>
        <CircularProgress size={20} />
        <Typography>Authenticating...</Typography>
      </Box>
    );
  }

  if (!assemblySKU) {
    return <Alert severity="info">Search an assembly item to create work ticket.</Alert>;
  }

  if (
    isAssemblyItemLoading ||
    isCompositeItemLoading ||
    isLastWorkTicketLoading ||
    isUsersLoading ||
    isCurrentWorkTicketLoading ||
    isRelatedWorkTicketsLoading ||
    _isZohoSettingsLoading ||
    isZohoSettingsLoading
  ) {
    return <LinearProgress />;
  }

  if (!settings.api.access_token) {
    return (
      <Paper style={{ height: "100vh", display: "grid", placeItems: "center", width: "100vw" }}>
        <Button
          variant="contained"
          onClick={() => {
            const param = {
              action: "open",
              url: getAuthenticationLink(encodeURI(JSON.stringify({ assembly_id, assembly_sku, work_ticket_id }))),
              window: "same",
            };
            /*global ZOHO */
            ZOHO.CREATOR.UTIL.navigateParentURL(param);
          }}
          startIcon={<LoginOutlined />}
        >
          Authenticate
        </Button>
      </Paper>
    );
  }

  if (assemblyItem?.items?.length <= 0) {
    return <Alert severity="error">{assemblySKU} was not found!</Alert>;
  }

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
              disabled={!components || !currentWorkTicket || (status === "Completed" && !bundleId)}
              startIcon={<PrintOutlined />}
              onClick={() => {
                handleSave(null, () => {
                  handlePrint(null, () => componentToPrint.current);
                });
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
          <Grid item xs={8}>
            <List style={{ flexDirection: "row", display: "flex", gap: 6, flexWrap: "wrap" }}>
              {!workTicketItem &&
                new Array(6)
                  .fill(0)
                  .map((a, i) => <Skeleton width={100 / 6 + "%"} height={80} animation="wave" key={i} />)}
              {!!workTicketItem && (
                <>
                  <ListItemText
                    primary={workTicketItem.sku}
                    secondary={workTicketItem.name}
                    {...(settings.composite_items.show_link
                      ? {
                          primaryTypographyProps: {
                            component: Link,
                            href: getZohoInventoryItemLink(workTicketItem.item_id, workTicketItem.sku),
                            target: "_blank",
                          },
                        }
                      : {})}
                  />

                  <ListItemText primary={workTicketItem.stock_on_hand} secondary="Qty On Hand" />
                  <ListItemText
                    primary={workTicketItem.available_stock - getCommittedStock()}
                    secondary="Qty Available"
                  />
                  <ListItemText primary={getCommittedStock()} secondary="Committed" />
                  <ListItemText primary={workTicketItem.reorder_level || "N/A"} secondary="Minimum Stock" />
                  <ListItemText primary={workTicketItem.unit.toUpperCase()} secondary="UOM" />
                  <ListItemText primary={formatCurrency(workTicketItem.purchase_rate)} secondary="Purchase Cost" />
                  <ListItemText
                    primary={
                      <Typography style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        {formatCurrency(getTotalCost(settings[getSettings()].live_update.total_cost))}
                      </Typography>
                    }
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
                flexWrap: "wrap",
              }}
            >
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
                disabled={status === "Completed" && !!bundleId}
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
          <Grid item xs={4} display="flex" flexDirection="column" alignItems="end">
            <InputLabel shrink={false} htmlFor="work-ticket-no">
              <Typography>Work Ticket No.</Typography>
            </InputLabel>
            <TextField
              id="work-ticket-no"
              variant="outlined"
              type="number"
              value={workTicketNumber}
              disabled
              style={{
                width: "100%",
                maxWidth: 258,
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
                if (e.target.value >= 999999) {
                  setQtyToBuild(999999);
                } else {
                  setQtyToBuild(e.target.value);
                }
              }}
              onBlur={(e) => {
                if (e.target.value <= 0) {
                  setQtyToBuild(1);
                }
              }}
              style={{
                width: "100%",
                maxWidth: 258,
              }}
            />
            {currentWorkTicket?.Bundle_ID && (
              <>
                <InputLabel shrink={false} htmlFor="bundle-id">
                  <Typography>
                    Bundle ID
                    <Link
                      href={getZohoInventoryBundleLink(assemblyID, currentWorkTicket?.Bundle_ID, assemblySKU)}
                      target="_blank"
                    >
                      <Launch style={{ transform: "scale(0.7)" }} />
                    </Link>
                  </Typography>
                </InputLabel>
                <TextField
                  value={bundleId}
                  id="bundle-id"
                  variant="outlined"
                  onChange={(e) => {
                    setBundleId(e.target.value);
                  }}
                  style={{
                    width: "100%",
                    maxWidth: 258,
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
              </>
            )}
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
                        Created_By: users.find((q) => q.ID === createdBy),
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
                        totalUnitCost: formatCurrency(purchase_rate * quantity * getQtyToBuild()),
                        required: quantity * getQtyToBuild(),
                        available: getAvailableStock(quantity, actual_available_stock),
                      };
                    }),
                    qtyToBuild: getQtyToBuild(),
                  }}
                />
              </div>
            )}
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Tooltip title="Select at least (1) component." placement="bottom">
                      <Checkbox
                        disabled={status === "Completed"}
                        indeterminate={
                          selectedComponents.length > 0 && selectedComponents.length < components.length - 1
                        }
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
                    </Tooltip>
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
                      <TableRow
                        key={sku}
                        onClick={(event) => {
                          if (event.target.tagName !== "INPUT") return;
                          handleClick(event, item_id);
                        }}
                        selected={selected}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox checked={selected} disabled={status === "Completed"} />
                        </TableCell>
                        <TableCell>
                          {sku}
                          {settings.items.show_link && (
                            <Link href={getZohoInventoryItemLink(item_id, sku, false)} target="_blank">
                              <Launch fontSize="small" style={{ transform: "scale(0.7)" }} />
                            </Link>
                          )}
                        </TableCell>
                        <TableCell>{name}</TableCell>
                        <TableCell>{formatCurrency(purchase_rate)}</TableCell>
                        <TableCell>
                          {getTotalUnitCost(
                            purchase_rate,
                            quantity,
                            settings[getSettings()].live_update.total_unit_cost
                          )}
                        </TableCell>
                        <TableCell>
                          {getRequiredQuantity(quantity, settings[getSettings()].live_update.required)}
                        </TableCell>
                        <TableCell>{stock_on_hand}</TableCell>
                        <TableCell>
                          {getAvailableStock(
                            quantity,
                            actual_available_stock,
                            settings[getSettings()].live_update.available
                          )}
                        </TableCell>
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
