import yargs = require('yargs');
import fs = require('fs');
import winston = require('winston');
import path = require('path');
import 'winston-mail'; //TS Side effect
import winstonMail = require('winston-mail');

import Options from './cliArguments';
import ConfigurationProperties from './configurationProperties';
import ConfigurationProperty from './configurationProperty';
import {
    ConfigPropertyError,
    ConfigMissingPropertyError,
    InternalError,
    SaveError,
} from './errors';
import ConfigurationObject from './configurationObject';
import { getConfigurationPath } from './util';

type JSONConfigurationObject = { [key: string]: string | boolean | number };

/////////////////////////////////////////////////////////////
//// Globals & ENV Values.
/////////////////////////////////////////////////////////////

//Globals
declare const __basedir: string;
eval('global.__basedir = process.cwd();');

//Env
process.env.LOG_FILE = '/log/rdnsu.log';
process.env.CONFIG_FILE = process.env.CONFIG_FILE || 'config.json';
process.env.APP_NAME = 'Remote DNS Updater';
process.env.USER_AGENT = `${process.env.APP_NAME}/${
    require(__basedir + '/package.json').version
}`;

/////////////////////////////////////////////////////////////
//// Winston CLI
/////////////////////////////////////////////////////////////

function initWinstonCli(): void {
    winston.setLevels(winston.config.npm.levels);

    const cOptions: winston.ConsoleTransportOptions = {
        level: 'silly',
        colorize: true,
        timestamp: true,
    };

    winston.clear();
    winston.add(winston.transports.Console, cOptions);
}

/////////////////////////////////////////////////////////////
//// Setup CLI
/////////////////////////////////////////////////////////////

function initCLI(args: string[]): yargs.Arguments {
    /* debug */
    if (process.env.NODE_ENV === 'debug') {
        winston.debug('Initializing Yargs');
    }
    /* debug-end */

    yargs.strict();
    yargs.fail((msg: string, err: Error) => {
        winston.error(msg);
        process.exit(0);
    });

    /* debug */
    if (process.env.NODE_ENV === 'debug') {
        winston.debug('Initializing Yargs Arguments ');
    }
    /* debug-end */

    yargs.options(Options);

    return yargs.parse(args);
}

/////////////////////////////////////////////////////////////
//// Initializing Configuration.
/////////////////////////////////////////////////////////////

function getConfigurationFileProperties(): ConfigurationObject {
    /* debug */
    if (process.env.NODE_ENV === 'debug') {
        winston.debug('Initializing Config');
    }
    /* debug-end */

    let configurationFileProperties: ConfigurationObject = {};
    try {
        /* debug */
        if (process.env.NODE_ENV === 'debug') {
            winston.debug('Open Config File');
        }
        /* debug-end */

        let configurationFileHandle: number = fs.openSync(
            path.join(getConfigurationPath(), <string>process.env.CONFIG_FILE),
            fs.constants.O_RDONLY,
        );
        let configurationJSONString: string = fs.readFileSync(
            configurationFileHandle,
            'utf-8',
        );
        fs.close(configurationFileHandle, () => {});

        let configObject: JSONConfigurationObject = JSON.parse(
            configurationJSONString,
        );

        /* debug */
        if (process.env.NODE_ENV === 'debug') {
            winston.debug('Parse Config File.');
        }
        /* debug-end */

        Object.keys(configObject).forEach(
            (key: string): void => {
                let value: any = configObject[key];

                if (!(key in ConfigurationProperties))
                    throw new ConfigPropertyError(false, key);

                let property: ConfigurationProperty =
                    ConfigurationProperties[key];

                if (typeof value !== property.type)
                    throw new ConfigPropertyError(true, key, value.toString());

                if (typeof property.choices !== 'undefined') {
                    let isValidChoice = property.choices.find(
                        (choice: string): boolean => {
                            return choice === value;
                        },
                    );

                    if (!isValidChoice)
                        throw new ConfigPropertyError(
                            true,
                            key,
                            value.toString(),
                        );
                }

                if (typeof property.coerce !== 'undefined') {
                    configurationFileProperties[key] = property.coerce(value);
                    return;
                }

                configurationFileProperties[key] = value;
            },
        );
    } catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }

        /* debug */
        if (process.env.NODE_ENV === 'debug') {
            winston.debug('No Config File.');
        }
        /* debug-end */
    }

    return configurationFileProperties;
}

function getCliConfigurationProperties(
    cliArguments: yargs.Arguments,
): ConfigurationObject {
    /* debug */
    if (process.env.NODE_ENV === 'debug') {
        winston.debug('Extracting Config Arguments From CLI');
    }
    /* debug-end */
    let configurationCLIProperties: ConfigurationObject = {};
    Object.keys(ConfigurationProperties).forEach(
        (key: string): void => {
            if (
                key in cliArguments &&
                typeof cliArguments[key] !== 'undefined'
            ) {
                configurationCLIProperties[key] = cliArguments[key];
            }
        },
    );

    return configurationCLIProperties;
}

