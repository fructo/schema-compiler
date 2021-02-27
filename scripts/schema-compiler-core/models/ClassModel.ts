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
export type TClassModelSchema = TLanguageStructureModelSchema<TClassModelArraySchema, TClassModelDictionarySchema>;


/**
 * Every property name will be reconverted to match the naming convention.
 * 
 * @example
 * ```txt
 * IMyInterface => MY_INTERFACE
 * MyClass => MY_CLASS
 * ```
 * @see {@link TLanguageStructureModelArraySchema}
 */
export type TClassModelArraySchema = TLanguageStructureModelArraySchema;


/**
 * @see {@link TLanguageStructureModelDictionarySchema}
 */
export type TClassModelDictionarySchema = TLanguageStructureModelDictionarySchema<TClassPropertiesModelArraySchema, TClassPropertiesModelDictionarySchema>;


/**
 * Every property name will be reconverted to match the naming convention.
 * 
 * @example
 * ```txt
 * IMyInterface => MY_INTERFACE
 * MyClass => MY_CLASS
 * ```
 * @see {@link TLanguageStructurePropertiesModelArraySchema}
 */
export type TClassPropertiesModelArraySchema = TLanguageStructurePropertiesModelArraySchema;


/**
 * @see {@link TLanguageStructurePropertiesModelDictionarySchema}
 */
export type TClassPropertiesModelDictionarySchema = TLanguageStructurePropertiesModelDictionarySchema;


export class ClassModel extends LanguageStructureModel {

}
