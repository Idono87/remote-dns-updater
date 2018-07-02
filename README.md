[![npm](https://img.shields.io/npm/v/remote-dns-updater.svg?style=flat-square)](https://www.npmjs.com/package/instance-locker)
[![GitHub release](https://img.shields.io/github/release/idono87/remote-dns-updater.svg?style=flat-square)](https://github.com/Idono87/remote-dns-updater)
![npm type definitions](https://img.shields.io/npm/types/remote-dns-updater.svg?style=flat-square)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![npm](https://img.shields.io/npm/l/remote-dns-updater.svg?style=flat-square)](https://github.com/Idono87/remote-dns-updater/blob/master/LICENSE.md)

Remote DNS Updater (RDNSU) is an automated Dynamic DNS updating tool conforming to the "Remote Access Update API". It's purpose is to automatically update the DNS record with the external IP of the machine that's running RDNSU.

# Install

The package is a complete application and can not be used as a module. There for it needs to be installed as a global.

```
npm install -g remote-dns-updater
```

## Post-Install script

During installation a post install script will be executed to create the application configuration folder, log folders and a bare minimum configuration file. Depending on how npm is installed on the system. The package might have to be installed with the `--unsafe-perm` argument or the script has to be run manually.

```
npm install -g remote-dns-updater --unsafe-perm
```

# Usage

To start the application simply run the the binary `rdnsu`. This will start the application attached to the command line. It is recommended to start this way while configuring the application.

The following commands can later be use to `start`, `stop` and `restart` RDNSU in detached mode.

# Configuration

The application can be configured through the CL or by editing the configuration file that's been created in:

- `/etc/rdnsu/` for linux like systems.

### Command Line Configuration

The CL has a small range of configuration options mainly focusing on DDNS settings and Logging. The following configuration settings can be provided through the CL

- remote_host, [H] - URL to the remote DNS service.
- path, [A] - Optional path for the DDNS service.
- user, [u]- Remote DNS user name.
- password, [p] - Remote DNS service password.
- dns_record, [D] - DNS record that points to the current network.
- protocol, [P] - Protocol to use when updating the DNS record. [ __`http | https`__ ] **Default:** `http`
- logging_level, [L] - Log file Logging level. [ __`error | warn | info | verbose | debugging | silly`__ ]: **Default:** `verbose`
- update_interval, [U] - The interval to check for ip changes. **Default:** `10`
- remind, [r] - If the DNS Updater is suspended it will remind the user of the current suspension.
- remind_count, [R] - The number of update intervals before a reminder that the updater has gone into suspension mode will be sent. **Default**: `15`
- save, [S] - Will save the current running settings.

### Configuration File

The configuration file has slightly more settings that pertain to mail logging. Configuration is done in JSON is named `config.json`.

- remote_host <span style="color:green; font-weight: bold;">\<string></span> - URL to the remote DNS service.
- path <span style="color:green; font-weight: bold;">\<string></span> - Optional path for the DDNS service.
- user <span style="color:green; font-weight: bold;">\<string></span> - Remote DNS user name.
- password <span style="color:green; font-weight: bold;">\<string></span> - Remote DNS service password.
- dns_record <span style="color:green; font-weight: bold;">\<string></span> - DNS record that points to the current network.
- protocol <span style="color:green; font-weight: bold;">\<string></span> - Protocol to use when updating the DNS record. [ __`http | https`__ ] **Default:** `http`
- logging_level <span style="color:green; font-weight: bold;">\<string></span> - Log file Logging level. [ __`error | warn | info | verbose | debugging | silly`__ ]: **Default:** `verbose`
- update_interval <span style="color:green; font-weight: bold;">\<number></span> - The interval to check for ip changes. **Default:** `10`
- remind <span style="color:green; font-weight: bold;">\<boolean></span> - If the DNS Updater is suspended it will remind the user of the current suspension.
- remind_count <span style="color:green; font-weight: bold;">\<number></span> - The number of update intervals before a reminder that the updater has gone into suspension mode will be sent. **Default**: `15`
- email <span style="color:green; font-weight: bold;">\<object></span> - Providing an object with the following properties enables email logging.
  - to <span style="color:green; font-weight: bold;">\<string></span> - Receiving address.
  - from <span style="color:green; font-weight: bold;">\<string></span> - Sending address.
  - host <span style="color:green; font-weight: bold;">\<string></span> - SMTP server hostname **default:** `localhost`
  - port <span style="color:green; font-weight: bold;">\<number></span> - SMTP port **default:** `587` or `25`
  - username <span style="color:green; font-weight: bold;">\<string></span> - Username for server auth
  - password <span style="color:green; font-weight: bold;">\<string></span> - Password for server auth
  - subject <span style="color:green; font-weight: bold;">\<string></span> - Subject for email **default:** `winston:{{level}}{{msg}}`
  - ssl <span style="color:green; font-weight: bold;">\<boolean> | \<object></span> - Use SSL. `boolean` or object `{key, ca, cer}`
  - tls <span style="color:green; font-weight: bold;">\<boolean></span> - Use TLS. Uses starttls if true.
  - level <span style="color:green; font-weight: bold;">\<string></span> - Logging level to report with mail.
  - unique <span style="color:green; font-weight: bold;">\<boolean></span> - Isolate a single logging level to report through mail.
  - authentication <span style="color:green; font-weight: bold;">\<string[]></span> - Preffered SMTP auth methods. **defaults:** `['PLAIN', 'CRAM-MD5', 'LOGIN', 'XOAUTH2']`

Email logging is based on [emailjs](https://github.com/eleith/emailjs).

### Configuration precedence

RDNSU will prioritize CL configuration over file configuration and will therefor overwrite any properties during runtime. Passing `--save` when configuring RDNSU through the CL will save the newly set configuration properties.

# Suspension State

The Dynamic DNS API has several return codes with varying severity. Where abuse is seen as the worse kind. To mitigate any chances of being locked out of the DDNS service. RDNSU goes into suspension mode if anything abnormal occurs.

Depending on what kind of error code has occurred RDNSU will resume operations after some time, if possible. Otherwise user intervention is necessary and the application will stay in suspended mode until further notice. A notification will be logged (and emailed if activated) when the application goes into suspension. If the `reminding` configuration is on. The application will log reminders.
