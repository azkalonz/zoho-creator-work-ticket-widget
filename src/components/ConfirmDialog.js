import { Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress } from "@mui/material";
import React, { createContext, useState } from "react";

export const ConfirmDialogContext = createContext({});

function ConfirmDialogProvider(props) {
  const { children, ...dialogProps } = props;
  const [onClose, setOnClose] = useState(() => {});
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(<></>);
  const [title, setTitle] = useState("Confirmation");
  const [actions, setActions] = useState(() => <></>);
  const [controlled, setControlled] = useState(false);

  const handleOnClose = (value, close = true) => {
    if (close) {
      if (typeof onClose === "function") onClose(value);
      setOpen(false);
    }
  };

  return (
    <>
      <Dialog
        {...dialogProps}
        open={open}
        onClose={() => {
          if (controlled !== true) {
            if (onClose) onClose();
            setOpen(false);
          }
        }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>{content || <LinearProgress />}</DialogContent>
        {typeof actions === "function" && <DialogActions>{actions(handleOnClose)}</DialogActions>}
      </Dialog>
      <ConfirmDialogContext.Provider
        value={{
          onClose,
          setOnClose,
          content,
          setContent,
          title,
          setTitle,
          open,
          setOpen,
          actions,
          setActions,
          controlled,
          setControlled,
          handleOnClose,
        }}
      >
        {children}
      </ConfirmDialogContext.Provider>
    </>
  );
}

export default ConfirmDialogProvider;
