'use strict';

import { InterfaceModel } from '../models/InterfaceModel.js';
import {
    PropertyModel,
    TPropertyModelDictionarySchema,
    TPropertyModelSchema,
    TPropertyModelExpressionSchema
} from '../models/PropertyModel.js';
import { ValueModel } from '../models/ValueModel.js';
import { CompilationRegistry } from '../registry/CompilationRegistry.js';
import { IRegistrableModel } from '../registry/IRegistrableModel.js';
import { BinaryExpressionTree } from '../utils/BinaryExpressionTree.js';
import { TypeUtil } from '../utils/TypeUtil.js';


export class PropertyModelsFactory {

    constructor(
        private readonly registry: CompilationRegistry
    ) { }

    /**
     * Creates a property model from a model of a language structure.
     * 
     * @param propertyName - Name of a property.
     * @param model - Model of a language structure. Will be treated as a body of property.
     */
    public fromModel(propertyName: string, model: IRegistrableModel): PropertyModel {
        return new PropertyModel({
            name: propertyName,
            type: BinaryExpressionTree.fromValue(model),
        });
    }

    /**
     * Creates a property model from a schema.
     * 
     * @param propertyName - Name of a property.
     * @param propertySchema - Schema of a property (dictionary or string).
     */
    public fromPropertyModelSchema(propertyName: string, propertySchema: TPropertyModelSchema): PropertyModel {
        if (TypeUtil.isDictionary(propertySchema)) {
            const nestedPropertiesInterfaceModel = new InterfaceModel({
                name: 'anonymous',
                properties: Object.entries(propertySchema as TPropertyModelDictionarySchema)
                    .map(([name, schema]) => this.fromPropertyModelSchema(name, schema))
            });
            return this.fromModel(propertyName, nestedPropertiesInterfaceModel);
        }
        if (TypeUtil.isString(propertySchema)) {
            return new PropertyModel({
                name: propertyName,
                type: BinaryExpressionTree.fromExpression(propertySchema as TPropertyModelExpressionSchema, (valueAsString) => {
                    if (/^'.*'$/.test(valueAsString)) {
                        // string
                        return new ValueModel({ value: valueAsString.replace(/^'(.*)'$/, "'$1'") });
                    }
                    if (/^\d+$/.test(valueAsString)) {
                        // integer
                        return new ValueModel({ value: parseInt(valueAsString) });
                    }
                    if (/^((true)|(false))$/.test(valueAsString)) {
                        // boolean
                        return new ValueModel({ value: valueAsString === 'true' });
                    }
                    if (/^null$/.test(valueAsString)) {
                        // null
                        return new ValueModel({ value: null });
                    }
                    return this.registry.getModel(valueAsString);
                })
            });
        }
        throw new SyntaxError(`${propertyName} does not have a type.`);
    }

}
