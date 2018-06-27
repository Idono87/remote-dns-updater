#!/usr/bin/env node
import yargs = require("yargs");
import winston = require("winston");
import InstanceLocker = require("instance-locker");
import { spawn, ChildProcess } from "child_process";

// TODO: Create a better launching script.
/////////////////////////////////////////////////////////////
//// Winston Initialization.
/////////////////////////////////////////////////////////////

/* debug */
winston.debug("Initializing 'Winston'");
/* debug-end */

winston.setLevels(winston.config.npm.levels);

const cOptions: winston.ConsoleTransportOptions = {
  level: "silly",
  colorize: true,
  timestamp: true
};

winston.clear();
winston.add(winston.transports.Console, cOptions);
winston.handleExceptions();

/////////////////////////////////////////////////////////////
//// CLI Initialization.
/////////////////////////////////////////////////////////////

/* debug */
winston.debug("Initializing Yargs Commands");
/* debug-end */

yargs.help(false);
yargs
  .alias("verbose", "v")
  .boolean("verbose")
  .nargs("verbose", 0)
  .default("verbose", false);

yargs.command("start", "Start the application.", {}, start);
yargs.command("restart", "Restart the application.", {}, restart);
yargs.command("stop", "Stop the application.", {}, stop);
yargs.command("$0", "Default Start in verbose", {}, defaultStart);

/////////////////////////////////////////////////////////////
//// Commands
/////////////////////////////////////////////////////////////
process.env.LOCK_NAME = "Remote DNS Updater";

const instanceLock: InstanceLocker.LockerAsync = InstanceLocker(
  process.env.LOCK_NAME,
  false,
  true
);

async function start(): Promise<void> {
  //Exit if an instance is already running.
  let pid: number = await instanceLock.GetOwnerPID();
  try {
    process.kill(pid, 0);
    winston.info("Remote DNS Updater is already running.");
    exit(0);
  } catch (err) {
    if (err.code !== "ESRCH") {
      winston.error(err.message);
      exit(0);
      return;
    }
  }

  const env = {
    LOCK_NAME: process.env.LOCK_NAME
  };

  const options = {
    cwd: process.cwd(),
    stdio: "ignore",
    env: env,
    detached: true
  };

  let subProcess: ChildProcess = spawn(
    "node",
    ["./lib/app.js", ...process.argv.slice(2)],
    options
  );

  subProcess.on("error", err => {
    winston.error(err.message);
    exit(0);
  });

  subProcess.unref();

  let hasStartedCount: number = 0;
  setInterval(async () => {
    pid = await instanceLock.GetOwnerPID();
    try {
      process.kill(pid, 0);
      winston.info("Application has started successfully.");
      exit(0);
      return;
    } catch (err) {}
    hasStartedCount++;
    if (hasStartedCount >= 10) {
      winston.info("Could not start application.");
    }
  }, 500);
}

async function restart(): Promise<void> {
  if (await stop()) {
    await start();
  }
}

async function stop(): Promise<boolean> {
  let exitInterval: NodeJS.Timer;

  try {
    let pid: number = await instanceLock.GetOwnerPID();
    if (pid == -1) {
      winston.info("The application is not running.");
      return false;
    }

    process.kill(pid, "SIGINT");

    //Test if process has exited.
    await new Promise((resolve, reject) => {
      let retries: number = 0;
      const maxRetries: number = 10;
      exitInterval = setInterval(() => {
        try {
          retries++;
          process.kill(pid, 0);
        } catch (err) {
          clearInterval(exitInterval);
          reject(err);
          return;
        }

        if (retries >= maxRetries) {
          clearInterval(exitInterval);
          resolve(false);
          return;
        }
      }, 1000);
    });

    winston.info("Failed to stop the application.");
    return false;
  } catch (err) {
    if (err.code !== "ESRCH") {
      winston.error("Failed to stop the application.");
      return false;
    }
  }

  winston.info("Application has stopped");
  return true;
}

async function defaultStart(): Promise<void> {
  const env = {
    STARTED_FROM: process.env.STARTED_FROM,
    LOCK_NAME: process.env.LOCK_NAME
  };

  const options = {
    cwd: process.cwd(),
    stdio: "inherit",
    env: env,
    detached: false
  };

  let subProcess: ChildProcess = spawn(
    "node",
    ["./lib/app.js", ...process.argv.slice(2)],
    options
  );

  winston.error("Parent Process: " + process.pid.toString());
  winston.error("SubProcess: " + subProcess.pid.toString());
}

function exit(code: number): void {
  process.kill(code);
}

let args: any = yargs.parse();
