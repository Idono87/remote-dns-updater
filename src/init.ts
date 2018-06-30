import yargs = require('yargs');
import fs = require('fs');
import winston = require('winston');
import path = require('path');
import winstonMail = require('winston-mail');

import Options from './cliArguments';
import ConfigurationProperties from './configurationProperties';
import ConfigurationProperty from './configurationProperty';
import {
    ConfigPropertyError,
    ConfigMissingPropertyError,
    InternalError,
} from './errors';
import ConfigurationObject from './configurationObject';
import { getConfigurationPath } from './util';

type JSONConfigurationObject = { [key: string]: string | boolean | number };

if (!process.env.LOCK_NAME) {
    failConfig(
        new InternalError(
            'Running the application through the source files is not supported. Please use the command "rdnsu start" to run the application.',
        ),
    );
}

/////////////////////////////////////////////////////////////
//// Initial Application Initialization.
/////////////////////////////////////////////////////////////

//Globals
eval('global.__basedir = process.cwd();');

//Env
process.env.LOG_FILE = '/log/rdnsu.log';
process.env.CONFIG_FILE = 'config.json';
process.env.APP_NAME = 'Remote DNS Updater';
process.env.USER_AGENT = `${process.env.APP_NAME}/${
    require(__basedir + '/package.json').version
}`;

/////////////////////////////////////////////////////////////
//// Winston CLI
/////////////////////////////////////////////////////////////

winston.setLevels(winston.config.npm.levels);

const cOptions: winston.ConsoleTransportOptions = {
    level: 'silly',
    colorize: true,
    timestamp: true,
};

winston.clear();
winston.add(winston.transports.Console, cOptions);

/////////////////////////////////////////////////////////////
//// Setup CLI
/////////////////////////////////////////////////////////////
/* debug */
winston.debug('Initializing Yargs');
/* debug-end */

yargs.strict();
yargs.fail((msg: string, err: Error) => {
    winston.error(msg);
    process.exit(0);
});

/* debug */
winston.debug('Initializing Yargs Arguments ');
/* debug-end */

yargs.options(Options);

let cliArguments: yargs.Arguments = yargs.argv;

/////////////////////////////////////////////////////////////
//// Initializing Configuration.
/////////////////////////////////////////////////////////////

/* debug */
winston.debug('Initializing Config');
/* debug-end */

let configurationFileProperties: ConfigurationObject = {};
try {
    /* debug */
    winston.debug('Open Config File');
    /* debug-end */

    let configurationFileHandle: number = fs.openSync(
        path.join(getConfigurationPath(), process.env.CONFIG_FILE),
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
    winston.debug('Parse Config File.');
    /* debug-end */

    Object.keys(configObject).forEach(
        (key: string): void => {
            let value: any = configObject[key];

            if (!(key in ConfigurationProperties))
                throw new ConfigPropertyError(false, key);

            let property: ConfigurationProperty = ConfigurationProperties[key];

            if (typeof value !== property.type)
                throw new ConfigPropertyError(true, key, value.toString());

            if (typeof property.choices !== 'undefined') {
                let isValidChoice = property.choices.find(
                    (choice: string): boolean => {
                        return choice === value;
                    },
                );

                if (!isValidChoice)
                    throw new ConfigPropertyError(true, key, value.toString());
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
        failConfig(err);
    }

    /* debug */
    winston.debug('No Config File.');
    /* debug-end */
}

/* debug */
winston.debug('Extracting Config Arguments From CLI');
/* debug-end */
let configurationCLIProperties: ConfigurationObject = {};
Object.keys(ConfigurationProperties).forEach(
    (key: string): void => {
        if (key in cliArguments && typeof cliArguments[key] !== 'undefined') {
            configurationCLIProperties[key] = cliArguments[key];
        }
    },
);

/* debug */
winston.debug('Overwriting File Config Properties With CLI Properties.');
/* debug-end */

let configuration: ConfigurationObject = Object.assign(
    configurationFileProperties,
    configurationCLIProperties,
);

if (cliArguments.save) {
    /* debug */
    winston.debug('Saving Configuration');
    /* debug-end */

    try {
        let fileHandle: number = fs.openSync(
            './conf.cfg',
            fs.constants.O_CREAT | fs.constants.O_WRONLY | fs.constants.O_TRUNC,
            null,
        );
        fs.writeSync(fileHandle, JSON.stringify(configuration), null, 'utf-8');
        fs.closeSync(fileHandle);
    } catch (err) {
        failConfig(err);
    }
}

/* debug */
winston.debug('Checking For Required Config Properties');
/* debug-end */

let missingProperty: string = '';
let hasRequiredProperties: boolean = Object.keys(ConfigurationProperties).every(
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
    failConfig(new ConfigMissingPropertyError(missingProperty));
}

/* debug */
winston.debug('Adding Default Missing Config Properties');
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

Object.freeze(configuration);

/////////////////////////////////////////////////////////////
//// Initializing Winston Logger
/////////////////////////////////////////////////////////////

/* debug */
winston.debug('Initializing Winston File Logging');
/* debug-end */

const fOptions: winston.FileTransportOptions = {
    level: configuration.logging_level,
    colorize: true,
    timestamp: true,
    filename: path.join(getConfigurationPath(), process.env.LOG_FILE),
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
    winston.debug('Initializing Winston Email');
    /* debug-end */

    // TODO: Parse and verify email object settings.
    const mOptions: winstonMail.Options = configuration.email;
    mOptions.timeout = 5000;
    mOptions.html = false;
    mOptions.filter = undefined;
    mOptions.silent = false;

    winston.add(winstonMail.Mail, mOptions);
}

/* debug */
winston.debug('Initialization Complete');
/* debug-end */

/////////////////////////////////////////////////////////////
//// Functions
/////////////////////////////////////////////////////////////

function failConfig(err: any) {
    winston.error(err.message);
    process.exit(0);
}

export default configuration;
