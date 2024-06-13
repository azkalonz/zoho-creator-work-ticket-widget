import axios from "axios";

export const zoho_client = {
  refresh_token: "1000.ac41ed57cf699c14d1af404a7745dc45.e57524f237cf924babbb3d7dd1625da0",
  client_id: "1000.DQMP4JH4HYV87AR5340JGWMHH71K0J",
  client_secret: "3dd120a321c0be6066572fcaf814563ffa47c6350f",
  redirect_uri: "https://creatorapp.zoho.com/autoline491/component-checker",
  org_id: "789146207",
};

/*global ZOHO*/
const fetcher = (method, config) => ZOHO.CREATOR.API[method](config).then((res) => res.data || res.result);

const zohoAxiosInstance = axios.create({
  baseURL: "https://ksportusa.com/zoho/zohoapi.php",
  headers: {
    "Content-type": "application/json",
    orgId: zoho_client.org_id,
    Authorization: "Bearer 1000.0f61fa7fdca7ed5c1d0dad36cfb281b7.2c4651c2ec90f47191a34fa9828e9011",
  },
});
export const zohoApiFetcher = (url, args = {}) => {
  url = "?url=https://www.zohoapis.com/inventory/v1/" + url;
  if (url.indexOf("organization_id") < 0) {
    url += url.indexOf("?") >= 0 ? `&organization_id=${zoho_client.org_id}` : `?organization_id=${zoho_client.org_id}`;
  }
  url = encodeURI(url);
  args.url = url;
  return zohoAxiosInstance(args)
    .then((res) => res.data)
    .catch((q) => {
      axios
        .post(
          `https://accounts.zoho.com/oauth/v2/token?refresh_token=${zoho_client.refresh_token}&client_id=${zoho_client.client_id}&client_secret=${zoho_client.client_secret}&redirect_uri=${zoho_client.redirect_uri}&grant_type=refresh_token`
        )
        .then((res) => {
          console.log(res);
        });
    });
};

export default fetcher;