function assignCliPropertiesToConfigurationObject(
    configurationFileProperties: ConfigurationObject,
    configurationCLIProperties: ConfigurationObject,
): ConfigurationObject {
    /* debug */
    if (process.env.NODE_ENV === 'debug') {
        winston.debug(
            'Overwriting File Config Properties With CLI Properties.',
        );
    }
    /* debug-end */

    return Object.assign(
        configurationFileProperties,
        configurationCLIProperties,
    );
}

function saveConfiguration(
    save: boolean,
    configuration: ConfigurationObject,
): void {
    if (save) {
        /* debug */
        if (process.env.NODE_ENV === 'debug') {
            winston.debug('Saving Configuration');
        }
        /* debug-end */

        try {
            let fileHandle: number = fs.openSync(
                <string>process.env.CONFIG_FILE,
                fs.constants.O_CREAT |
                    fs.constants.O_WRONLY |
                    fs.constants.O_TRUNC,
                null,
            );
            fs.writeSync(
                fileHandle,
                JSON.stringify(configuration),
                null,
                'utf-8',
            );
            fs.close(fileHandle, () => {});
        } catch (err) {
            throw new SaveError();
        }
    }
}

function areRequiredPropertiesSet(configuration: ConfigurationObject): void {
    /* debug */
    if (process.env.NODE_ENV === 'debug') {
        winston.debug('Checking For Required Config Properties');
    }
    /* debug-end */

    let missingProperty: string = '';
    let hasRequiredProperties: boolean = Object.keys(
        ConfigurationProperties,
    ).every(
        (key: string): boolean => {
            if (ConfigurationProperties[key].required) {
                if (!(key in configuration)) {
                    missingProperty = key;
                    return false;
                }
            }
            return true;
        },
    );

    if (!hasRequiredProperties) {
        throw new ConfigMissingPropertyError(missingProperty);
    }
}

function addMissingProperties(
    configuration: ConfigurationObject,
): ConfigurationObject {
    /* debug */
    if (process.env.NODE_ENV === 'debug') {
        winston.debug('Adding Default Missing Config Properties');
    }
    /* debug-end */

    Object.keys(ConfigurationProperties).forEach(
        (key: string): void => {
            if (ConfigurationProperties[key].default) {
                if (!configuration[key]) {
                    configuration[key] = ConfigurationProperties[key].default;
                }
            }
        },
    );

    return configuration;
}

function freezeConfiguration(
    configuration: ConfigurationObject,
): ConfigurationObject {
    return Object.freeze(configuration);
}

/////////////////////////////////////////////////////////////
//// Initializing Winston Logger
/////////////////////////////////////////////////////////////

function initWinstonLogger(configuration: ConfigurationObject) {
    /* debug */
    if (process.env.NODE_ENV === 'debug') {
        winston.debug('Initializing Winston File Logging');
    }
    /* debug-end */

    const fOptions: winston.FileTransportOptions = {
        level: configuration.logging_level,
        colorize: true,
        timestamp: true,
        filename: path.join(getConfigurationPath(), <string>(
            process.env.LOG_FILE
        )),
        maxsize: 512000,
        maxFiles: 3,
        showLevel: true,
        tailable: true,
        handleExceptions: false,
        humanReadableUnhandledException: true,
    };

    winston.add(winston.transports.File, fOptions);

    if (configuration.email) {
        /* debug */
        if (process.env.NODE_ENV === 'debug') {
            winston.debug('Initializing Winston Email');
        }
        /* debug-end */

        // TODO: Parse and verify email object settings.
        const mOptions: winstonMail.MailTransportOptions = configuration.email;
        mOptions.timeout = 5000;
        mOptions.html = false;
        mOptions.filter = undefined;
        mOptions.silent = false;

        winston.add(winston.transports.Mail, mOptions);
    }
}

/////////////////////////////////////////////////////////////
//// Functions
/////////////////////////////////////////////////////////////

let Configuration: ConfigurationObject | undefined;

if (
    module.parent &&
    module.parent.id === '.' &&
    module.parent.filename === require.resolve('./app')
) {
    initWinstonCli();
    let cliArguments: yargs.Arguments = initCLI(process.argv);
    let configuration: ConfigurationObject = getConfigurationFileProperties();
    let cliConfiguration: ConfigurationObject = getCliConfigurationProperties(
        cliArguments,
    );
    configuration = assignCliPropertiesToConfigurationObject(
        configuration,
        cliConfiguration,
    );
    saveConfiguration(cliArguments.save, configuration);
    areRequiredPropertiesSet(configuration);
    configuration = addMissingProperties(configuration);
    configuration = freezeConfiguration(configuration);
    initWinstonLogger(configuration);
    Configuration = configuration;
}

export default Configuration;

/* debug */
export {
    initWinstonCli,
    initCLI,
    getConfigurationFileProperties,
    getCliConfigurationProperties,
    assignCliPropertiesToConfigurationObject,
    saveConfiguration,
    areRequiredPropertiesSet,
    addMissingProperties,
    initWinstonLogger,
    freezeConfiguration,
};
/* debug-end */
