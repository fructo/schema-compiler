'use strict';

import { ISchema } from './schema/ISchema.js';
import { CompilationRegistry } from './registry/CompilationRegistry.js';
import { MergedInterfacesEntitiesFactory } from './factories/MergedInterfacesEntitiesFactory.js';
import { InterfacesOutputCodeLinesFactory } from './factories/InterfacesOutputCodeLinesFactory.js';
import { ClassesOutputCodeLinesFactory } from './factories/ClassesOutputCodeLinesFactory.js';
import { FormattedOutputCodeLinesFactory } from './factories/FormattedOutputCodeLinesFactory.js';


export class SchemaCompilerCore {

    public compileSchema(schema: ISchema): Array<string> {
        const lines: Array<string> = [];
        const compilationRegitry = new CompilationRegistry();
        compilationRegitry.on('register-entity', (...args) => MergedInterfacesEntitiesFactory.createMergedInterfaceEntity(...args));
        compilationRegitry.on('register-entity', (...args) => InterfacesOutputCodeLinesFactory.createInterfaceOutputCodeLines(...args));
        compilationRegitry.on('register-entity', (...args) => ClassesOutputCodeLinesFactory.createClassOutputCodeLines(...args));
        compilationRegitry.on('register-entity-silently', (...args) => InterfacesOutputCodeLinesFactory.createInterfaceOutputCodeLines(...args));
        compilationRegitry.on('register-entity-silently', (...args) => ClassesOutputCodeLinesFactory.createClassOutputCodeLines(...args));
        compilationRegitry.on('register-output-code-lines', (...args) => FormattedOutputCodeLinesFactory.createFormattedOutputCodeLines(...args));
        compilationRegitry.on('register-output-code-lines', (_, __, outputCodeLines) => {
            lines.push(...outputCodeLines);
        });
        Object.entries(schema).forEach(([entityName, entityBody]) => compilationRegitry.registerEntity(entityName, entityBody));
        return lines;
    }

}
