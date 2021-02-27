'use strict';

import { IRegistrableModel } from '../registry/IRegistrableModel.js';


export type TTypeModelSchema = {

    /**
     * Description of type.
     * 
     * @example
     * ```txt
     * greater_than_42
     * ```
     */
    readonly description: string;

    /**
     * TypeScript line of code.
     * Boolean expression.
     * 
     * @example
     * ```ts
     * value > 20 && value < 30
     * ```
     */
    readonly rule: string;

    /**
     * Primitive JavaScript type.
     * 
     * @example
     * ```txt
     * 'number'
     * 'string'
     * 'boolean'
     * 'object'
     * ```
     */
    readonly type: string;

    /**
     * Comma-separated types from which the inheritance should be performed.
     * 
     * @example
     * ```txt
     * 'TString, TNumber'
     * ```
     */
    readonly ancestors?: string;

};


export class TypeModel implements IRegistrableModel {

    /**
     * @override
     */
    public readonly name: string;

    /**
     * @see {@link TTypeModelSchema.description}
     */
    public readonly description: string;

    /**
     * @see {@link TTypeModelSchema.rule}
     */
    public readonly rule: string;

    /**
     * @see {@link TTypeModelSchema."type"}
     */
    public readonly type: string;

    /**
     * Types from which the inheritance should be performed.
     * @see {@link TTypeModelSchema.ancestors}
     */
    public readonly ancestors: Array<TypeModel>;

    constructor({ name, description, rule, type, ancestors }: {
        /**
         * @see {@link TypeModel.name}
         */
        name: string,
        /**
         * @see {@link TypeModel.description}
         */
        description: string,
        /**
         * @see {@link TypeModel.rule}
         */
        rule: string,
        /**
         * @see {@link TypeModel."type"}
         */
        type: string,
        /**
         * @see {@link TypeModel.ancestors}
         */
        ancestors: Array<TypeModel>
    }) {
        this.name = name;
        this.description = description;
        this.rule = rule;
        this.type = type;
        this.ancestors = ancestors;
    }

}
