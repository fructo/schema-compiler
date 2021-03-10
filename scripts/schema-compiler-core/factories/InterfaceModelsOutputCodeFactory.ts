'use strict';

import { InterfaceModel } from '../models/InterfaceModel.js';
import { PropertyModel } from '../models/PropertyModel.js';
import { CompilationRegistry } from '../registry/CompilationRegistry.js';
import { IRegistrableModel } from '../registry/IRegistrableModel.js';


export class InterfaceModelsOutputCodeLinesFactory {

    constructor(
        private readonly registry: CompilationRegistry
    ) {
        this.registry.on('register-model', (model) => {
            this.processModel(model);
        });
        this.registry.on('register-model-silently', (model) => {
            this.processModel(model);
        });
    }

    private processModel(model: IRegistrableModel): void {
        if (model instanceof InterfaceModel) {
            const outputLines = this.createOutputCodeLines(model);
            this.registry.registerOutputCodeLines(outputLines);
        }
    }

    private createOutputCodeLines(model: InterfaceModel): Array<string> {
        const ancestorsAsString = model.ancestors.map(ancestor => ancestor.name).join(', ');
        return [
            `export interface ${model.name} ${ancestorsAsString ? `extends ${ancestorsAsString} ` : ''}{`,
            ...this.createPropertiesOutputLines(model.properties),
            `}`
        ];
    }

    private createPropertiesOutputLines(properties: Array<PropertyModel>): Array<string> {
        return properties
            .map(propertyModel => {
                const hasNestedProperties = propertyModel.type.toString() === 'anonymous';
                if (hasNestedProperties) {
                    const [nestedInterface] = propertyModel.type.toDisjunctiveArray((_,) => _) as [InterfaceModel];
                    return [
                        `${propertyModel.name}: {`,
                        ...this.createPropertiesOutputLines(nestedInterface.properties),
                        `};`
                    ];
                }
                return [`${propertyModel.name}: ${propertyModel.type.toString()};`];
            })
            .flatMap(x => x);
    }

}
