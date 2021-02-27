'use strict';

import { PropertyModel, TPropertyModelDictionarySchema } from '../models/PropertyModel.js';
import { CompilationRegistry } from '../registry/CompilationRegistry.js';
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
    public fromModel(propertyName: string, model: unknown): PropertyModel {
        return new PropertyModel({
            name: propertyName,
            type: BinaryExpressionTree.fromValue(model),
        });
    }

    /**
     * Creates a property model from a schema.
     * 
     * @param propertyName - Name of a property.
     * @param propertySchema - Schema of a property (dictionary). Can contain nested dictionaries.
     */
    public fromPropertyModelDictionarySchema(propertyName: string, propertySchema: TPropertyModelDictionarySchema): PropertyModel {
        if (typeof propertySchema.type === 'string') {
            return new PropertyModel({
                name: propertyName,
                type: this.mapBinaryExpressionTreeWithModels(BinaryExpressionTree.fromExpression(propertySchema.type)),
                hasConstantValue: 'constant' in propertySchema,
                hasDefaultValue: 'default' in propertySchema,
                constantValue: propertySchema.constant,
                defaultValue: propertySchema.default
            });
        }
        if (TypeUtil.isDictionary(propertySchema.type)) {
            return new PropertyModel({
                name: propertyName,
                type: BinaryExpressionTree.fromValue(this.fromPropertyModelDictionarySchema('', propertySchema.type as TPropertyModelDictionarySchema))
            });
        }
        throw new SyntaxError();
    }

    /**
     * Replaces names of the models with corresponding models.
     * 
     * @param rawTree - A binary expression tree with string values.
     * @returns Same object of the tree.
     */
    private mapBinaryExpressionTreeWithModels(rawTree: BinaryExpressionTree): BinaryExpressionTree {
        return rawTree.mapValues((value) => {
            if (typeof value === 'string') {
                return this.registry.getModel(value);
            }
            return value;
        });
    }

}
