import chai = require('chai');
import {
    getConfigurationPath,
    validateArgumentString,
    validateConfigureString,
    coerceToEnum,
    buildChoicesFromEnum,
} from '../src/util';
import { ConfigPropertyError, ArgumentError } from '../src/errors';

chai.should();
let expect: Chai.ExpectStatic = chai.expect;

describe('Util Tests', function() {
    it('Get Configuration Path', function() {
        getConfigurationPath().should.eql('/etc/rdnsu/');
    });

    describe('Validatate Configure String', function() {
        it('Return input if passing.', function() {
            let valid: (str: string) => string = validateConfigureString(
                /[a-z]/,
                'test',
            );

            valid('test').should.eql('test');
        });

        it('Throw error on fail.', function() {
            let valid: (str: string) => string = validateConfigureString(
                /[1-9]/,
                'test',
            );

            expect(() => {
                valid('test');
            }).to.throw(ConfigPropertyError);
        });
    });

    describe('Validatate Argument String', function() {
        it('Return input if passing.', function() {
            let valid: (str: string) => string = validateArgumentString(
                /[a-z]/,
                'test',
            );

            valid('test').should.eql('test');
        });

        it('Throw error on fail.', function() {
            let valid: (str: string) => string = validateArgumentString(
                /[1-9]/,
                'test',
            );

            expect(() => {
                valid('test');
            }).to.throw(ArgumentError);
        });
    });

    describe('Coerce to Enum', function() {
        enum testEnum {
            test1 = 'test1',
            test2 = 'test2',
            test3 = 'test3',
        }

        let coerceFunc: (arg: any) => any;

        before(function() {
            coerceFunc = coerceToEnum(testEnum);
        });

        it('Coerce enum should return enums', function() {
            coerceFunc('test1').should.equal(testEnum.test1);
            coerceFunc('test2').should.equal(testEnum.test2);
            coerceFunc('test3').should.equal(testEnum.test3);
        });

        it('Coerce enum should return input string', function() {
            coerceFunc('test').should.equal('test');
        });
    });

    describe('Build Choices From Enum', function() {
        enum testEnum {
            test1 = 'test1',
            test2 = 'test2',
            test3 = 'test3',
        }

        it('Should equal array', function() {
            buildChoicesFromEnum(testEnum).should.eql([
                'test1',
                'test2',
                'test3',
            ]);
        });
    });
});
