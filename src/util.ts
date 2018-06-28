import { ArgumentError, ConfigPropertyError } from "./errors";
import os = require("os");
import fs = require("fs");
import path = require("path");

/**
 * Returns the available choices from enumeration.
 *
 * @param enumeration
 * @returns An array containing the choices.
 */
export function buildChoicesFromEnum(enumeration: any): string[] {
  return Object.keys(enumeration).reduce(
    (accumelator: string[], val: string): string[] => {
      if (isNaN(parseInt(val))) {
        accumelator.push(val);
      }

      return accumelator;
    },
    new Array()
  );
}

/**
 * Returns a coercion function that coerces the supplied argument to the enumeration value.
 *
 * @param enumeration
 * @returns function - Returns the coercion callback function to be used with yargs.
 */
export function coerceToEnum(enumeration: any): (arg: any) => any {
  return function(arg: any): any {
    return arg in enumeration ? enumeration[arg] : arg;
  };
}

/**
 * Returns a coercion function that validates the string.
 *
 * @param enumeration
 * @returns function - Returns the validation callback function to be used with yargs.
 * @throws ArgumentError - If validation fails.
 */
export function validateArgumentString(
  regex: RegExp,
  property: string
): (str: string) => string {
  return function(str: string): string {
    if (!regex.test(str)) throw new ArgumentError(true, property, str);
    return str;
  };
}

/**
 * Returns a coercion function that validates the string.
 *
 * @param enumeration
 * @returns function - Returns the validation callback function to be used with yargs.
 * @throws ConfigPropertyError - If validation fails.
 */
export function validateConfigureString(
  regex: RegExp,
  property: string
): (str: string) => string {
  return function(str: string): string {
    if (!regex.test(str)) throw new ConfigPropertyError(true, property, str);
    return str;
  };
}

export function getConfigurationPath(): string {
  switch (process.platform) {
    case "win32":
      return path.join(process.env.APPDATA || "./", "rdnsu");
    default:
      return "/etc/rdnsu/";
  }
}
