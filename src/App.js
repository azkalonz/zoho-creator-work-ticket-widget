import { ThemeProvider } from "@mui/material";
import "./App.css";
import theme from "./mui/theme";
import Main from "./views/Main";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Main />
    </ThemeProvider>
  );
}

export default App;
