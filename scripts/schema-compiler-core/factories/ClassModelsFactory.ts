'use strict';

import { LanguageStructureModelsFactory } from './LanguageStructureModelsFactory.js';

import {
    TClassModelArraySchema,
    TClassModelDictionarySchema,
    TClassModelSchema,
    TClassPropertiesModelArraySchema,
    TClassPropertiesModelDictionarySchema,
    ClassModel
} from '../models/ClassModel.js';


export class ClassModelsFactory extends LanguageStructureModelsFactory<
    ClassModel,
    TClassPropertiesModelArraySchema,
    TClassPropertiesModelDictionarySchema,
    TClassModelArraySchema,
    TClassModelDictionarySchema,
    TClassModelSchema
    >{

    /**
     * @override
     */
    protected modelClass = ClassModel;

    /**
     * Checks if a class name matches the naming convention.
     * A type name must start with the I character. The second character must be uppercase.
     * 
     * @override
     */
    protected checkNamingConventionOfLanguageStructureName(className: string): boolean {
        return /^[A-Z][a-z]/.test(className);
    }

    /**
     * Class property name creation algorithm:
     * - Remove the first character from an interface name.
     * - Split the name by capitalized letters and concatenate them using underscore.
     * 
     * @example
     * ```txt
     * IMyMessage => MY_MESSAGE
     * MyMessage => MY_MESSAGE
     * ```
     * @param dependencyName - A name of a model (interface or class).
     */
    protected performNamingConventionOnPropertyNameOfModelArraySchema(dependencyName: string): string {
        return dependencyName.replace(/^I([A-Z])/, '$1').split(/(?=[A-Z])/).join('_').toUpperCase();
    }

}
