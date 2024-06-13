import { useContext } from "react";
import { ConfirmDialogContext } from "../components/ConfirmDialog";

function useConfirmDialog(props) {
  const {
    setOpen: setDialogOpen,
    setOnClose,
    setContent,
    setTitle,
    setActions,
    setControlled,
    open,
  } = useContext(ConfirmDialogContext);

  const setDialog = ({ title, content, onClose, open, actions, controlled }) => {
    setTitle(title || "Confirmation");
    setContent(content);
    setOnClose(() => {
      return onClose;
    });
    if (open !== undefined) setDialogOpen(open);
    setActions(() => {
      return actions;
    });
    setControlled(controlled);
  };

  const setOpen = (open) => {
    setControlled(false);
    setDialogOpen(open);
  };

  return { setDialog, setOpen, isOpen: open };
}

export default useConfirmDialog;
