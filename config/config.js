const clockingActions = {
  CHECK_IN: 0,
  CHECK_OUT: 1,
  PAUSE_START: 2,
  PAUSE_END: 3
};

const headers = {
  Accept: "application/vnd.apiintratime.v1+json",
  "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
};

const clockingHeaders = ({ token }) => ({
  ...headers,
  token: token
});

module.exports = {
  headers,
  clockingHeaders,
  clockingActions
};
