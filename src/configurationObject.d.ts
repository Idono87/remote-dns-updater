import Protocols from "./protocols";
import LoggingLevels from "./loggingLevels";
import * as WinstonMail from "winston-mail";

export default interface ConfigurationProperties {
  remote_hostname?: string;
  path?: string;
  user?: string;
  password?: string;
  dns_record?: string;
  protocol?: Protocols;
  email?: WinstonMail.Options;
  logging_level?: LoggingLevels;
  update_interval?: number;
  remind_user_of_suspension?: boolean;
  remind_user_of_suspension_count?: number;
  [key: string]:
    | string
    | boolean
    | number
    | Protocols
    | LoggingLevels
    | WinstonMail.Options
    | undefined;
}
