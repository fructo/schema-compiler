'use strict';

import { ClassModelsFactory } from './ClassModelsFactory.js';
import { InterfaceModelsFactory } from './InterfaceModelsFactory.js';


export class MixModelsFactory {

    constructor(
        private readonly interfaceModelsFactory: InterfaceModelsFactory,
        private readonly classModelsFactory: ClassModelsFactory
    ) { }

    public fromModelSchema(modelName: string, modelSchema: unknown) {
        if (this.checkNamingConvention(modelName)) {
            const interfaceName = this.createInterfaceName(modelName);
            const className = this.createClassName(modelName);
            this.interfaceModelsFactory.fromModelSchema(interfaceName, modelSchema);
            this.classModelsFactory.fromModelSchema(className, modelSchema);
        }
    }

    /**
     * Checks if a model name matches the naming convention.
     * 
     * A type name must start with the X character. The second character must be uppercase.
     */
    private checkNamingConvention(name: string): boolean {
        return /^X[A-Z]/.test(name);
    }

    private createInterfaceName(mixModelName: string): string {
        return mixModelName.replace(/^X([A-Z])/, 'I$1');
    }

    private createClassName(mixModelName: string): string {
        return mixModelName.replace(/^X([A-Z])/, '$1');
    }

}
