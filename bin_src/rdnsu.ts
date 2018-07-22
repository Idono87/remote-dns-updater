#!/usr/bin/env node
import yargs = require("yargs");
import winston = require("winston");
import InstanceLocker = require("instance-locker");
import { spawn, ChildProcess } from "child_process";
import path = require("path");

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

const instanceLock: InstanceLocker.LockerAsync = InstanceLocker(
  "Remote DNS Updater",
  false,
  true
);

async function start(): Promise<void> {
  //Exit if an instance is already running.
  let pid: number = await instanceLock.GetOwnerPID();
  try {
    if (pid !== -1) {
      process.kill(pid, 0);
      winston.info("Remote DNS Updater is already running.");
      exit(0);
      return;
    }
  } catch (err) {
    if (err.code !== "ESRCH") {
      winston.error(err.message);
      exit(0);
      return;
    }
  }

  const options = {
    cwd: path.join(__dirname, ".."),
    stdio: "ignore",
    env: process.env,
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
  let interval: NodeJS.Timer = setInterval(async () => {
    pid = await instanceLock.GetOwnerPID();
    try {
      if (pid !== -1) {
        process.kill(pid, 0);
        winston.info("Application has started successfully.");
        clearInterval(interval);
        exit(0);
        return;
      }
    } catch (err) {}

    hasStartedCount++;
    if (hasStartedCount >= 10) {
      winston.info("Could not start application.");
      clearInterval(interval);
      exit(0);
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
    if (pid === -1) {
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
  const options = {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    env: process.env,
    detached: false
  };

  let subProcess: ChildProcess = spawn(
    "node",
    ["./lib/app.js", ...process.argv.slice(2)],
    options
  );
}

function exit(code: number): void {
  process.exitCode = code;
}

let args: any = yargs.parse();
