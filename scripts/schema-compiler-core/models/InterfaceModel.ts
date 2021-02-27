'use strict';

import {
    LanguageStructureModel,
    TLanguageStructureModelArraySchema,
    TLanguageStructureModelDictionarySchema,
    TLanguageStructureModelSchema,
    TLanguageStructurePropertiesModelArraySchema,
    TLanguageStructurePropertiesModelDictionarySchema
} from './LanguageStructureModel.js';


/**
 * @see {@link TLanguageStructureModelSchema}
 */
export type TInterfaceModelSchema = TLanguageStructureModelSchema<TInterfaceModelArraySchema, TInterfaceModelDictionarySchema>;


/**
 * Every property name will be reconverted to match the naming convention.
 * 
 * @example
 * ```txt
 * IMyInterface => myInterface
 * MyClass => myClass
 * ```
 * @see {@link TLanguageStructureModelArraySchema}
 */
export type TInterfaceModelArraySchema = TLanguageStructureModelArraySchema;


/**
 * @see {@link TLanguageStructureModelDictionarySchema}
 */
export type TInterfaceModelDictionarySchema = TLanguageStructureModelDictionarySchema<TInterfacePropertiesModelArraySchema, TInterfacePropertiesModelDictionarySchema>;


/**
 * Every property name will be reconverted to match the naming convention.
 * 
 * @example
 * ```txt
 * IMyInterface => myInterface
 * MyClass => myClass
 * ```
 * @see {@link TLanguageStructurePropertiesModelArraySchema}
 */
export type TInterfacePropertiesModelArraySchema = TLanguageStructurePropertiesModelArraySchema;


/**
 * @see {@link TLanguageStructurePropertiesModelDictionarySchema}
 */
export type TInterfacePropertiesModelDictionarySchema = TLanguageStructurePropertiesModelDictionarySchema;


export class InterfaceModel extends LanguageStructureModel {

}
