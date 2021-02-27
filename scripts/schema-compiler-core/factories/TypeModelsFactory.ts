'use strict';

import { TTypeModelSchema, TypeModel } from '../models/TypeModel.js';
import { CompilationRegistry } from '../registry/CompilationRegistry.js';
import { TypeUtil } from '../utils/TypeUtil.js';


export class TypeModelsFactory {

    constructor(
        private readonly registry: CompilationRegistry
    ) { }

    /**
     * Creates a model by its schema.
     * Registers the model in the compilation registry.
     * 
     * @param modelName - Model name.
     * @param modelSchema - Model schema.
     */
    public fromModelSchema(modelName: string, modelSchema: TTypeModelSchema | unknown): TypeModel | undefined {
        if (this.checkNamingConventionOfTypeName(modelName)) {
            this.checkSchemaSyntax(modelName, modelSchema);
            const typedModelSchema = modelSchema as TTypeModelSchema;
            const ancestorsNames = (typedModelSchema.ancestors || '').split(',').filter(s => s).map(name => name.trim());
            const ancestors = ancestorsNames.map(ancestorName => this.registry.getModel<TypeModel>(ancestorName));
            const model = new TypeModel({
                name: modelName,
                description: typedModelSchema.description,
                rule: typedModelSchema.rule,
                type: typedModelSchema.type,
                ancestors
            });
            this.registry.registerModel(model);
            return model;
        }
    }

    /**
     * Checks if a type name matches the naming convention.
     * A type name must start with the T character. The second character must be uppercase.
     * 
     * @param modelName - Type name.
     */
    private checkNamingConventionOfTypeName(modelName: string): boolean {
        return /^T[A-Z]/.test(modelName);
    }

    private checkSchemaSyntax(modelName: string, modelSchema: unknown) {
        if (TypeUtil.isDictionary(modelSchema)) {
            const dict = modelSchema as Record<string, unknown>;
            if ((!dict.ancestors || typeof dict.ancestors === 'string')
                && (typeof dict.description === 'string')
                && (typeof dict.rule === 'string')
                && (typeof dict.type === 'string')
            ) {
                return;
            }
        }
        throw new SyntaxError(`${modelName} does not match the schema.`);
    }

}
