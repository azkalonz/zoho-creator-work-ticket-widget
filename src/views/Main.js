import { AddOutlined, DeleteOutline, PrintOutlined, SaveOutlined } from "@mui/icons-material";
import {
  Alert,
  AppBar,
  Autocomplete,
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Grid,
  InputLabel,
  LinearProgress,
  List,
  ListItemText,
  MenuItem,
  Paper,
  Select,
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
import React, { useEffect, useState } from "react";
import useConfirmDialog from "../hooks/useConfirmDialog";
import creatorConfig from "../lib/creatorConfig";
import { useAddRecordMutation, useDeleteRecordMutation, useUpdateRecordMutation } from "../services/mutation";
import { useGetAllRecords, useGetCompositeItem, useGetRecordById, useSearchItem } from "../services/queries";

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
  const [createdBy, setCreatedBy] = useState();
  const [qtyToBuild, setQtyToBuild] = useState(1);
  const [error, setError] = useState("");
  const [toastSuccess, setToastSuccess] = useState(false);

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
  const { trigger: deleteWorkTicket, error: workTicketDeleteError } = useDeleteRecordMutation();

  const { data: currentWorkTicket, isLoading: isCurrentWorkTicketLoading } = useGetRecordById(
    "All_Work_Tickets",
    workTicketID
  );
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
          criteria: `SKU=="${assemblySKU}" && Status=="Open" && ID!=${workTicketID}`,
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
  const { data: compositeItem, isLoading: isCompositeItemLoading } = useGetCompositeItem(assemblyID);
  const { data: assemblyItem, isLoading: isAssemblyItemLoading } = useSearchItem(assemblySKU);
  console.log("fff", relatedWorkTickets);
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
    if (currentWorkTicket?.ID) {
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
    }
  }, [currentWorkTicket]);

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
    } else if (workTicketDeleteError) {
      setError(workTicketDeleteError.responseText);
    }
  }, [workTicketError, workTicketSaveError, workTicketDeleteError]);

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

  const handleSave = () => {
    setError(null);
    setToastSuccess(false);
    setOpen(true);
    setDialog({
      title: "Saving work ticket...",
      controlled: true,
    });
    const formData = {
      data: {
        SKU: assemblySKU,
        Quantity: qtyToBuild,
        Date_field: moment(workTicketDate).format("DD-MMM-YYYY"),
        Created_By: createdBy,
        Assembly_ID: assemblyID,
        Status: status,
      },
    };
    if (!formData.data.Created_By) {
      const user = users.find((q) => q.Email === ZOHO.CREATOR.UTIL.getInitParams().loginUser);
      formData.data.Created_By = user?.ID;
    }
    if (currentWorkTicket?.ID) {
      if (ticketStarted) {
        formData.data.Ticket_Started = moment(ticketStarted).format("DD-MMM-YYYY");
      }
      if (ticketCompleted) {
        formData.data.Ticket_Completed = moment(ticketCompleted).format("DD-MMM-YYYY");
      }
      updateWorkTicket(
        creatorConfig({
          reportName: "All_Work_Tickets",
          id: currentWorkTicket.ID,
          data: formData,
        })
      );
    } else {
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
            handleNew();
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
        console.log("v", value);
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
    return initialAvailableStock;
  };

  const workTicketItem = assemblyItem.items[0];

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
            <Button startIcon={<PrintOutlined />}>Print</Button>
            <Button startIcon={<SaveOutlined />} onClick={handleSave}>
              Save
            </Button>
          </ButtonGroup>
        </AppBar>
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
            <DatePicker
              id="work-ticket-date"
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
            <Toolbar
              sx={{
                display: "flex",
                gap: 1,
                padding: "0!important",
              }}
            >
              <Autocomplete
                options={users}
                getOptionLabel={(option) => option.Name.display_value}
                sx={{ width: 300 }}
                disableClearable
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
                label="Ticket Started"
                {...(ticketStarted ? { value: moment(ticketStarted) } : {})}
                onChange={(val) => {
                  setTicketStarted(val);
                }}
              />
              <DatePicker
                label="Ticket Completed"
                disabled={!currentWorkTicket}
                {...(ticketCompleted ? { value: moment(ticketCompleted) } : {})}
                onChange={(val) => {
                  setTicketCompleted(val);
                }}
              />
              <Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  if (e.target.value === "Completed" && !ticketCompleted) {
                    setTicketCompleted(new Date());
                  }
                }}
              >
                <MenuItem value="Open">Open</MenuItem>
                <MenuItem value="Completed" disabled={!currentWorkTicket}>
                  Completed
                </MenuItem>
              </Select>
            </Toolbar>
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
                {compositeItem?.composite_item?.mapped_items?.map((d) => {
                  const { actual_available_stock, name, sku, quantity } = d;
                  return (
                    <TableRow key={sku}>
                      <TableCell>{sku}</TableCell>
                      <TableCell>{name}</TableCell>
                      <TableCell>{quantity}</TableCell>
                      <TableCell>{actual_available_stock}</TableCell>
                      <TableCell>
                        {getAvailableStock(quantity, actual_available_stock) - quantity * qtyToBuild}
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
