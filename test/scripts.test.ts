import fs = require('fs-extra');
import { execFile, ChildProcess } from 'child_process';
import chai = require('chai');
import path = require('path');
import del = require('del');
import util = require('./../src/util');
import { Done } from 'mocha';
import sinon = require('sinon');
import install from './../src/scripts/install';

let should: Chai.Should = chai.should();
let expect: Chai.ExpectStatic = chai.expect;
chai.use(require('sinon-chai'));

describe('Scripts', function() {
    describe('install.ts', function() {
        describe('Test for Directory Paths', function() {
            before(function() {
                install();
            });

            it('rdnsu', function(done: Done) {
                let folderPath: string = path.join(
                    util.getConfigurationPath(),
                    'logs',
                );
                fs.exists(folderPath, (exists: boolean) => {
                    exists.should.equal(true);
                    done();
                });
            });

            it('logs', function(done: Done) {
                let folderPath: string = path.join(
                    util.getConfigurationPath(),
                    'logs',
                );
                fs.exists(folderPath, (exists: boolean) => {
                    exists.should.equal(true);
                    done();
                });
            });

            it('config.json', function(done: Done) {
                let filePath: string = path.join(
                    util.getConfigurationPath(),
                    'config.json',
                );
                fs.exists(filePath, (exists: boolean) => {
                    exists.should.equal(true);
                    done();
                });
            });

            after(function() {
                del([util.getConfigurationPath() + '/**'], {
                    force: true,
                }).then();
            });
        });

        describe('Test errors', function() {
            it(`config path does not exist`, function() {
                let fsMock: sinon.SinonMock = sinon.mock(fs);
                fsMock
                    .expects('pathExistsSync')
                    .once()
                    .returns(false);

                expect(install).to.throw(
                    'Could not find the system configuration path. See documentation for more information.',
                );

                fsMock.verify();

                fsMock.restore();
            });

            it(`file creation exception thrown`, function() {
                let fsMock: sinon.SinonMock = sinon.mock(fs);

                fsMock
                    .expects('pathExistsSync')
                    .once()
                    .returns(true);

                fsMock
                    .expects('ensureDirSync')
                    .once()
                    .throws(new Error('Test'));

                expect(install).to.throw(
                    'Failed to create configuration directories and files. Run the script "npm run-script postinstall". If the error persists please consult the documentation.',
                );

                fsMock.verify();

                fsMock.restore();
            });
        });
    });
});
