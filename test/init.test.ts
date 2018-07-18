import chai = require('chai');
import sinon = require('sinon');
import sinonChai = require('sinon-chai');
import yargs = require('yargs');
import fs = require('fs');
import winston = require('winston');

import ConfigurationObject from '../src/configurationObject';
import * as init from './../src/init';
import LoggingLevels from '../src/loggingLevels';
import {
    ConfigPropertyError,
    SaveError,
    ConfigMissingPropertyError,
} from '../src/errors';
import { isObjectBindingPattern } from 'typescript';
import Protocols from '../src/protocols';

let should: Chai.Should = chai.should();
let expect: Chai.ExpectStatic = chai.expect;
chai.use(sinonChai);

describe('init tests', function() {
    let winstonDebugStub: sinon.SinonStub;
    before(function() {
        init.initWinstonCli();
        process.env.NODE_ENV = 'debug';
        winstonDebugStub = sinon.stub(winston, 'debug');
    });

    after(function() {
        sinon.restore();
    });

    describe('initWinston', function() {
        it('winston CLI', function() {
            init.initWinstonCli();
            winstonDebugStub = sinon.stub(winston, 'debug');
        });

        it('Winston Logger', function() {
            let config: ConfigurationObject = {
                email: <winstonMail.MailTransportOptions>{ to: 'test' },
                logging_level: LoggingLevels.warn,
            };

            init.initWinstonLogger(config);
        });
    });

    describe('init yargs', function() {
        let failCallbackFake: sinon.SinonSpy;
        let failStub: sinon.SinonStub;

        before(function() {
            yargs.showHelpOnFail(false);
            yargs.exitProcess(false);
        });

        beforeEach(function() {
            failCallbackFake = sinon.fake();
            failStub = sinon
                .stub(yargs, 'fail')
                .onFirstCall()
                .callsFake(() => {
                    yargs.fail(failCallbackFake);
                });
        });

        afterEach(function() {
            failCallbackFake.resetHistory();
            failStub.restore();
        });

        it('Fail Callback should be called.', function() {
            failStub.restore();
            let winstonErrorStub: sinon.SinonStub = sinon.stub(
                winston,
                'error',
            );
            let processExitStub: sinon.SinonStub = sinon
                .stub(process, 'exit')
                .throws(new Error('exited'));

            expect(() => {
                init.initCLI([
                    process.argv[0],
                    process.argv[1],
                    '--ShouldFail',
                    'ShouldFail',
                ]);
            }).to.throw(Error);
        });

        it('no arguments', function() {
            init.initCLI([process.argv[0], process.argv[1]]).should.be.a(
                'object',
            );

            failCallbackFake.should.not.be.called;
        });

        it('falsy arguments', function() {
            expect(() => {
                init.initCLI([
                    process.argv[0],
                    process.argv[1],
                    '--falseArgument',
                    'falseValue',
                ]);
            }).to.throw();
        });

        describe('arguments that should pass', function() {
            let passingArugments: any[] = new Array();
            passingArugments.push({
                arg: 'remote_host',
                alias: 'H',
                val: 'test string',
            });
            passingArugments.push({
                arg: 'path',
                alias: 'A',
                val: 'test string',
            });
            passingArugments.push({
                arg: 'user',
                alias: 'u',
                val: 'test string',
            });
            passingArugments.push({
                arg: 'password',
                alias: 'p',
                val: 'test string',
            });
            passingArugments.push({
                arg: 'dns_record',
                alias: 'D',
                val: 'test.test.com',
            });
            passingArugments.push({
                arg: 'protocol',
                alias: 'P',
                val: 'http',
            });
            passingArugments.push({
                arg: 'protocol',
                alias: 'P',
                val: 'https',
            });
            passingArugments.push({
                arg: 'logging_level',
                alias: 'L',
                val: 'error',
            });
            passingArugments.push({
                arg: 'logging_level',
                alias: 'L',
                val: 'warn',
            });
            passingArugments.push({
                arg: 'logging_level',
                alias: 'L',
                val: 'info',
            });
            passingArugments.push({
                arg: 'logging_level',
                alias: 'L',
                val: 'verbose',
            });
            passingArugments.push({
                arg: 'logging_level',
                alias: 'L',
                val: 'debug',
            });
            passingArugments.push({
                arg: 'logging_level',
                alias: 'L',
                val: 'silly',
            });
            passingArugments.push({
                arg: 'verbose',
                alias: 'v',
                val: false,
            });
            passingArugments.push({
                arg: 'update_interval',
                alias: 'U',
                val: 1000,
            });
            passingArugments.push({
                arg: 'remind',
                alias: 'r',
                val: false,
            });
            passingArugments.push({
                arg: 'remind_count',
                alias: 'R',
                val: 5,
            });
            passingArugments.push({
                arg: 'save',
                alias: 'S',
                val: false,
            });

            passingArugments.forEach((argument: any) => {
                it('argument: ' + argument.arg, function() {
                    init.initCLI([
                        process.argv[0],
                        process.argv[1],
                        `--${argument.arg}`,
                        argument.val.toString(),
                    ]).should.be.a('object');

                    failCallbackFake.should.not.be.called;
                });
            });

            passingArugments.forEach((argument: any) => {
                it('alias for ' + argument.arg, function() {
                    init.initCLI([
                        process.argv[0],
                        process.argv[1],
                        `-${argument.alias}`,
                        argument.val.toString(),
                    ]).should.be.a('object');

                    failCallbackFake.should.not.be.called;
                });
            });
        });

        describe('arguments that should not pass', function() {
            let failingArugments: any[] = new Array();
            failingArugments.push({
                arg: 'dns_record',
                alias: 'D',
                val: 'testing string',
            });
            failingArugments.push({
                arg: 'protocol',
                alias: 'P',
                val: 'test protocol',
            });
            failingArugments.push({
                arg: 'logging_level',
                alias: 'L',
                val: 'test level',
            });

            failingArugments.forEach((argument) => {
                it('argument: ' + argument.arg, function() {
                    expect(() => {
                        init.initCLI([
                            process.argv[0],
                            process.argv[1],
                            `--${argument.arg}`,
                            argument.val.toString(),
                        ]);
                    }).to.throw();
                });
            });
        });
    });

    describe('Configuration File', function() {
        let openSyncStub: sinon.SinonStub;
        let readFileSyncStub: sinon.SinonStub;
        let closeStub: sinon.SinonStub;

        beforeEach(function() {
            openSyncStub = sinon.stub(fs, 'openSync');
            readFileSyncStub = sinon.stub(fs, 'readFileSync');
            closeStub = sinon.stub(fs, 'close');
        });

        afterEach(function() {
            openSyncStub.restore();
            readFileSyncStub.restore();
            closeStub.restore();
        });

        describe('Pass with all properties', function() {
            let passingProperties: any[] = new Array();
            passingProperties.push({ name: 'remote_hostname', value: 'test' });
            passingProperties.push({ name: 'path', value: 'test' });
            passingProperties.push({ name: 'user', value: 'test' });
            passingProperties.push({ name: 'password', value: 'test' });
            passingProperties.push({
                name: 'dns_record',
                value: 'test.test.com',
            });
            passingProperties.push({ name: 'protocol', value: 'http' });
            passingProperties.push({ name: 'protocol', value: 'https' });
            passingProperties.push({ name: 'logging_level', value: 'error' });
            passingProperties.push({ name: 'logging_level', value: 'warn' });
            passingProperties.push({ name: 'logging_level', value: 'info' });
            passingProperties.push({ name: 'logging_level', value: 'verbose' });
            passingProperties.push({ name: 'logging_level', value: 'debug' });
            passingProperties.push({ name: 'logging_level', value: 'silly' });
            passingProperties.push({ name: 'email', value: {} });
            passingProperties.push({ name: 'update_interval', value: 10 });
            passingProperties.push({ name: 'remind', value: true });
            passingProperties.push({ name: 'remind_count', value: 10 });

            passingProperties.forEach((property: any) => {
                it('Property: ' + property.name, function() {
                    let obj: any = {};
                    obj[property.name] = property.value;
                    let jsonConf: string = JSON.stringify(obj);

                    openSyncStub.returns(5);
                    readFileSyncStub.returns(jsonConf);

                    init.getConfigurationFileProperties().should.eql(obj);
                });
            });
        });

        describe('fail types with all properties', function() {
            let failProperties: any[] = new Array();
            failProperties.push({ name: 'remote_hostname', value: false });
            failProperties.push({ name: 'path', value: false });
            failProperties.push({ name: 'user', value: false });
            failProperties.push({ name: 'password', value: false });
            failProperties.push({
                name: 'dns_record',
                value: false,
            });
            failProperties.push({ name: 'protocol', value: false });
            failProperties.push({ name: 'logging_level', value: false });
            failProperties.push({ name: 'email', value: false });
            failProperties.push({ name: 'update_interval', value: false });
            failProperties.push({ name: 'remind', value: 'test' });
            failProperties.push({ name: 'remind_count', value: false });

            failProperties.forEach((property: any) => {
                it('Property: ' + property.name, function() {
                    let obj: any = {};
                    obj[property.name] = property.value;
                    let jsonConf: string = JSON.stringify(obj);

                    openSyncStub.returns(5);
                    readFileSyncStub.returns(jsonConf);

                    expect(init.getConfigurationFileProperties).to.throw(
                        ConfigPropertyError,
                    );
                });
            });
        });

        it('Unkown property in configuration file', function() {
            openSyncStub.returns(5);
            readFileSyncStub.returns(JSON.stringify({ testProperty: 'test' }));

            expect(init.getConfigurationFileProperties).to.throw(
                ConfigPropertyError,
            );
        });

        it('Logging Level unknown value', function() {
            openSyncStub.returns(5);
            readFileSyncStub.returns(JSON.stringify({ logging_level: 'test' }));

            expect(init.getConfigurationFileProperties).to.throw(
                ConfigPropertyError,
            );
        });

        it('Protocol unknown value', function() {
            openSyncStub.returns(5);
            readFileSyncStub.returns(JSON.stringify({ protocol: 'test' }));

            expect(init.getConfigurationFileProperties).to.throw(
                ConfigPropertyError,
            );
        });

        it('ENOENT, no such file.', function() {
            let err: any = new Error('ENOENT');
            err.code = 'ENOENT';
            openSyncStub.throws(err);
            init.getConfigurationFileProperties();
        });
    });

    describe('Get CLI Configuration Properties', function() {
        let includeArgObject: yargs.Arguments = {
            $0: 'test',
            _: <never>[],
            remote_hostname: 'include',
            path: 'include',
            user: 'include',
            password: 'include',
            dns_record: 'include',
            protocol: 'include',
            email: 'include',
            logging_level: 'include',
            update_interval: 'include',
            remind: 'include',
            remind_count: 'include',
        };

        let excludeArgObject: yargs.Arguments = {
            $0: 'test',
            _: <never>[],
            remote_hostname: undefined,
            path: undefined,
            user: undefined,
            password: undefined,
            dns_record: undefined,
            protocol: undefined,
            email: undefined,
            logging_level: undefined,
            update_interval: undefined,
            remind: undefined,
            remind_count: undefined,
        };

        let unknownArgObject: yargs.Arguments = {
            $0: 'test',
            _: <never>[],
            testArgumentOne: 'do not include',
            testArgumentTwo: undefined, //Do not include
        };

        it('Include all properties', function() {
            let testObject: ConfigurationObject = Object.assign(
                {},
                includeArgObject,
            );
            delete testObject['$0'];
            delete testObject['_'];

            init.getCliConfigurationProperties(includeArgObject).should.eql(
                testObject,
            );
        });

        it('Exclude undefined properties', function() {
            init.getCliConfigurationProperties(excludeArgObject).should.eql({});
        });

        it('Exclude unknown properties', function() {
            init.getCliConfigurationProperties(unknownArgObject).should.eql({});
        });
    });

    it('Assign CLI properties to configuration file properties.', function() {
        let objectOne: ConfigurationObject = { testOne: 'test' };
        let objectTwo: ConfigurationObject = { testTwo: 'test' };

        init.assignCliPropertiesToConfigurationObject(
            objectOne,
            objectTwo,
        ).should.eql({ testOne: 'test', testTwo: 'test' });
    });

    describe('Save Configuration File', function() {
        let fsMock: sinon.SinonMock;

        let configObject: ConfigurationObject = { testProperty: 'test' };

        beforeEach(function() {
            fsMock = sinon.mock(fs);
        });

        it('Save Successfully', function() {
            fsMock
                .expects('openSync')
                .once()
                .returns(5);
            fsMock
                .expects('writeSync')
                .withArgs(5, JSON.stringify(configObject))
                .returns(undefined);
            fsMock.expects('close').once();

            init.saveConfiguration(true, configObject);

            fsMock.verify();
        });

        it('Save Failed', function() {
            fsMock.expects('openSync').throws(new Error('ENOENT'));

            expect(() => init.saveConfiguration(true, configObject)).to.throw(
                SaveError,
            );

            fsMock.restore();
        });
    });

    describe('Check for required properties.', function() {
        let requiredProperties: ConfigurationObject = {
            remote_hostname: 'required',
            user: 'required',
            password: 'required',
            dns_record: 'required',
        };

        it('Pass with all required properties.', function() {
            init.areRequiredPropertiesSet(requiredProperties);
        });

        Object.keys(requiredProperties).forEach((key: string) => {
            it('Missing property: ' + key, function() {
                let missingProperty: ConfigurationObject = Object.assign(
                    {},
                    requiredProperties,
                );
                delete missingProperty[key];

                expect(() =>
                    init.areRequiredPropertiesSet(missingProperty),
                ).to.throw(ConfigMissingPropertyError);
            });
        });
    });

    describe('Check for default values', function() {
        let nonDefaultValues: ConfigurationObject = {
            protocol: Protocols.https,
            logging_level: LoggingLevels.warn,
            update_interval: 60,
            remind: false,
            remind_count: 60,
        };

        let defaultValues: ConfigurationObject = {
            protocol: Protocols.http,
            logging_level: LoggingLevels.info,
            update_interval: 10,
            remind: true,
            remind_count: 15,
        };

        it('Should add default values', function() {
            init.addMissingProperties({}).should.eql(defaultValues);
        });
    });

    it('Freeze the configuration object.', function() {
        Object.isFrozen(init.freezeConfiguration({})).should.be.true;
    });
});
