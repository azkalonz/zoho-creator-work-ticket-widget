import { createTheme } from "@mui/material/styles";

export default createTheme({
  palette: {
    primary: {
      main: "#ff8d45",
    },
    secondary: {
      main: "#21263c",
    },
    white: {
      main: "#fff",
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.secondary.main,
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          "&.MuiButton-textWhite:hover": {
            backgroundColor: theme.palette.primary.main,
          },
          "&.Mui-disabled": {
            color: theme.palette.white.main,
            opacity: 0.4,
          },
        }),
      },
    },
    MuiListItemText: {
      styleOverrides: {
        root: {
          marginBottom: 30,
        },
      },
    },
  },
});
