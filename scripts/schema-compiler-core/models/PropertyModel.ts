'use strict';

import { IRegistrableModel } from '../registry/IRegistrableModel.js';
import { BinaryExpressionTree } from '../utils/BinaryExpressionTree.js';
import { ValueModel } from './ValueModel.js';


export type TPropertyModelSchema = TPropertyModelExpressionSchema | TPropertyModelDictionarySchema;


/**
 * A property type can be represented by an expression.
 * An expression can contain names of language structures, type model names, primitive values.
 * All values must be separated by a logic operator (&, |, (, )).
 * 
 * @example
 * ```ts
 * "'my-constant-string'"
 * "TString | 'my-default-string'"
 * ```
 */
export type TPropertyModelExpressionSchema = string;


export type TPropertyModelDictionarySchema = {
    [propertyName: string]: TPropertyModelSchema
};


export type TPropertyType = BinaryExpressionTree<IRegistrableModel | ValueModel>;


/**
 * Describes a property of a language structure.
 */
export class PropertyModel {

    /**
     * Property name.
     */
    public readonly name: string;

    /**
     * A binary expression tree.
     * The tree can contain language structure models, type models, value models.
     */
    public readonly type: TPropertyType;

    constructor({ name, type }: {
        /**
         * @see {@link PropertyModel.name}
         */
        name: string,
        /**
         * @see {@link PropertyModel."type"}
         */
        type: TPropertyType;
    }) {
        this.name = name;
        this.type = type;
    }

    public clone(): PropertyModel {
        return new PropertyModel({
            name: this.name,
            type: this.type.clone()
        });
    }

}
