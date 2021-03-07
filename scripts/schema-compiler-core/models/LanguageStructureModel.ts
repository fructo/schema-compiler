'use strict';

import { PropertyModel, TPropertyModelSchema } from './PropertyModel.js';
import { IRegistrableModel } from '../registry/IRegistrableModel.js';


/**
 * A language structure schema can be defined as an array or as a dictionary.
 */
export type TLanguageStructureModelSchema
    <
    ModelArraySchema extends TLanguageStructureModelArraySchema,
    ModelDictionarySchema extends TLanguageStructureModelDictionarySchema<
        TLanguageStructurePropertiesModelArraySchema,
        TLanguageStructurePropertiesModelDictionarySchema>
    >
    = ModelArraySchema | ModelDictionarySchema;


/**
 * A language structure schema can be represented by an array of strings.
 * In that case, a string is a name of another language structure.
 * The string must be treated as a property of the structure.
 */
export type TLanguageStructureModelArraySchema = Array<string>;


/**
 * A language structure schema can be represented by a dictionary.
 * Lets to specify the ancestors of the language structure and more complex properties than in the {@link TLanguageStructureModelArraySchema}.
 */
export type TLanguageStructureModelDictionarySchema
    <
    PropertiesModelArraySchema extends TLanguageStructurePropertiesModelArraySchema,
    PropertiesModelDictionarySchema extends TLanguageStructurePropertiesModelDictionarySchema
    >
    = {
        /**
         * Comma-separated names of ancestors.
         * Whitespaces are allowed.
         * 
         * @example
         * ```txt
         * 'IMyInterface, IMySecondInterface'
         * ```
         */
        readonly ancestors?: string;

        /**
         * Properties of a structure.
         * Can be specified as an array or a dictionary.
         */
        readonly properties?: PropertiesModelArraySchema | PropertiesModelDictionarySchema;
    }


/**
 * A language structure properties can be represented by an array of strings.
 * In that case, a string is a name of another language structure.
 * The string must be treated as a property of the langueage structure.
 */
export type TLanguageStructurePropertiesModelArraySchema = Array<string>;


/**
 * A language structure properties can be represented by a dictionary.
 * In that case, a key of the dictionary is a name of a property.
 * The name is allowed to not match the naming convention.
 */
export type TLanguageStructurePropertiesModelDictionarySchema = Record<string, TPropertyModelSchema>;


/**
 * Language structures are Interfaces and Classes.
 */
export abstract class LanguageStructureModel implements IRegistrableModel {

    /**
     * Name of a structure.
     * 
     * @override
     */
    public readonly name: string;

    /**
     * Structures from which the inheritance should be performed.
     */
    public readonly ancestors: Array<LanguageStructureModel>;

    /**
     * Properties of a structure.
     */
    public readonly properties: Array<PropertyModel>;

    constructor({ name, ancestors, properties }: {
        /**
         * @see {@link LanguageStructureModel.name}
         */
        name: string,
        /**
         * @see {@link LanguageStructureModel.ancestors}
         */
        ancestors?: Array<LanguageStructureModel>,
        /**
         * @see {@link LanguageStructureModel.properties}
         */
        properties?: Array<PropertyModel>
    }) {
        this.name = name;
        this.ancestors = ancestors || [];
        this.properties = properties || [];
    }

}
