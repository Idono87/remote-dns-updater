#!/usr/bin/env node
import fs = require('fs-extra');
import path = require('path');
import { getConfigurationPath } from '../util';

export default function install() {
    const mustHaveConfigurationProperties = {
        remote_hostname: 'HOSTNAME',
        path: 'PATH',
        user: 'USER',
        password: 'PASSWORD',
        dns_record: 'YOUR HOSTNAME',
    };

    let configPathToCreate: string = path.join(getConfigurationPath(), 'logs');

    let doseConfigurationPathExist: string = process.env.APPDATA || '/etc/';
    if (!fs.pathExistsSync(doseConfigurationPathExist)) {
        let err: any = new Error(
            'Could not find the system configuration path. See documentation for more information.',
        );

        err.code = 0;

        throw err;
    } else {
        try {
            fs.ensureDirSync(configPathToCreate);
            fs.writeJsonSync(
                path.join(getConfigurationPath(), 'config.json'),
                mustHaveConfigurationProperties,
            );
        } catch (err) {
            let error: any = new Error(
                'Failed to create configuration directories and files. Run the script "npm run-script postinstall". If the error persists please consult the documentation.',
            );

            error.code = 0;

            throw error;
        }
    }
}

if (module.parent == null) {
    install();
}
