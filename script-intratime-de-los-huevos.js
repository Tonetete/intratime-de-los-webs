const _ = require("lodash");
global._ = _;
const moment = require("moment");
const momentDurationFormatSetup = require("moment-duration-format");
momentDurationFormatSetup(moment);
const readline = require("readline");
const utf8 = require("utf8");

const { login, clockingAction, getClocking } = require("./services/api");
const { clockingActions } = require("./config/config");
const {
  getDateFormat,
  getMonday,
  getToday,
  diffTimesInSeconds,
  formatSecondsToHoursAndMinutes
} = require("./utils/utils");

class Intratime {
  constructor() {
    this.token = "";
    this.errMessage = "Introduce una opción válida melón!";
    this.goalTimeSeconds = 144000;
    const c1 = Math.floor(Math.random() * 36.73739) + 36.737385;
    const c2 = Math.floor(Math.random() * -4.552383) + -4.5523663;
    this.coordenates = Buffer.from(`${c1},${c2}`);
  }

  getPromptAction(action) {
    if (action === clockingActions.CHECK_IN) {
      return "Entrada";
    } else if (action === clockingActions.CHECK_OUT) {
      return "Salida";
    } else if (action === clockingActions.PAUSE_START) {
      return "Pausa";
    } else if (action === clockingActions.PAUSE_END) {
      return "Vuelta";
    }
  }

  async doAction(action) {
    try {
      if (!this.token) {
        const { data: loginData } = await login();
        const { USER_TOKEN } = loginData;
        this.token = USER_TOKEN;
      }
      const { data } = await clockingAction({ action, token: this.token });
      console.info(
        `Has fichado una ${this.getPromptAction(action)} a las: ${
          data.INOUT_CREATETIME.split(" ")[1]
        }`
      );
    } catch (e) {
      console.error(e);
    }
  }

  async getHoursWeek() {
    try {
      if (!this.token) {
        const { data: loginData } = await login();
        const { USER_TOKEN } = loginData;
        this.token = USER_TOKEN;
      }

      const dateFirstDayOfTheWeek = getMonday();
      const today = getToday();

      const { data: clockingData } = await getClocking({
        iniDate: dateFirstDayOfTheWeek,
        endDate: today,
        token: this.token,
        types: [
          clockingActions.CHECK_IN,
          clockingActions.CHECK_OUT,
          clockingActions.PAUSE_START,
          clockingActions.PAUSE_END
        ]
      });

      const clockingDataByDay = clockingData.reduce((accum, current) => {
        const date = current.INOUT_DATE.split(" ")[0];
        if (_.isEmpty(accum[date])) {
          accum[date] = { clockings: [], totalTime: 0 };
        }
        accum[date].clockings.push({
          createDate: current.INOUT_DATE,
          type: current.INOUT_TYPE
        });
        return accum;
      }, {});

      const keyDays = Object.keys(clockingDataByDay);

      if (keyDays.length) {
        let totalSecondsWorkedWeek = 0;
        keyDays.forEach(key => {
          clockingDataByDay[key].clockings.reverse();
          let lastClocking = clockingDataByDay[key].clockings[0];
          if (clockingDataByDay[key].clockings.length === 1) {
            lastClocking = null;
          } else {
            clockingDataByDay[key].clockings = clockingDataByDay[
              key
            ].clockings.slice(1);
          }

          const secondsWorked = clockingDataByDay[key].clockings.reduce(
            (accum, currentClocking, index) => {
              let timeDiff = 0;

              // if last clocking is CHECK_IN or PAUSE_END, we have to diff time with current time
              if (
                index === clockingDataByDay[key].clockings.length - 1 &&
                (currentClocking.type === clockingActions.CHECK_IN ||
                  currentClocking.type === clockingActions.PAUSE_END)
              ) {
                timeDiff = diffTimesInSeconds(
                  currentClocking.createDate,
                  getDateFormat()
                );
              } else {
                //Sum times if comply in -> pause || pause -> exit || in -> out
                if (
                  this.checkIsCountableInterval(
                    lastClocking.type,
                    currentClocking.type
                  )
                ) {
                  timeDiff = diffTimesInSeconds(
                    lastClocking.createDate,
                    currentClocking.createDate
                  );
                }
                lastClocking = currentClocking;
              }
              return accum + timeDiff;
            },
            0
          );
          clockingDataByDay[key].totalTime = formatSecondsToHoursAndMinutes(
            secondsWorked
          );
          totalSecondsWorkedWeek += secondsWorked;
          console.info(
            `Total tiempo trabajado el día ${key}: ${clockingDataByDay[key].totalTime}`
          );
        });
        const totalDuration = formatSecondsToHoursAndMinutes(
          totalSecondsWorkedWeek
        );

        console.info(`Total tiempo trabajado esta semana: ${totalDuration}`);

        console.info(
          `Tienes tiempo pendiente por trabajar de: ${formatSecondsToHoursAndMinutes(
            this.goalTimeSeconds - totalSecondsWorkedWeek
          )}`
        );
      }
    } catch (e) {
      console.error(e);
    }
  }

  checkIsCountableInterval(lastClockingAction, currentClockingAction) {
    return (
      (lastClockingAction === clockingActions.CHECK_IN &&
        currentClockingAction === clockingActions.PAUSE_START) ||
      (lastClockingAction === clockingActions.PAUSE_END &&
        currentClockingAction === clockingActions.CHECK_OUT) ||
      (lastClockingAction === clockingActions.CHECK_IN &&
        currentClockingAction === clockingActions.CHECK_OUT) ||
      (lastClockingAction === clockingActions.PAUSE_END &&
        currentClockingAction === clockingActions.PAUSE_START)
    );
  }

  run() {
    this.getHoursWeek();
    console.info("Elije una acción para el intratime de los webs:");
    console.info("1)checkin\n2)checkout\n3)pause\n4)return\n5)ver horas");

    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on("line", option => {
      try {
        if (Number(option) >= 1 && Number(option) <= 4) {
          this.doAction(Number(option - 1));
          rl.close();
        } else if (Number(option) === 5) {
          this.getHoursWeek();
          rl.close();
        } else {
          console.error(errMessage);
        }
      } catch (e) {
        console.error(errMessage);
      }
    });
  }
}

const intratime = new Intratime();
intratime.run();
