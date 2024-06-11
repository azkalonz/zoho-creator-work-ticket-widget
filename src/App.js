import { ThemeProvider } from "@mui/material";
import { HashRouter, Route, Switch } from "react-router-dom";
import "./App.css";
import theme from "./mui/theme";
import SalesHistory from "./views/SalesHistory";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <HashRouter>
        <Switch>
          <Route exact path="/">
            <SalesHistory />
          </Route>

          <Route exact path="/test">
            <SalesHistory />
          </Route>
        </Switch>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
