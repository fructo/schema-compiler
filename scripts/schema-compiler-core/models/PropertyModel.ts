'use strict';

import { BinaryExpressionTree } from '../utils/BinaryExpressionTree.js';


/**
 * The properties of a language structure can be represented as a dictionary.
 */
export type TPropertyModelDictionarySchema = {

    /**
     * Holds a constant value of a property.
     */
    readonly constant?: unknown;

    /**
     * Holds a default value of a property.
     */
    readonly default?: unknown;

    /**
     * Property type can be represented by a string.
     * The string can contain names of language structures separated by the logic operators (&, |, (, )).
     */
    readonly type?: string;

};


/**
 * Describes a property of a language structure.
 */
export class PropertyModel {

    /**
     * Property name. Optional because nested properties do not have a name.
     */
    public readonly name?: string;

    /**
     * A binary expression tree.
     * The tree can contain language structure models, type models.
     */
    public readonly type: BinaryExpressionTree;

    /**
     * Equals to True if a property has a constant value.
     * Do not try to use the constant without this check first because undefined can be the constant.
     */
    public readonly hasConstantValue: boolean;

    /**
     * Equals to True if a property has a default value.
     * Do not try to use the default without this check first because undefined can be the default.
     */
    public readonly hasDefaultValue: boolean;

    /**
     * A constant value of a property.
     * Use {@link PropertyModel.hasConstantValue} first.
     */
    public readonly constantValue: unknown;

    /**
     * A constant value of a property.
     * Use {@link PropertyModel.hasDefaultValue} first.
     */
    public readonly defaultValue: unknown;

    constructor({ name, type, hasConstantValue = false, hasDefaultValue = false, constantValue, defaultValue }: {
        /**
         * @see {@link PropertyModel.name}
         */
        name?: string,
        /**
         * @see {@link PropertyModel."type"}
         */
        type: BinaryExpressionTree,
        /**
         * @see {@link PropertyModel.hasConstantValue}
         */
        hasConstantValue?: boolean,
        /**
         * @see {@link PropertyModel.hasDefaultValue}
         */
        hasDefaultValue?: boolean,
        /**
         * @see {@link PropertyModel.constantValue}
         */
        constantValue?: unknown,
        /**
         * @see {@link PropertyModel.defaultValue}
         */
        defaultValue?: unknown;
    }) {
        this.name = name;
        this.type = type;
        this.hasConstantValue = hasConstantValue;
        this.hasDefaultValue = hasDefaultValue;
        this.constantValue = constantValue;
        this.defaultValue = defaultValue;
    }

}
