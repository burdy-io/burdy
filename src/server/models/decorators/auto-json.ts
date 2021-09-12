import {AfterLoad, BeforeInsert, BeforeUpdate, getMetadataArgsStorage} from "typeorm";


const AutoJson = (): PropertyDecorator => (target: any, propertyKey: string) => {
  const basePropertyName = `__autoJson__${propertyKey}`;

  const serializeProperty = `${basePropertyName}__serialize`;
  const deserializeProperty = `${basePropertyName}__deserialize`;

  target[serializeProperty] = function () {
    try {
      this[propertyKey] = JSON.stringify(this[propertyKey]);
    } catch (e) {
      //
    }
  }

  target[deserializeProperty] = function () {
    try {
      this[propertyKey] = JSON.parse(this[propertyKey]);
    } catch (e) {
      //
    }
  }

  BeforeInsert()(target, serializeProperty);
  BeforeUpdate()(target, serializeProperty);
  AfterLoad()(target,deserializeProperty);
}

export default AutoJson;
