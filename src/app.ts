import winston = require("winston");
import Configuration from "./init";
import RemoteUpdater from "./remoteUpdater";
import InstanceLocker = require("instance-locker");
import ConfigurationObject from "./configurationObject";

const instanceLock: InstanceLocker.LockerAsync = InstanceLocker(
  "Remote DNS Updater",
  false,
  true
);

let updater: RemoteUpdater;
let interval: NodeJS.Timer;

async function run(): Promise<void> {
  if (!(await instanceLock.Lock())) {
    winston.info("Application is already running");
    kill(0);
    return;
  }

  let nIntervalMin =
    <number>(<ConfigurationObject>Configuration).update_interval * 1000 * 60;

  updater = new RemoteUpdater(<ConfigurationObject>Configuration);
  interval = setInterval(update, nIntervalMin);
  await update();

  return;
}

async function update(): Promise<void> {
  try {
    await updater.update();
  } catch (err) {
    winston.error("The following error has ocurred while trying to update.");
    winston.error(err);
    kill(1);
  }
}

async function exit(code: number) {
  clearInterval(interval);
  await instanceLock.Unlock();
  process.exitCode = code;
}

function kill(code: number) {
  process.exit(code);
}

process.on("SIGINT", () => {
  exit(0);
});
process.on("SIGHUP", () => {
  exit(0);
});

process.on("uncaughtException", err => {
  winston.error(err.message);
  kill(0);
});

run().catch(err => {
  throw err;
});
