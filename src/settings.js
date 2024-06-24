export const settings = {
  org_id: 789146207,
  quantity_precision: 2,
  items: {
    show_link: false,
  },
  composite_items: {
    show_link: true,
  },
  creating_work_ticket: {
    live_update: {
      total_unit_cost: false,
      required: false,
      available: false,
      total_cost: false,
    },
  },
  editing_work_ticket: {
    live_update: {
      total_unit_cost: true,
      required: true,
      available: true,
      total_cost: true,
    },
  },
  api: {
    access_token: "",
    refresh_token: "",
    scopes: "ZohoInventory.compositeitems.ALL,ZohoInventory.items.ALL,ZohoInventory.salesorders.ALL",
    client_id: "1000.DQMP4JH4HYV87AR5340JGWMHH71K0J",
    client_secret: "3dd120a321c0be6066572fcaf814563ffa47c6350f",
    redirect_url: "https://ksportusa.com/zoho/zohoapiredirect.php",
  },
};
