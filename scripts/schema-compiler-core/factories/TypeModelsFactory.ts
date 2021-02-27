'use strict';

import { TTypeModelSchema, TypeModel } from '../models/TypeModel.js';
import { CompilationRegistry } from '../registry/CompilationRegistry.js';


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
    public fromModelSchema(modelName: string, modelSchema: TTypeModelSchema): TypeModel | undefined {
        if (this.checkNamingConventionOfTypeName(modelName)) {
            const ancestorsNames = (modelSchema.ancestors || '').split(',').map(name => name.trim());
            const ancestors = ancestorsNames.map(ancestorName => this.registry.getModel<TypeModel>(ancestorName));
            const model = new TypeModel({
                name: modelName,
                description: modelSchema.description,
                rule: modelSchema.rule,
                type: modelSchema.type,
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

}
