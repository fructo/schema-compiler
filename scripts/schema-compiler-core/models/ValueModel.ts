'use strict';

import { TypeUtil } from '../utils/TypeUtil.js';


export class ValueModel {

    public readonly value: unknown;

    constructor({ value }: { value: unknown }) {
        this.value = value;
    }

    public toString(): string {
        return TypeUtil.isString(this.value) ? this.value as string : JSON.stringify(this.value);
    }

}
