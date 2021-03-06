import { Type } from './Type';
import { Platform } from '../platforms';
import { EntityProperty } from '../typings';

export class BlobType extends Type<Buffer | null> {

  convertToDatabaseValue(value: Buffer, platform: Platform): Buffer {
    return value;
  }

  convertToJSValue(value: Buffer, platform: Platform): Buffer | null {
    if (value as unknown instanceof Buffer || !value) {
      return value;
    }

    /* istanbul ignore else */
    if (value.buffer instanceof Buffer) {
      return value.buffer;
    }

    return Buffer.from(value);
  }

  getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getBlobDeclarationSQL();
  }

}
