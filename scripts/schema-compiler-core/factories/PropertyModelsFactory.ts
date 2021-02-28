'use strict';

import { PropertyModel, TPropertyModelDictionarySchema } from '../models/PropertyModel.js';
import { CompilationRegistry } from '../registry/CompilationRegistry.js';
import { BinaryExpressionTree } from '../utils/BinaryExpressionTree.js';
import { AnonymousInterfaceModelsFactory } from './AnonymoysInterfaceModelFactory.js';


export class PropertyModelsFactory {

    private readonly anonymousInterfaceModelsFactory: AnonymousInterfaceModelsFactory;

    constructor(
        private readonly registry: CompilationRegistry
    ) {
        this.anonymousInterfaceModelsFactory = new AnonymousInterfaceModelsFactory(registry, this);
    }

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
     * @param propertySchema - Schema of a property (dictionary).
     */
    public fromPropertyModelDictionarySchema(propertyName: string, propertySchema: TPropertyModelDictionarySchema): PropertyModel {
        if ('constant' in propertySchema) {
            return new PropertyModel({
                name: propertyName,
                type: BinaryExpressionTree.fromValue(null),
                hasConstantValue: true,
                constantValue: propertySchema.constant
            });
        }
        if ('type' in propertySchema) {
            if (typeof propertySchema.type !== 'string') {
                throw new SyntaxError(`${propertyName} defines "type" not as a string`);
            }
            return new PropertyModel({
                name: propertyName,
                type: this.mapBinaryExpressionTreeWithModels(BinaryExpressionTree.fromExpression(propertySchema.type)),
                hasDefaultValue: 'default' in propertySchema,
                defaultValue: propertySchema.default
            });
        }
        if ('properties' in propertySchema) {
            const model = this.anonymousInterfaceModelsFactory.fromModelSchema(propertySchema);
            return new PropertyModel({
                name: propertyName,
                type: BinaryExpressionTree.fromValue(model)
            });
        }
        throw new SyntaxError(`${propertyName} does not have a type.`);
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
