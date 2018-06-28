import fs = require("fs");
import path = require("path");
import { getConfigurationPath } from "./util";

const configOutput: string = JSON.stringify({
  remote_hostname: "HOSTNAME",
  path: "PATH",
  user: "USER",
  password: "PASSWORD",
  dns_record: "YOUR HOSTNAME"
});

//Config directory and
try {
  try {
    fs.mkdirSync(getConfigurationPath(), 0o660);
  } catch (err) {
    if (err.code !== "EEXSIT") {
      throw err;
    }
  }
  let fd = fs.openSync(
    path.join(getConfigurationPath(), "config.cfg"),
    fs.constants.O_CREAT | fs.constants.O_WRONLY | fs.constants.O_EXCL,
    0o660
  );
  fs.writeSync(fd, configOutput);
  fs.closeSync(fd);
} catch (err) {
  if (err.code !== "EEXIST") {
    throw err;
  }
}

try {
  let logPath: string = path.join(getConfigurationPath(), "log");
  try {
    fs.mkdirSync(logPath, 0o660);
  } catch (err) {
    if (err.code !== "EEXSIT") {
      throw err;
    }
  }
  let fd = fs.openSync(
    path.join(logPath, "rdnsu.log"),
    fs.constants.O_CREAT | fs.constants.O_WRONLY | fs.constants.O_EXCL,
    0o660
  );
  fs.closeSync(fd);
} catch (err) {
  if (err.code !== "EEXIST") {
    throw err;
  }
}
