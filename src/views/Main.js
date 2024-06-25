import {
  AddOutlined,
  DeleteOutline,
  Launch,
  LoginOutlined,
  PrintOutlined,
  SaveOutlined,
} from "@mui/icons-material";
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
import fetcher, {
  creatorMultiApiFetcher,
  zohoAxiosInstance,
} from "../services/fetcher.js";
import {
  useAddRecordMutation,
  useAuthenticateMutation,
  useCreateBundleMutation,
  useDeleteBundleMutation,
  useDeleteRecordMutation,
  useRefreshMutation,
  useUpdateRecordMutation,
} from "../services/mutation";
import {
  useGetAllRecords,
  useGetAllRecordsMulti,
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
  const { assembly_sku, assembly_id, work_ticket_id, code, state } =
    ZOHO.CREATOR.UTIL.getQueryParams();
  const [workTicketID, setWorkTicketID] = useState(work_ticket_id);
  const [assemblySKU, setAssemblySKU] = useState(
    work_ticket_id ? null : assembly_sku
  );
  const [assemblyID, setAssemblyID] = useState(
    work_ticket_id ? null : assembly_id
  );
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
  const addWorkTicket = useAddRecordMutation();
  const deleteWorkTicketDetails = useDeleteRecordMutation();
  const addWorkTicketDetails = useAddRecordMutation();
  const updateWorkTicket = useUpdateRecordMutation();

  const updateSettings = useUpdateRecordMutation();

  const createBundle = useCreateBundleMutation();
  const deleteBundle = useDeleteBundleMutation(bundleId);

  const authenticate = useAuthenticateMutation(code);
  const refresh = useRefreshMutation();

  const _zohoSettings = useGetAllRecords(
    creatorConfig({
      reportName: "All_Settings",
      page: 1,
      pageSize: 1,
    })
  );

  const zohoSettings = useGetRecordById(
    !_zohoSettings.data?.length ? null : "All_Settings",
    _zohoSettings.data?.[0].ID
  );
  const [isReady, setIsReady] = useState(
    !!zohoSettings.data?.api__access_token
  );

  const currentWorkTicket = useGetRecordById("All_Work_Tickets", workTicketID);
  const lastWorkTicket = useGetAllRecords(
    !assemblySKU
      ? null
      : creatorConfig({
          reportName: "All_Work_Tickets",
          page: 1,
          pageSize: 1,
        })
  );

  const committedSalesOrders = useGetItemSalesOrders(
    !isReady ? null : assemblyID
  );

  const compositeItem = useGetCompositeItem(!isReady ? null : assemblyID);

  const usedComponents = useGetAllRecordsMulti(
    !compositeItem.data?.composite_item?.mapped_items
      ? null
      : compositeItem.data?.composite_item?.mapped_items
          ?.map((q) =>
            creatorConfig({
              reportName: "All_Work_Ticket_Details",
              page: 1,
              pageSize: 200,
              criteria: `(Component_ID=="${q.item_id}" && Status=="Open") `,
            })
          )
          .concat([
            creatorConfig({
              reportName: "All_Work_Ticket_Details",
              page: 1,
              pageSize: 200,
              criteria: `(Component_ID=="${assemblyID}" && Status=="Open") `,
            }),
          ])
  );

  const addedComponents = useGetAllRecordsMulti(
    !compositeItem.data?.composite_item?.mapped_items
      ? null
      : compositeItem.data?.composite_item?.mapped_items
          ?.map((q) =>
            creatorConfig({
              reportName: "All_Work_Ticket_Details",
              page: 1,
              pageSize: 200,
              criteria: `(Assembly_ID=="${q.item_id}" && Status=="Open") `,
            })
          )
          .concat([
            creatorConfig({
              reportName: "All_Work_Ticket_Details",
              page: 1,
              pageSize: 200,
              criteria: `(Assembly_ID=="${assemblyID}" && Status=="Open") `,
            }),
          ])
  );

  const users = useGetAllRecords(
    !assemblySKU
      ? null
      : creatorConfig({
          reportName: "All_Users",
          page: 1,
          pageSize: 200,
        })
  );
  const assemblyItem = useSearchItem(!isReady ? null : assemblySKU);

  useEffect(() => {
    if (!addWorkTicket.isMutating) {
      setOpen(false);
    }
  }, [addWorkTicket.isMutating]);

  useEffect(() => {
    if (
      assemblyItem.data?.error === true &&
      settings.api.refresh_token &&
      assemblyItem.data.message == "Unauthorized."
    ) {
      refresh.trigger();
    } else if (assemblyItem.data?.error === true) {
      setError(assemblyItem.data.message);
    }
  }, [assemblyItem.data]);

  useEffect(() => {
    if (refresh.data?.access_token) {
      handleAuth(
        refresh.data,
        encodeURI(JSON.stringify({ work_ticket_id, assembly_id, assembly_sku }))
      );
    }
  }, [refresh.data]);

  useEffect(() => {
    if (addWorkTicket.data?.data?.ID) {
      const param = {
        action: "open",
        url: `#Page:Create_Work_Ticket?work_ticket_id=${addWorkTicket.data.data.ID}`,
        window: "same",
      };
      /*global ZOHO */
      ZOHO.CREATOR.UTIL.navigateParentURL(param);
    }
  }, [addWorkTicket]);

  useEffect(() => {
    if (!currentWorkTicket.isLoading && currentWorkTicket.data?.ID) {
      handleSetInitialValues(currentWorkTicket.data);
    }
  }, [currentWorkTicket.data, currentWorkTicket.isLoading]);

  useEffect(() => {
    if (zohoSettings.data) {
      let s = { ...zohoSettings.data };
      delete s.ID;
      Object.keys(s).map((key) => {
        let path = key.split("__");
        let option = path[0];
        let settingKey = path[1];
        let settingKey2 = path[2];
        if (s[key] == "true" || s[key] == "false") {
          s[key] = eval(s[key]);
        }
        try {
          if (path.length > 2) {
            settings[option][settingKey][settingKey2] = s[key];
          } else if (path.length > 1) {
            settings[option][settingKey] = s[key];
          } else {
            settings[option] = s[key];
          }
        } catch (e) {}
      });
      if (settings.api.access_token) {
        zohoAxiosInstance.defaults.headers.common.Authorization =
          settings.api.access_token;
        setIsReady(true);
      }
    }
  }, [zohoSettings.data]);

  useEffect(() => {
    if (!currentWorkTicket.data && lastWorkTicket.data?.length) {
      setWorkTicketNumber(
        lastWorkTicket.data?.length
          ? parseInt(lastWorkTicket.data[0].Work_Ticket_No) + 1
          : 1
      );
    } else if (currentWorkTicket.data) {
      setWorkTicketNumber(currentWorkTicket.data.Work_Ticket_No);
    }
  }, [lastWorkTicket.data, currentWorkTicket.data]);

  useEffect(() => {
    if (addWorkTicket.error) {
      setError(addWorkTicket.error.responseText);
    } else if (updateWorkTicket.error) {
      setError(updateWorkTicket.error.responseText);
    } else if (updateSettings.error) {
      setError(updateSettings.error.responseText);
    }
  }, [addWorkTicket.error, updateWorkTicket.error, updateSettings.error]);

  useEffect(() => {
    if (
      !compositeItem.isLoading &&
      compositeItem.data?.composite_item?.mapped_items &&
      (workTicketID ? currentWorkTicket.data?.ID : true)
    ) {
      let excluded = currentWorkTicket.data?.Excluded_Components || "";
      excluded = excluded.split(",");

      setComponents(
        compositeItem.data?.composite_item?.mapped_items?.filter(
          (q) => excluded.indexOf(q.item_id) < 0
        )
      );
      setExcludedComponents(excluded);
    }
  }, [compositeItem.data, currentWorkTicket.data, compositeItem.isLoading]);

  useEffect(() => {
    if (!!code && zohoSettings.data?.ID) {
      authenticate.trigger();
    }
  }, [code, zohoSettings.data]);

  useEffect(() => {
    if (authenticate.data?.access_token) {
      handleAuth(authenticate.data, state);
    }
  }, [authenticate.isMutating]);

  const handleAuth = (data, state) => {
    settings.api.access_token = data.access_token;
    settings.api.refresh_token = data.refresh_token;
    settings.api.scope = data.scope;
    updateSettings.trigger(
      creatorConfig({
        reportName: "All_Settings",
        id: zohoSettings.data.ID,
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
      if (workTicketID) {
        deleteWorkTicketDetails.trigger(
          creatorConfig({
            reportName: "All_Work_Ticket_Details",
            criteria: `Work_Ticket_ID=="${workTicketID}"`,
            callback: () => {
              components.forEach((q) => {
                addWorkTicketDetails.trigger(
                  creatorConfig({
                    formName: "Work_Ticket_Details",
                    data: {
                      data: {
                        Work_Ticket_ID: workTicketID,
                        Assembly_ID: assemblyID,
                        Component_ID: q.item_id,
                        Quantity_Required: q.quantity,
                        Quantity_To_Build: qtyToBuild,
                        Status: status,
                      },
                    },
                  })
                );
              });
            },
          })
        );
      }
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
        Included_Components: components
          .map((q) => q.item_id + ":" + q.quantity)
          .join(","),
      },
    };
    if (!formData.data.Created_By) {
      const user = users.data.find(
        (q) => q.Email === ZOHO.CREATOR.UTIL.getInitParams().loginUser
      );
      formData.data.Created_By = user?.ID;
    }
    if (ticketStarted) {
      formData.data.Ticket_Started =
        moment(ticketStarted).format("DD-MMM-YYYY");
    }
    if (ticketCompleted) {
      formData.data.Ticket_Completed =
        moment(ticketCompleted).format("DD-MMM-YYYY");
    }

    if (currentWorkTicket.data?.ID) {
      if (!bundleId && status === "Completed" && forceBundleId === null) {
        setDialog({
          title: "Work Ticket Completion",
          open: true,
          content: (
            <Typography>
              You are about to mark this work ticket as complete. Continue to
              create the bundle in Zoho and complete this work ticket.
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
        updateWorkTicket.trigger(
          creatorConfig({
            reportName: "All_Work_Tickets",
            id: currentWorkTicket.data.ID,
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
      addWorkTicket.trigger(
        creatorConfig({
          formName: "Work_Ticket",
          data: formData,
          callback: ({ data }) => {
            if (data?.ID) {
              deleteWorkTicketDetails.trigger(
                creatorConfig({
                  reportName: "All_Work_Ticket_Details",
                  criteria: `Work_Ticket_ID=="${data?.ID}"`,
                  callback: () => {
                    components.forEach((q) => {
                      addWorkTicketDetails.trigger(
                        creatorConfig({
                          formName: "Work_Ticket_Details",
                          data: {
                            data: {
                              Work_Ticket_ID: data.ID,
                              Assembly_ID: assemblyID,
                              Component_ID: q.item_id,
                              Quantity_Required: q.quantity,
                              Quantity_To_Build: qtyToBuild,
                              Status: "Open",
                            },
                          },
                        })
                      );
                    });
                  },
                })
              );
            }
          },
        })
      );
    }
  };

  const __handleDelete = () => {
    if (workTicketID) {
      updateWorkTicket.trigger(
        creatorConfig({
          reportName: "All_Work_Tickets",
          id: workTicketID,
          data: {
            data: {
              Status: "Deleted",
            },
          },
          callback: () => {
            deleteWorkTicketDetails.trigger(
              creatorConfig({
                reportName: "All_Work_Ticket_Details",
                criteria: `Work_Ticket_ID=="${workTicketID}"`,
              })
            );
            deleteBundle.trigger({
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
      content: (
        <Typography>
          Are you sure you want to delete this work ticket?
        </Typography>
      ),
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
    parseFloat(
      quantity *
        (liveUpdate ? getQtyToBuild() : currentWorkTicket.data?.Quantity || 1)
    ).toFixed(parseInt(settings.quantity_precision));

  const getTotalCost = (liveUpdate = true) =>
    components?.reduce(
      (acc, obj) =>
        acc +
        obj.purchase_rate *
          obj.quantity *
          (liveUpdate
            ? getQtyToBuild()
            : currentWorkTicket.data?.Quantity || 1),
      0
    ) || 0;

  const getTotalUnitCost = (purchaseRate, quantity, liveUpdate = false) => {
    return formatCurrency(
      purchaseRate *
        quantity *
        (liveUpdate ? getQtyToBuild() : currentWorkTicket.data?.Quantity || 1)
    );
  };
  const getSettings = () =>
    workTicketID ? "editing_work_ticket" : "creating_work_ticket";

  const getAvailableStock = (
    sku,
    item_id,
    quantityNeeded,
    initialAvailableStock,
    liveUpdate = true
  ) => {
    if (initialAvailableStock === "") return "";
    if (addedComponents.data?.length) {
      addedComponents.data.forEach((wt) => {
        let tickets = wt?.filter(
          (q) => q.Assembly_ID === item_id && q.Work_Ticket_ID !== workTicketID
        );

        let res = {};
        tickets?.forEach((q) => {
          res[q.Work_Ticket_ID] = q.Quantity_To_Build;
        });
        Object.keys(res).forEach((key) => {
          initialAvailableStock += parseFloat(res[key]);
        });
      });
    }
    if (usedComponents.data?.length) {
      usedComponents.data.forEach((item) => {
        item?.forEach((workTicket) => {
          if (
            workTicket.Component_ID === item_id &&
            workTicket.Work_Ticket_ID !== workTicketID
          ) {
            initialAvailableStock -= parseFloat(workTicket.Quantity_To_Build);
          }
        });
      });
    }
    if (!bundleId)
      initialAvailableStock =
        parseFloat(initialAvailableStock) -
        parseFloat(quantityNeeded) *
          parseFloat(
            liveUpdate
              ? getQtyToBuild()
              : parseFloat(currentWorkTicket.data?.Quantity) || 0
          );

    if (isNaN(initialAvailableStock)) return "";

    return parseFloat(initialAvailableStock).toFixed(
      settings.quantity_precision
    );
  };

  const getCommittedStock = () => {
    let committed = 0;
    if (committedSalesOrders.data?.length) {
      committedSalesOrders.data.forEach((q) => {
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

    if (
      selectedIndex < 0 &&
      selectedComponents.length + 1 === components.length
    ) {
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
      compositeItem.data?.composite_item?.mapped_items
        ?.filter((q) => selected.indexOf(q.item_id) >= 0)
        .map((q) => q.item_id)
    );
    setSelectedComponents([]);
  };

  const handleResetComponents = () => {
    if (compositeItem.data?.composite_item?.mapped_items) {
      setExcludedComponents([]);
      setComponents(compositeItem.data?.composite_item?.mapped_items);
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
      description: `${assemblySKU}      ${workTicketItem.description}`,
      composite_item_id: assemblyID,
      composite_item_name: workTicketItem.name,
      composite_item_sku: assemblySKU,
      quantity_to_bundle: getQtyToBuild(),
      line_items: components.map(
        ({
          item_id,
          name,
          description,
          quantity,
          inventory_account_id: account_id,
        }) => ({
          item_id,
          name,
          description,
          quantity_consumed: quantity,
          account_id,
          warehouse_id: primaryWarehouse?.warehouse_id,
        })
      ),
      is_completed: true,
    };
    createBundle.trigger({
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
    const currentWorkTicketUpdate = await fetcher(
      "getRecordById",
      creatorConfig({
        reportName: "All_Work_Tickets",
        id: workTicketID,
      })
    );
    const addedComponentsUpdate = await creatorMultiApiFetcher(
      compositeItem.data?.composite_item?.mapped_items
        ?.map((q) =>
          creatorConfig({
            reportName: "All_Work_Ticket_Details",
            page: 1,
            pageSize: 200,
            criteria: `(Assembly_ID=="${q.item_id}" && Status=="Open") `,
          })
        )
        .concat([
          creatorConfig({
            reportName: "All_Work_Ticket_Details",
            page: 1,
            pageSize: 200,
            criteria: `(Assembly_ID=="${assemblyID}" && Status=="Open") `,
          }),
        ])
        .map((q) => ({ ...q, method: "getAllRecords" }))
    );
    const usedComponentsUpdate = await creatorMultiApiFetcher(
      compositeItem.data?.composite_item?.mapped_items
        ?.map((q) =>
          creatorConfig({
            reportName: "All_Work_Ticket_Details",
            page: 1,
            pageSize: 200,
            criteria: `(Component_ID=="${q.item_id}" && Status=="Open") `,
          })
        )
        .concat([
          creatorConfig({
            reportName: "All_Work_Ticket_Details",
            page: 1,
            pageSize: 200,
            criteria: `(Component_ID=="${assemblyID}" && Status=="Open") `,
          }),
        ])
        .map((q) => ({ ...q, method: "getAllRecords" }))
    );
    await addedComponents.mutate(addedComponentsUpdate);
    await usedComponents.mutate(usedComponentsUpdate);
    await currentWorkTicket.mutate(currentWorkTicketUpdate);
    setToastSuccess(true);
    setOpen(false);
    await compositeItem.mutate();
    await assemblyItem.mutate();
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

  const workTicketItem = assemblyItem.data?.items?.[0];
  const primaryWarehouse = compositeItem.data?.composite_item?.warehouses?.[0];
  const isRefreshing =
    currentWorkTicket.isValidating ||
    addedComponents.isValidating ||
    usedComponents.isValidating ||
    compositeItem.isValidating ||
    assemblyItem.isValidating ||
    !workTicketItem;

  if (authenticate.isMutating) {
    return (
      <Box display="flex" alignItems="center" gap={2} p={3} component={Paper}>
        <CircularProgress size={20} />
        <Typography>Authenticating...</Typography>
      </Box>
    );
  }

  if (!assemblySKU) {
    return (
      <Alert severity="info">
        Search an assembly item to create work ticket.
      </Alert>
    );
  }

  if (
    assemblyItem.isLoading ||
    compositeItem.isLoading ||
    lastWorkTicket.isLoading ||
    users.isLoading ||
    currentWorkTicket.isLoading ||
    _zohoSettings.isLoading ||
    zohoSettings.isLoading ||
    addedComponents.isLoading ||
    usedComponents.isLoading
  ) {
    return <LinearProgress />;
  }

  if (!settings.api.access_token) {
    return (
      <Paper
        style={{
          height: "100vh",
          display: "grid",
          placeItems: "center",
          width: "100vw",
        }}
      >
        <Button
          variant="contained"
          onClick={() => {
            const param = {
              action: "open",
              url: getAuthenticationLink(
                encodeURI(
                  JSON.stringify({ assembly_id, assembly_sku, work_ticket_id })
                )
              ),
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

  if (assemblyItem.data?.items?.length <= 0) {
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
            <Button
              startIcon={<DeleteOutline />}
              onClick={handleDelete}
              disabled={!workTicketID}
            >
              Delete
            </Button>
            <Button startIcon={<AddOutlined />} onClick={handleNew}>
              New
            </Button>
            <Button
              disabled={
                !components ||
                !currentWorkTicket.data ||
                (status === "Completed" && !bundleId)
              }
              startIcon={<PrintOutlined />}
              onClick={() => {
                handleSave(null, async () => {
                  await handleRefreshData();
                  setTimeout(() => {
                    handlePrint(null, () => componentToPrint.current);
                  }, 0);
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
            <List
              style={{
                flexDirection: "row",
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              {isRefreshing &&
                new Array(5)
                  .fill(0)
                  .map((a, i) => (
                    <Skeleton
                      width={100 / 6 + "%"}
                      height={80}
                      animation="wave"
                      key={i}
                    />
                  ))}
              {!isRefreshing && (
                <>
                  <ListItemText
                    primary={workTicketItem.sku}
                    secondary={workTicketItem.name}
                    {...(settings.composite_items.show_link
                      ? {
                          primaryTypographyProps: {
                            component: Link,
                            href: getZohoInventoryItemLink(
                              workTicketItem.item_id,
                              workTicketItem.sku
                            ),
                            target: "_blank",
                          },
                        }
                      : {})}
                  />

                  <ListItemText
                    primary={parseFloat(workTicketItem.stock_on_hand).toFixed(
                      settings.quantity_precision
                    )}
                    secondary="Qty On Hand"
                  />
                  <ListItemText
                    primary={parseFloat(
                      workTicketItem.available_stock -
                        getCommittedStock() +
                        addedComponents.data?.reduce((acc, wt) => {
                          let tickets = wt?.filter(
                            (q) => q.Assembly_ID === assemblyID
                          );
                          let res = {};
                          tickets?.forEach((q) => {
                            res[q.Work_Ticket_ID] = q.Quantity_To_Build;
                          });
                          return (
                            acc +
                            Object.keys(res).reduce(
                              (a, o) => a + parseFloat(res[o]),
                              0
                            )
                          );
                        }, 0) -
                        usedComponents.data?.reduce((acc, wt) => {
                          let tickets = wt?.filter(
                            (q) => q.Component_ID === assemblyID
                          );
                          return (
                            acc +
                            tickets?.reduce(
                              (a, p) =>
                                a + parseFloat(p.Quantity_To_Build) || 0,
                              0
                            )
                          );
                        }, 0)
                    )}
                    secondary="Qty Available"
                  />
                  <ListItemText
                    primary={getCommittedStock()}
                    secondary="Committed"
                  />
                  <ListItemText
                    primary={workTicketItem.reorder_level || "N/A"}
                    secondary="Minimum Stock"
                  />
                  <ListItemText
                    primary={workTicketItem.unit.toUpperCase()}
                    secondary="UOM"
                  />
                  <ListItemText
                    primary={formatCurrency(workTicketItem.purchase_rate)}
                    secondary="Purchase Cost"
                  />
                  <ListItemText
                    primary={
                      <Typography
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        {formatCurrency(
                          getTotalCost(
                            settings[getSettings()].live_update.total_cost
                          )
                        )}
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
                options={users.data}
                getOptionLabel={(option) => option.Name.display_value}
                sx={{ width: 300 }}
                disableClearable
                disabled={!!bundleId}
                value={
                  createdBy
                    ? users.data.find((q) => q.ID === createdBy)
                    : users.data.find(
                        (q) =>
                          q.Email ===
                          ZOHO.CREATOR.UTIL.getInitParams().loginUser
                      )
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Created By"
                    variant="outlined"
                  />
                )}
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
                <MenuItem value="Completed" disabled={!currentWorkTicket.data}>
                  Completed
                </MenuItem>
              </Select>
            </Toolbar>
          </Grid>
          <Grid
            item
            xs={4}
            display="flex"
            flexDirection="column"
            alignItems="end"
          >
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
              defaultValue={parseFloat(qtyToBuild).toFixed(
                settings.quantity_precision
              )}
              disabled={status === "Completed"}
              onChange={(e) => {
                if (e.target.value >= 999999) {
                  setQtyToBuild(999999);
                  e.target.value = 999999;
                } else {
                  setQtyToBuild(e.target.value);
                }
              }}
              onBlur={(e) => {
                if (e.target.value <= 0) {
                  e.target.value = 1;
                  setQtyToBuild(1);
                }
              }}
              style={{
                width: "100%",
                maxWidth: 258,
              }}
            />
            {currentWorkTicket.data?.Bundle_ID && (
              <>
                <InputLabel shrink={false} htmlFor="bundle-id">
                  <Typography>
                    Bundle ID
                    <Link
                      href={getZohoInventoryBundleLink(
                        assemblyID,
                        currentWorkTicket.data?.Bundle_ID,
                        assemblySKU
                      )}
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
                    if (e.target.value !== currentWorkTicket.data.Bundle_ID) {
                      setDialog({
                        open: true,
                        title: "Confirm Bundle ID",
                        content: (
                          <Typography>
                            Changing the Bundle ID will unbind the work ticket
                            to the created bundle in Zoho.
                          </Typography>
                        ),
                        onClose: (value) => {
                          if (value !== true) {
                            setBundleId(currentWorkTicket.data.Bundle_ID);
                            setStatus(currentWorkTicket.data?.Status);
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
                      setBundleId(currentWorkTicket.data.Bundle_ID);
                      setStatus(currentWorkTicket.data?.Status);
                    }
                  }}
                />
              </>
            )}
          </Grid>
          <Grid item xs={12} mt={3}>
            {components?.length !==
              compositeItem.data?.composite_item?.mapped_items?.length && (
              <Alert severity="info">
                {!!bundleId
                  ? "One or more components were not included in the bundle."
                  : "One or more components will not be included in the bundle."}{" "}
                <Button onClick={handleResetComponents} disabled={!!bundleId}>
                  Reset
                </Button>
              </Alert>
            )}
            {!!components && !!currentWorkTicket.data && (
              <div style={{ display: "none" }}>
                <PDFTemplate
                  componentRef={componentToPrint}
                  workTicket={{
                    currentWorkTicket: {
                      ...{
                        ...currentWorkTicket.data,
                        Ticket_Completed: ticketCompleted,
                        Ticket_Started: ticketStarted,
                        Created_By: users.data.find((q) => q.ID === createdBy),
                        Date_field: workTicketDate,
                        Status: status,
                      },
                      ...workTicketItem,
                    },
                    components: components.map((d) => {
                      const {
                        actual_available_stock,
                        quantity,
                        purchase_rate,
                        sku,
                        item_id,
                      } = d;
                      return {
                        ...d,
                        unitCost: formatCurrency(purchase_rate),
                        totalUnitCost: formatCurrency(
                          purchase_rate * quantity * getQtyToBuild()
                        ),
                        required: quantity * getQtyToBuild(),
                        available: getAvailableStock(
                          sku,
                          item_id,
                          quantity,
                          actual_available_stock
                        ),
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
                    <Tooltip
                      title="Select at least (1) component."
                      placement="bottom"
                    >
                      <Checkbox
                        disabled={status === "Completed"}
                        indeterminate={
                          selectedComponents.length > 0 &&
                          selectedComponents.length < components.length - 1
                        }
                        checked={
                          selectedComponents.length > 0 &&
                          selectedComponents.length === components.length - 1
                        }
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
                        <Button
                          startIcon={<DeleteOutline />}
                          onClick={handleRemoveComponents}
                        >
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
                    const {
                      actual_available_stock,
                      name,
                      sku,
                      quantity,
                      stock_on_hand,
                      item_id,
                      purchase_rate,
                    } = d;
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
                          <Checkbox
                            checked={selected}
                            disabled={status === "Completed"}
                          />
                        </TableCell>
                        <TableCell>
                          {sku}
                          {settings.items.show_link && (
                            <Link
                              href={getZohoInventoryItemLink(
                                item_id,
                                sku,
                                false
                              )}
                              target="_blank"
                            >
                              <Launch
                                fontSize="small"
                                style={{ transform: "scale(0.7)" }}
                              />
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
                          {getRequiredQuantity(
                            quantity,
                            settings[getSettings()].live_update.required
                          )}
                        </TableCell>
                        <TableCell>
                          {isRefreshing && <Skeleton />}
                          {!isRefreshing &&
                            parseFloat(stock_on_hand).toFixed(
                              settings.quantity_precision
                            )}
                        </TableCell>
                        <TableCell>
                          {isRefreshing && <Skeleton />}
                          {!isRefreshing &&
                            getAvailableStock(
                              sku,
                              item_id,
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
