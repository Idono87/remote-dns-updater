import fs = require("fs-extra");
import path = require("path");
import { getConfigurationPath } from "./util";

const mustHaveConfigurationProperties = {
  remote_hostname: "HOSTNAME",
  path: "PATH",
  user: "USER",
  password: "PASSWORD",
  dns_record: "YOUR HOSTNAME"
};

let configPathToCreate: string = path.join(getConfigurationPath(), "logs");
console.log(
  `Creating RDNSU configuration folder structure at: "${configPathToCreate}"`
);

let doseConfgiurationPathExist: string = process.env.APPDATA || "/etc/";
if (!fs.pathExistsSync(doseConfgiurationPathExist)) {
  console.error(
    "Could not find the system configuration path. See documentation for more information."
  );
  process.exit(0);
}

try {
  fs.ensureDirSync(configPathToCreate);
  fs.writeJsonSync(
    path.join(getConfigurationPath(), "config.json"),
    mustHaveConfigurationProperties
  );
} catch (err) {
  console.error(
    "Failed to create configuration folders. See documentation for more information."
  );
}
