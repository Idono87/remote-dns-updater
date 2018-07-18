import Protocols from './protocols';
import LoggingLevels from './loggingLevels';
import * as WinstonMail from 'winston-mail';

export default interface ConfigurationObject {
    remote_hostname?: string;
    path?: string;
    user?: string;
    password?: string;
    dns_record?: string;
    protocol?: Protocols;
    email?: WinstonMail.MailTransportOptions;
    logging_level?: LoggingLevels;
    update_interval?: number;
    remind?: boolean;
    remind_count?: number;
    [key: string]:
        | string
        | boolean
        | number
        | Protocols
        | LoggingLevels
        | WinstonMail.MailTransportOptions
        | undefined;
}
