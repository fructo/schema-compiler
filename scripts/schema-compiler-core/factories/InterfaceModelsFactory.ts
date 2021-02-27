'use strict';

import { LanguageStructureModelsFactory } from './LanguageStructureModelsFactory.js';

import {
    TInterfaceModelArraySchema,
    TInterfaceModelDictionarySchema,
    TInterfaceModelSchema,
    TInterfacePropertiesModelArraySchema,
    TInterfacePropertiesModelDictionarySchema,
    InterfaceModel
} from '../models/InterfaceModel.js';


export class InterfaceModelsFactory extends LanguageStructureModelsFactory<
    InterfaceModel,
    TInterfacePropertiesModelArraySchema,
    TInterfacePropertiesModelDictionarySchema,
    TInterfaceModelArraySchema,
    TInterfaceModelDictionarySchema,
    TInterfaceModelSchema
    >{

    /**
     * @override
     */
    protected modelClass = InterfaceModel;

    /**
     * Checks if an interface name matches the naming convention.
     * A type name must start with the I character. The second character must be uppercase.
     * 
     * @override
     */
    protected checkNamingConventionOfLanguageStructureName(interfaceName: string): boolean {
        return /^I[A-Z]/.test(interfaceName);
    }

    /**
     * Interface property name creation algorithm:
     * - Remove the first character from an interface name.
     * - Make the new first character a lowercase character.
     * 
     * @override
     * @example
     * ```txt
     * IMyMessage => myMessage
     * MyMessage => myMessage
     * ```
     * @param dependencyName - A name of a model (interface or class).
     */
    protected performNamingConventionOnPropertyNameOfModelArraySchema(dependencyName: string): string {
        return dependencyName.replace(/^I([A-Z])/, '$1').replace(/^([A-Z])/, (firstChar) => firstChar.toLocaleLowerCase());
    }

}
