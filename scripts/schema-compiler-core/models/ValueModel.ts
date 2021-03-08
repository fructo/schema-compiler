'use strict';

import { TypeUtil } from '../utils/TypeUtil.js';
import { ITreeElement } from '../utils/BinaryExpressionTree.js';


export class ValueModel implements ITreeElement {

    public readonly value: unknown;

    constructor({ value }: { value: unknown }) {
        this.value = value;
    }

    /**
     * @override
     */
    public toString(): string {
        return TypeUtil.isString(this.value) ? this.value as string : JSON.stringify(this.value);
    }

    /**
     * @override
     */
    public clone(): ValueModel {
        return new ValueModel({ value: JSON.parse(JSON.stringify(this.value)) });
    }

}
