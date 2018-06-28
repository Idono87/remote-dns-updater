export class ArgumentError extends Error {
  private argument: string;
  private value?: string;

  public constructor(valueError: boolean, argument: string, value?: string) {
    let message: string = valueError
      ? `Unexpected value "${value}" for argument "${argument}".`
      : `Unexpected argument "${argument}".`;

    super(message);

    this.argument = argument;
    this.value = value;
  }
}

export class ConfigPropertyError extends Error {
  private property: string;
  private value?: string;

  public constructor(valueError: boolean, property: string, value?: string) {
    let message: string = valueError
      ? `Unexpected value "${value}" for configuration property "${property}"`
      : `Unexpected configuration property "${property}".`;

    super(message);

    this.property = property;
    this.value = value;
  }
}

export class ConfigMissingPropertyError extends Error {
  private property: string;

  public constructor(property: string) {
    let message: string = `Missing configuration property "${property}".`;

    super(message);

    this.property = property;
  }
}

export class InternalError extends Error {
  public constructor(msg: string) {
    super(msg);
  }
}

export class InternalArgumentConfigurationError extends InternalError {
  public constructor(argumentName: string, configProperty: string) {
    super(
      `Property ${configProperty} missconfiguration error for ${argumentName}`
    );
  }
}

export class InternalEnumerationMissingError extends InternalError {
  public constructor(enumerationName: string, enumerationObject: string) {
    super(
      `Missing enumeration "${enumerationName}" in the enumeration "${enumerationObject}`
    );
  }
}
