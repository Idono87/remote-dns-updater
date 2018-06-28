import Protocols from "./protocols";
import LoggingLevels from "./loggingLevels";
import yargs = require("yargs");
import {
  buildChoicesFromEnum,
  validateArgumentString,
  coerceToEnum
} from "./util";

const Options: { [key: string]: yargs.Options } = {
  remote_host: {
    type: "string",
    group: "Settings",
    requiresArg: true,
    description: 'URL to the remote DNS service. "example.com"',
    nargs: 1,
    alias: "H"
  },
  path: {
    type: "string",
    group: "Settings",
    requiresArg: true,
    description: 'Optional path for the DDNS service. "/example/path"',
    nargs: 1,
    alias: "A",
    normalize: true
  },
  user: {
    type: "string",
    group: "Settings",
    requiresArg: true,
    description: "Remote DNS user name.",
    nargs: 1,
    alias: "u"
  },
  password: {
    type: "string",
    group: "Settings",
    requiresArg: true,
    description: "Remote DNS service password.",
    nargs: 1,
    alias: "p"
  },
  dns_record: {
    type: "string",
    group: "Settings",
    requiresArg: true,
    description: "DNS record that points to the current network.",
    nargs: 1,
    alias: "D",
    coerce: validateArgumentString(
      RegExp(
        /^(?:(?:[^-\d](?:\d|[a-z]|[A-Z]){1,63}\.)+)\w{2,5}(?:(?:\/.+)+)?$/
      ),
      "dns_record"
    )
  },
  protocol: {
    group: "Settings",
    requiresArg: true,
    description: "Protocol to use when updating the DNS record.",
    nargs: 1,
    alias: "P",
    coerce: coerceToEnum(Protocols),
    choices: buildChoicesFromEnum(Protocols)
  },
  logging_level: {
    group: "Settings",
    requiresArg: true,
    description: "Logfile Logging level.",
    nargs: 1,
    alias: "L",
    coerce: coerceToEnum(LoggingLevels),
    choices: buildChoicesFromEnum(LoggingLevels)
  },
  verbose: {
    type: "boolean",
    default: false,
    description: "Set if the application should be verbose.",
    nargs: 0,
    alias: "v"
  },
  update_interval: {
    type: "number",
    group: "Settings",
    requiresArg: true,
    description: "The interval to check for ip changes. default: 10 minutes.",
    nargs: 1,
    alias: "U"
  },
  remind: {
    type: "boolean",
    default: undefined,
    group: "Settings",
    description:
      "If the DNS Updater is suspended it will remind the user of the current suspension",
    nargs: 0,
    alias: "r"
  },
  remind_count: {
    type: "number",
    group: "Settings",
    requiresArg: true,
    nargs: 1,
    description:
      "The number of update intervals before a reminder that the updater has gone into suspension mode will be sent. default: 15 update attempts",
    alias: "R"
  },
  save: {
    type: "boolean",
    group: "Settings",
    default: false,
    description: "Save the currently running settings.",
    nargs: 0,
    alias: "S"
  }
};

export default Options;
