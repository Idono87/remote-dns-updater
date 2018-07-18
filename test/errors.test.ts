import chai = require('chai');
import {
    ArgumentError,
    ConfigPropertyError,
    ConfigMissingPropertyError,
    SaveError,
    InternalError,
    InternalArgumentConfigurationError,
    InternalEnumerationMissingError,
} from '../src/errors';

chai.should();
let expect: Chai.ExpectStatic = chai.expect;

describe('Test Errors', function() {
    describe('Argument Error Test', function() {
        it('Value Error', function() {
            expect(() => {
                throw new ArgumentError(true, 'test', 'test');
            }).to.throw(
                ArgumentError,
                'Unexpected value "test" for argument "test"',
            );
        });

        it('Argument Error', function() {
            expect(() => {
                throw new ArgumentError(false, 'test');
            }).to.throw(ArgumentError, 'Unexpected argument "test".');
        });
    });

    describe('Config Property Error Test', function() {
        it('Value Error', function() {
            expect(() => {
                throw new ConfigPropertyError(true, 'test', 'test');
            }).to.throw(
                ConfigPropertyError,
                'Unexpected value "test" for configuration property "test',
            );
        });

        it('Property Error', function() {
            expect(() => {
                throw new ConfigPropertyError(false, 'test');
            }).throw(
                ConfigPropertyError,
                'Unexpected configuration property "test".',
            );
        });
    });

    it('Config Missing Property Error', function() {
        expect(() => {
            throw new ConfigMissingPropertyError('test');
        }).to.throw(
            ConfigMissingPropertyError,
            'Missing configuration property "test".',
        );
    });

    it('Save error', function() {
        expect(() => {
            throw new SaveError();
        }).to.throw(SaveError);
    });

    it('Internal Error', function() {
        expect(() => {
            throw new InternalError('test');
        }).to.throw(InternalError, 'test');
    });

    it('Internal Argument Error', function() {
        expect(() => {
            throw new InternalArgumentConfigurationError('test', 'test');
        }).to.throw(
            InternalArgumentConfigurationError,
            'Property test missconfiguration error for test',
        );
    });

    it('Internal Argument Error', function() {
        expect(() => {
            throw new InternalEnumerationMissingError('test', 'test');
        }).to.throw(
            InternalEnumerationMissingError,
            'Missing enumeration "test" in the enumeration "test',
        );
    });
});
