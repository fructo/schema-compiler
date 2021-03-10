'use strict';

import { CompilationRegistry } from './registry/CompilationRegistry.js';
import { FormattedOutputCodeLinesFactory } from './factories/FormattedOutputCodeLinesFactory.js';

import { TypeModelsFactory } from './factories/TypeModelsFactory.js';
import { PropertyModelsFactory } from './factories/PropertyModelsFactory.js';
import { InterfaceModelsFactory } from './factories/InterfaceModelsFactory.js';
import { ClassModelsFactory } from './factories/ClassModelsFactory.js';
import { InterfaceModelsOutputCodeLinesFactory } from './factories/InterfaceModelsOutputCodeFactory.js';
import { ClassModelsOutputCodeLinesFactory } from './factories/ClassModelsOutputCodeLinesFactory.js';


export class SchemaCompilerCore {

    public compileSchema(schema: Record<string, unknown>): Array<string> {
        const outputLines: Array<string> = [];
        const registry = new CompilationRegistry();
        registry.on('register-output-code-lines', (lines) => FormattedOutputCodeLinesFactory.createFormattedOutputCodeLines(lines));
        registry.on('register-output-code-lines', (lines) => console.log(lines));
        registry.on('register-output-code-lines', (lines) => outputLines.push(...lines));
        new InterfaceModelsOutputCodeLinesFactory(registry);
        new ClassModelsOutputCodeLinesFactory(registry);
        const typesModelsFactory = new TypeModelsFactory(registry);
        const propertiesModelsFactory = new PropertyModelsFactory(registry);
        const interfacesModelsFactory = new InterfaceModelsFactory(registry, propertiesModelsFactory);
        const classesModelsFactory = new ClassModelsFactory(registry, propertiesModelsFactory);
        Object.entries(schema).forEach(([modelName, modelSchema]) => {
            typesModelsFactory.fromModelSchema(modelName, modelSchema);
            interfacesModelsFactory.fromModelSchema(modelName, modelSchema);
            classesModelsFactory.fromModelSchema(modelName, modelSchema);
        });
        return outputLines;
    }

}
