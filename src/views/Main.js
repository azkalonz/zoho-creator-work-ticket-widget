import { LoginOutlined } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import creatorConfig from "../lib/creatorConfig";
import { zohoAxiosInstance } from "../services/fetcher.js";
import {
  useAuthenticateMutation,
  useRefreshMutation,
  useUpdateRecordMutation,
} from "../services/mutation";
import { useGetAllRecords, useGetRecordById } from "../services/queries";
import { settings } from "../settings.js";
import { getAuthenticationLink } from "../utils.js";

function Main() {
  /*global ZOHO*/
  const { code, state } = ZOHO.CREATOR.UTIL.getQueryParams();

  const updateSettings = useUpdateRecordMutation();

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

  const users = useGetAllRecords(
    creatorConfig({
      reportName: "All_Users",
      page: 1,
      pageSize: 200,
    })
  );

  useEffect(() => {
    if (refresh.data?.access_token) {
      handleAuth(
        refresh.data,
        encodeURI(JSON.stringify({ params: "<PARAMS>" }))
      );
    }
  }, [refresh.data]);

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
        if (path.length > 2) {
          settings[option][settingKey][settingKey2] = s[key];
        } else if (path.length > 1) {
          settings[option][settingKey] = s[key];
        } else {
          settings[option] = s[key];
        }
      });
      if (settings.api.access_token) {
        zohoAxiosInstance.defaults.headers.common.Authorization =
          settings.api.access_token;
        setIsReady(true);
      }
    }
  }, [zohoSettings.data]);

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

  const loggedInUser = users?.data?.find(
    (q) => q.Email === ZOHO.CREATOR.UTIL.getInitParams().loginUser
  );

  if (authenticate.isMutating) {
    return (
      <Box display="flex" alignItems="center" gap={2} p={3} component={Paper}>
        <CircularProgress size={20} />
        <Typography>Authenticating...</Typography>
      </Box>
    );
  }

  if (users.isLoading || _zohoSettings.isLoading || zohoSettings.isLoading) {
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
        {loggedInUser?.Role !== "ADMIN" &&
          loggedInUser?.Role !== "SUPERADMIN" && (
            <Alert severity="info">
              <Typography>
                Please contact your admin to enable the Zoho Inventory
                integration.
              </Typography>
            </Alert>
          )}
        {(loggedInUser?.Role === "ADMIN" ||
          loggedInUser?.Role === "SUPERADMIN") && (
          <Button
            variant="contained"
            onClick={() => {
              const param = {
                action: "open",
                url: getAuthenticationLink(
                  encodeURI(
                    JSON.stringify({
                      params: "<PARAMS>",
                    })
                  )
                ),
                window: "same",
              };
              /*global ZOHO */
              ZOHO.CREATOR.UTIL.navigateParentURL(param);
            }}
            startIcon={<LoginOutlined />}
          >
            Connect to Zoho Inventory
          </Button>
        )}
      </Paper>
    );
  }

  const vars = {
    loggedInUser,
    users,
    settings,
    isReady,
  };

  return (
    <Paper>
      <Grid container gap={3} p={10}>
        {Object.keys(vars).map((key) => (
          <Grid item xs={12} key={key}>
            <Accordion>
              <AccordionSummary>
                <Typography>
                  <Typography variant="h5">{key}</Typography>
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <pre>{JSON.stringify(vars[key], undefined, 2)}</pre>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

export default Main;
