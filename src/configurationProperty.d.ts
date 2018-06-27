export default interface ConfigurationProperty {
  type: string;
  required?: boolean;
  default?: any;
  coerce?: (value: any) => any;
  choices?: string[];
}
