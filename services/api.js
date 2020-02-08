const moment = require("moment");
const nodeFetch = require("node-fetch");
const fetch = require("fetch-cookie")(nodeFetch);
const qs = require("qs");
const axios = require("axios");

const { headers, clockingHeaders } = require("../config/config");
const credentials = require("../credentials");

const urlApi = "https://newapi.intratime.es/api";
const loginUrlApi = `${urlApi}/user/login`;
const clockingUrlApiGET = `${urlApi}/user/clockings`;
const clockingUrlApiPOST = `${urlApi}/user/clocking`;

const login = async () =>
  axios({
    method: "post",
    url: loginUrlApi,
    data: qs.stringify({
      user: credentials.user,
      pin: credentials.pin
    }),
    headers
  })
    .then(response => response)
    .catch(err => console.error(err) && err);

const clockingAction = async ({ action = 0, token }) =>
  axios({
    method: "post",
    url: clockingUrlApiPOST,
    data: qs.stringify({
      user_action: action,
      user_timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
      user_gps_coordinates: "0.0,0.0",
      user_project: "",
      inout_device_uid: 2,
      user_use_server_time: true,
      expense_amount: 0,
      from_web: true
    }),
    headers: {
      ...clockingHeaders({ token })
    }
  })
    .then(response => response)
    .catch(err => console.error(err) && err);

const getClocking = async ({ iniDate, endDate, token, types }) =>
  axios
    .get(clockingUrlApiGET, {
      params: {
        from: iniDate,
        to: moment(endDate)
          .add(1, "days")
          .format("YYYY-MM-DD"), // yes, you need to add a day to 'end date' because whoever design the API he was very genious thinking that end date its not included itself.
        type: types.join(",")
      },
      headers: {
        ...clockingHeaders({ token })
      }
    })
    .then(response => response)
    .catch(err => console.error(err) && err);

module.exports = {
  login,
  clockingAction,
  getClocking
};
