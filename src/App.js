import { ThemeProvider } from "@mui/material";
import "./App.css";
import theme from "./mui/theme";
import Main from "./views/Main";
import ConfirmDialogProvider from "./components/ConfirmDialog";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <ConfirmDialogProvider>
        <Main />
      </ConfirmDialogProvider>
    </ThemeProvider>
  );
}

export default App;
