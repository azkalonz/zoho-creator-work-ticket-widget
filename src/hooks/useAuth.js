import React, { useEffect, useState } from "react";
import creatorConfig from "../lib/creatorConfig";
import {
  useAuthenticateMutation,
  useRefreshMutation,
  useUpdateRecordMutation,
} from "../services/mutation";
import { settings } from "../settings";
import { useGetAllRecords, useGetRecordById } from "../services/queries";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import { getAuthenticationLink } from "../utils";
import { LoginOutlined } from "@mui/icons-material";
import { zohoAxiosInstance } from "../services/fetcher";

function useAuth(props) {
  /*global ZOHO*/
  const { code, state } = ZOHO.CREATOR.UTIL.getQueryParams();
  const updateSettings = useUpdateRecordMutation();
  const authenticate = useAuthenticateMutation(code);
  const [error, setError] = useState();

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

  const refresh = useRefreshMutation(zohoSettings.data?.api__refresh_token);

  const users = useGetAllRecords(
    !zohoSettings
      ? null
      : creatorConfig({
          reportName: "All_Users",
          page: 1,
          pageSize: 200,
        })
  );

  const [isReady, setIsReady] = useState(false);

  const loggedInUser = users?.data?.find(
    (q) => q.Email === ZOHO.CREATOR.UTIL.getInitParams().loginUser
  );

  useEffect(() => {
    if (refresh.data?.access_token) {
      handleAuth(
        refresh.data,
        encodeURIComponent(JSON.stringify({ params: "<PARAMS>" }))
      );
    } else if (refresh.data?.error === "invalid_code") {
      setError(
        "Invalid refresh token. Refresh the page and reauthorize the connection."
      );
      handleResetKeys();
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
      } else if (zohoSettings.data?.api__refresh_token) {
        refresh.trigger();
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
    } else if (authenticate.data?.error === "invalid_code") {
      setError(
        "Invalid token. Refresh the page and reauthorize the connection"
      );
      handleResetKeys();
    }
  }, [authenticate.isMutating]);

  const suspenseComponent = () => {
    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    if (authenticate.isMutating || refresh.isMutating) {
      return (
        <Box display="flex" alignItems="center" gap={2} p={3} component={Paper}>
          <CircularProgress size={20} />
          <Typography>Authenticating...</Typography>
        </Box>
      );
    }

    if (!isReady && !zohoSettings.data) {
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
                    encodeURIComponent(
                      JSON.stringify({
                        redirect_url: settings.widget_url,
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

    return null;
  };

  const handleResetKeys = () => {
    updateSettings.trigger(
      creatorConfig({
        reportName: "All_Settings",
        id: zohoSettings.data.ID,
        data: {
          data: {
            api__access_token: null,
            api__refresh_token: null,
          },
        },
      })
    );
  };

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
            url: `#Page:Inventory?`,
            window: "same",
          };
          if (state) {
            let s = JSON.parse(decodeURIComponent(state));
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

  return {
    code,
    authenticate,
    loggedInUser,
    isReady,
    users,
    suspenseComponent,
    settings,
    refresh,
  };
}

export default useAuth;
