export default function creatorConfig(extraConfig) {
  return {
    /*global ZOHO*/
    appName: ZOHO.CREATOR.UTIL.getInitParams().appLinkName,
    ...extraConfig,
  };
}
