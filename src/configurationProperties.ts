import Protocols from './protocols';
import LoggingLevels from './loggingLevels';
import ConfigurationProperty from './configurationProperty';
import {
    buildChoicesFromEnum,
    coerceToEnum,
    validateConfigureString,
} from './util';

const Properties: { readonly [key: string]: ConfigurationProperty } = {
    remote_hostname: {
        type: 'string',
        required: true,
    },
    path: {
        type: 'string',
    },
    user: {
        type: 'string',
        required: true,
        coerce: validateConfigureString(RegExp(/^.{1,80}$/), 'user'),
    },
    password: {
        type: 'string',
        required: true,
        coerce: validateConfigureString(RegExp(/^.{1,80}$/), 'password'),
    },
    dns_record: {
        type: 'string',
        required: true,
        coerce: validateConfigureString(
            RegExp(
                /^(?:(?:[^-\d](?:\d|[a-z]|[A-Z]){1,63}\.)+)\w{2,5}(?:(?:\/.+)+)?$/,
            ),
            'dns_record',
        ),
    },
    protocol: {
        type: 'string',
        default: Protocols.http,
        coerce: coerceToEnum(Protocols),
        choices: buildChoicesFromEnum(Protocols),
    },
    email: {
        type: 'object',
    },
    logging_level: {
        type: 'string',
        default: LoggingLevels.info,
        coerce: coerceToEnum(LoggingLevels),
        choices: buildChoicesFromEnum(LoggingLevels),
    },
    update_interval: {
        type: 'number',
        default: 10,
    },
    remind: {
        type: 'boolean',
        default: true,
    },
    remind_count: {
        type: 'number',
        default: 15,
    },
};

export default Properties;
