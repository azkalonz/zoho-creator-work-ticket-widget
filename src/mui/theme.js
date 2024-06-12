import { orange } from "@mui/material/colors";
import { createTheme } from "@mui/material/styles";

export default createTheme({
  palette: {
    primary: {
      main: orange[500],
    },
  },
  components: {
    MuiListItemText: {
      styleOverrides: {
        root: {
          marginBottom: 30,
        },
      },
    },
  },
});
