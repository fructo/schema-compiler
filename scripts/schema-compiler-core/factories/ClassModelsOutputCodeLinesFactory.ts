'use strict';

import { ClassModel } from '../models/ClassModel.js';
import { InterfaceModel } from '../models/InterfaceModel.js';
import { PropertyModel } from '../models/PropertyModel.js';
import { TypeModel } from '../models/TypeModel.js';
import { ValueModel } from '../models/ValueModel.js';
import { CompilationRegistry } from '../registry/CompilationRegistry.js';
import { IRegistrableModel } from '../registry/IRegistrableModel.js';
import { BinaryExpressionTree } from '../utils/BinaryExpressionTree.js';


export class ClassModelsOutputCodeLinesFactory {

    constructor(
        private readonly registry: CompilationRegistry
    ) {
        this.registry.on('register-model', (model) => {
            if (model instanceof ClassModel) {
                const outputLines = this.createOutputCodeLines(model);
                this.registry.registerOutputCodeLines(outputLines);
            }
        });
    }

    private createOutputCodeLines(model: ClassModel): Array<string> {
        const ancestorsAsString = model.ancestors.map(ancestor => ancestor.name).join(', ');
        return [
            `export class ${model.name} ${ancestorsAsString ? `extends ${ancestorsAsString} ` : ''}{`,
            ...this.createPropertiesOutputLines(model),
            `}`
        ];
    }

    private createPropertiesOutputLines(model: ClassModel): Array<string> {
        return model.properties
            .map(propertyModel => {
                const typeName = propertyModel.type.toString();
                return [
                    `public static readonly ${propertyModel.name} = {`,
                    `    create(`,
                    ...this.createCreationMethodArgumentOutputLines(propertyModel),
                    `    ): ${typeName} {`,
                    ...this.createCreationMethodOutputLines(typeName, propertyModel, ['value']),
                    `    },`,
                    `    validate(value: unknown): Array<unknown> {`,
                    ...this.createValidationMethodOutputLines(propertyModel, ['value']),
                    `    }`,
                    `}`
                ];
            })
            .flatMap(x => x);
    }

    private createCreationMethodArgumentOutputLines(propertyModel: PropertyModel): Array<string> {
        const lines: Array<string> = [];
        const disjunctiveArray = this.createDisjunctiveArray(propertyModel.type);
        const isOptional = this.checkPropertiesForSelfSufficiency([propertyModel]);
        const isOneLine = disjunctiveArray.every(element => element instanceof ValueModel || element instanceof TypeModel);
        if (isOneLine) {
            lines.push(...[
                `value${isOptional ? '?' : ''}: ${propertyModel.type.toString()}`
            ]);
        } else {
            const oneLine = disjunctiveArray
                .filter(element => element instanceof ValueModel || element instanceof TypeModel)
                .map(element => element.toString())
                .join(' | ');
            const [firstInterfaceLines, ...remainingInterfacesLines] = (disjunctiveArray
                .filter(element => element instanceof InterfaceModel) as Array<InterfaceModel>)
                .map(element => this.createCreationMethodArgumentInterfaceOuputLines(element));
            lines.push(...this.injectInterfacesDisjunction([
                [
                    `value${isOptional ? '?' : ''}: ${oneLine}${oneLine ? ' | ' : ''}{`,
                    ...firstInterfaceLines
                ],
                ...remainingInterfacesLines
            ]));
        }
        return lines;
    }

    private injectInterfacesDisjunction(interfacesLines: Array<Array<string>>): Array<string> {
        const lines: Array<string> = [];
        for (let i = 0; i < interfacesLines.length; i++) {
            lines.push(...interfacesLines[i]);
            if (i === interfacesLines.length - 1) {
                lines.push('}');
            } else {
                lines.push('} | {');
            }
        }
        return lines;
    }

    private createCreationMethodArgumentInterfaceOuputLines(interfaceModel: InterfaceModel): Array<string> {
        const lines: Array<string> = [];
        const allProperties = this.collectDeepAncestorsProperties(interfaceModel);
        allProperties.forEach(propertyModel => {
            const disjunctiveArray = this.createDisjunctiveArray(propertyModel.type);
            const isOptional = this.checkPropertiesForSelfSufficiency([propertyModel]);
            const isOneLine = disjunctiveArray.every(element => element instanceof ValueModel || element instanceof TypeModel);
            if (isOneLine) {
                lines.push(...[
                    `${propertyModel.name}${isOptional ? '?' : ''}: ${propertyModel.type.toString()};`
                ]);
            } else {
                const oneLine = disjunctiveArray
                    .filter(element => element instanceof ValueModel || element instanceof TypeModel)
                    .map(element => element.toString())
                    .join(' | ');
                const [firstInterfaceLines, ...remainingInterfacesLines] = (disjunctiveArray
                    .filter(element => element instanceof InterfaceModel) as Array<InterfaceModel>)
                    .map(element => this.createCreationMethodArgumentInterfaceOuputLines(element));
                lines.push(...this.injectInterfacesDisjunction([
                    [
                        `${propertyModel.name}${isOptional ? '?' : ''}: ${oneLine}${oneLine ? ' | ' : ''}{`,
                        ...firstInterfaceLines
                    ],
                    ...remainingInterfacesLines
                ]));
            }
        });
        return lines;
    }

    private collectDeepAncestorsProperties(interfaceModel: InterfaceModel): Array<PropertyModel> {
        const ancestorsProperties = interfaceModel.ancestors
            .map(ancestor => this.collectDeepAncestorsProperties(ancestor))
            .flatMap(x => x);
        return this.filterUniqueProperties([...interfaceModel.properties, ...ancestorsProperties]);
    }

    /**
     * Algorithm:
     * 
     * 1. If a value is undefined:
     *  - 1.1 If the disjunctive array contains a value model, use it as the value. GOTO NEXT VALUE
     *  - 1.2 If the disjunctive array contains an interface model, first find a self-sufficient one and use it as the value. GOTO NEXT VALUE
     *  - 1.3 TODO: If the disjunctive array contains an interface model that is not self-sufficient, throw a TYPE ERROR.
     *  - 1.4 TODO: If the disjunctive array contains a type model, throw a TYPE ERROR.
     * 2. If a value is not undefined:
     *  - 2.1 If the disjunctive array contains a type model that matches the value, use the value. GOTO NEXT VALUE
     *  - 2.2 If the disjunctive array contains a value model that matches the value, use the value. GOTO NEXT VALUE
     *  - 2.3 If the disjunctive array contains an interface model:
     *     - 2.3.1 Detect the interface by the value (use rules created by classification).
     *     - 2.3.2 Copy the value.
     *     - 2.3.3 Check for undefined and inject ONLY possibly optional values. GOTO NEXT VALUE
     * 3. Throw a TYPE ERROR.
     */
    private createCreationMethodOutputLines(typeName: string, propertyModel: PropertyModel, pathStack: Array<string>): Array<string> {
        const disjunctiveArray = this.createDisjunctiveArray(propertyModel.type);
        const lines = [];
        // CASE: 1.1
        const valueModel = disjunctiveArray.find(element => element instanceof ValueModel);
        if (valueModel) {
            lines.push(...[
                `if (value === undefined) {`,
                `    return ${valueModel.toString()};`,
                `}`
            ]);
        } else {
            // CASE: 1.2
            const selfSufficientInterfaceModel = this.findSelfSufficientInterfaceModel(disjunctiveArray);
            if (selfSufficientInterfaceModel) {
                lines.push(...[
                    `if (value === undefined) {`,
                    `    return {`,
                    ...this.createSelfSufficientInterfaceModelOutputLines(selfSufficientInterfaceModel),
                    `    };`,
                    `}`
                ]);
            }
        }
        // CASE: 2.1
        const valuesModels = disjunctiveArray.filter(element => element instanceof ValueModel);
        valuesModels.forEach(model => lines.push(...[
            `if (value === ${model.toString()}) {`,
            `    return value;`,
            `}`
        ]));
        // CASE: 2.2
        const typesModels = disjunctiveArray.filter(element => element instanceof TypeModel) as Array<TypeModel>;
        typesModels.forEach(model => lines.push(...[
            `if (${model.rule}) {`,
            `    return value;`,
            `}`
        ]));
        // CASE: 2.3
        const rules = this.classifyDisjunctiveArray(disjunctiveArray, pathStack);
        const interfacesModels = disjunctiveArray.filter(element => element instanceof InterfaceModel) as Array<InterfaceModel>;
        interfacesModels.forEach(interfaceModel => {
            const rule = rules.get(interfaceModel) as string;
            if (rule) {
                lines.push(...[
                    `if (${rule}) {`,
                    `    const obj = { ...value };`,
                    ...this.createInterfaceModelOutputLines(interfaceModel, ['obj']),
                    `    return obj as ${typeName};`,
                    `}`
                ]);
            } else {
                lines.push(...[
                    `const obj = { ...value };`,
                    ...this.createInterfaceModelOutputLines(interfaceModel, ['obj']),
                    `return obj as ${typeName};`,
                ]);
            }
        });
        // CASE: 3
        lines.push(...[
            `throw new TypeError();`
        ]);
        return lines;
    }

    private createDisjunctiveArray(typeTree: BinaryExpressionTree<IRegistrableModel | ValueModel>): Array<IRegistrableModel | ValueModel> {
        const disjunctiveArray = typeTree.toDisjunctiveArray((leftElement, rightElement) => {
            if (leftElement instanceof InterfaceModel && rightElement instanceof InterfaceModel) {
                return new InterfaceModel({
                    name: `${leftElement.name}+${rightElement.name}`,
                    properties: this.filterUniqueProperties([...leftElement.properties, ...rightElement.properties])
                });
            }
            if (leftElement instanceof TypeModel && rightElement instanceof TypeModel) {
                if (leftElement.name === rightElement.name) {
                    return leftElement;
                }
                if (leftElement.type === rightElement.type) {
                    return new TypeModel({
                        name: `${leftElement.name}+${rightElement.name}`,
                        description: `${leftElement.description}+${rightElement.description}}`,
                        rule: `${leftElement.rule} && ${rightElement.rule}`,
                        type: leftElement.type,
                        ancestors: [...new Set([...leftElement.ancestors, ...rightElement.ancestors]).values()]
                    });
                }
            }
            if (leftElement instanceof ValueModel && rightElement instanceof ValueModel) {
                if (leftElement.value === rightElement.value) {
                    return leftElement;
                }
            }
            if (leftElement instanceof ValueModel && rightElement instanceof TypeModel || leftElement instanceof TypeModel && rightElement instanceof ValueModel) {
                const valueModel = [leftElement, rightElement].find(element => element instanceof ValueModel) as ValueModel;
                const typeModel = [leftElement, rightElement].find(element => element instanceof TypeModel) as TypeModel;
                const evalFunction = new Function(`"use strict";return ${typeModel.rule};`.replace('value', valueModel.toString()));
                if (evalFunction()) {
                    return valueModel;
                }
            }
            throw new TypeError(`Illegal conjunction of ${leftElement.toString()} and ${rightElement.toString()}`);
        });
        return disjunctiveArray;
    }

    private filterUniqueProperties(properties: Array<PropertyModel>): Array<PropertyModel> {
        const knownNames = new Set<string>();
        return properties.filter(property => {
            const isDuplicate = knownNames.has(property.name);
            knownNames.add(property.name);
            return !isDuplicate;
        });
    }

    private findSelfSufficientInterfaceModel(disjunctiveArray: Array<IRegistrableModel | ValueModel>): InterfaceModel | undefined {
        const interfacesModels = disjunctiveArray.filter(element => element instanceof InterfaceModel) as Array<InterfaceModel>;
        return interfacesModels.find(interfaceModel => this.checkPropertiesForSelfSufficiency(interfaceModel.properties));
    }

    private checkPropertiesForSelfSufficiency(propertiesModels: Array<PropertyModel>): boolean {
        return propertiesModels.every(propertyModel => {
            if (propertyModel.type instanceof BinaryExpressionTree) {
                const propertyDisjunctiveArray = this.createDisjunctiveArray(propertyModel.type);
                if (propertyDisjunctiveArray.find(element => element instanceof ValueModel)) {
                    return true;
                }
                return Boolean(this.findSelfSufficientInterfaceModel(propertyDisjunctiveArray));
            } else {
                return this.checkPropertiesForSelfSufficiency(propertyModel.type);
            }
        });
    }

    private createSelfSufficientInterfaceModelOutputLines(selfSufficientInterfaceModel: InterfaceModel): Array<string> {
        const lines: Array<string> = [];
        selfSufficientInterfaceModel.properties.forEach(propertyModel => {
            if (propertyModel.type instanceof BinaryExpressionTree) {
                const propertyDisjunctiveArray = this.createDisjunctiveArray(propertyModel.type);
                const valueModel = propertyDisjunctiveArray.find(element => element instanceof ValueModel);
                if (valueModel) {
                    lines.push(`'${propertyModel.name}': ${valueModel.toString()},`);
                } else {
                    const nestedSelfSufficientInterfaceModel = this.findSelfSufficientInterfaceModel(propertyDisjunctiveArray) as InterfaceModel;
                    lines.push(...[
                        `'${propertyModel.name}': {`,
                        ...this.createSelfSufficientInterfaceModelOutputLines(nestedSelfSufficientInterfaceModel),
                        `},`
                    ]);
                }
            }
        });
        return lines;
    }

    private classifyDisjunctiveArray(disjunctiveArray: Array<IRegistrableModel | ValueModel>, pathStack: Array<string>): Map<IRegistrableModel | ValueModel, string> {
        const rules = new Map<IRegistrableModel | ValueModel, string>();
        this.classifyInterfacesModels(rules, disjunctiveArray, pathStack);
        return rules;
    }

    private classifyInterfacesModels(
        rules: Map<IRegistrableModel | ValueModel, string>,
        disjunctiveArray: Array<IRegistrableModel | ValueModel>,
        pathStack: Array<string>
    ): void {
        const interfacesModels = disjunctiveArray.filter(element => element instanceof InterfaceModel) as Array<InterfaceModel>;
        interfacesModels.forEach(interfaceModel => {
            const propertiesNames = this.findRequiredPropertiesNames(interfaceModel);
            const otherInterfacesModels = this.relativeComplement(interfacesModels, [interfaceModel]);
            const excludedPropertiesNames = otherInterfacesModels
                .map(anotherInterfaceModel => {
                    const anotherInterfacePropertiesNames = anotherInterfaceModel.properties.map(property => property.name);
                    const excludedPropertiesNames = this.relativeComplement(anotherInterfacePropertiesNames, propertiesNames);
                    return excludedPropertiesNames;
                })
                .flatMap(x => x);
            const excludedUniquePropertiesNames = [...new Set(excludedPropertiesNames).values()];
            const rule = this.createInterfaceRule(propertiesNames, excludedUniquePropertiesNames, pathStack);
            rules.set(interfaceModel, rule);
        });
    }

    private findRequiredPropertiesNames(interfaceModel: InterfaceModel): Array<string> {
        return interfaceModel.properties
            .filter(propertyModel => !this.checkPropertiesForSelfSufficiency([propertyModel]))
            .map(propertyModel => propertyModel.name);
    }

    /**
     * @example
     * ```txt
     * firstSet \ secondSet = {x in firstSet and not in secondSet}
     * ```
     */
    private relativeComplement<T>(firstSet: Array<T>, secondSet: Array<T>): Array<T> {
        return firstSet.filter(x => !secondSet.includes(x));
    }

    private createInterfaceRule(
        requiredPropertiesNames: Array<string>,
        excludedPropertiesNames: Array<string>,
        pathStack: Array<string>
    ): string {
        const required = requiredPropertiesNames
            .map(propertyName => `(${pathStack.join('.')} as { ${propertyName}: unknown }).${propertyName} !== undefined`);
        const excluded = excludedPropertiesNames
            .map(propertyName => `(${pathStack.join('.')} as { ${propertyName}: unknown }).${propertyName} === undefined`);
        return [required, excluded].flatMap(x => x).join(' && ');
    }

    /**
     * Algorithm:
     * 
     * 1. If a property is undefined:
     *  - 1.1 If the disjunctive array contains a value model, use it as the property. GOTO NEXT VALUE
     *  - 1.2 If the disjunctive array contains an interface model, first find a self-sufficient one and use it as the property. GOTO NEXT VALUE
     *  - 1.3 TODO: If the disjunctive array contains an interface model that is not self-sufficient, throw a TYPE ERROR.
     *  - 1.4 TODO: If the disjunctive array contains a type model, throw a TYPE ERROR.
     * 2. If a property is not undefined:
     *  - 2.1 If the disjunctive array contains a type model or a value model that matches the property, then GOTO NEXT VALUE.
     *  - 2.2 If the disjunctive array contains an interface model:
     *     - 2.2.1 Detect the interface by the value (use rules created by classification). CALL 1 FOR THE INTERFACE AND GOTO NEXT VALUE
     * 3. Throw a TYPE ERROR.
     */
    private createInterfaceModelOutputLines(interfaceModel: InterfaceModel, pathStack: Array<string>): Array<string> {
        const lines: Array<string> = [];
        interfaceModel.properties.forEach(property => {
            const propertyPath = [...pathStack, property.name].join('.');
            const disjunctiveArray = this.createDisjunctiveArray(property.type);
            // CASE: 1.1
            const valueModel = disjunctiveArray.find(element => element instanceof ValueModel);
            if (valueModel) {
                lines.push(...[
                    `if (${propertyPath} === undefined) {`,
                    `    ${propertyPath} = ${valueModel.toString()};`,
                    `}`
                ]);
            } else {
                // CASE: 1.2
                const selfSufficientInterfaceModel = this.findSelfSufficientInterfaceModel(disjunctiveArray);
                if (selfSufficientInterfaceModel) {
                    lines.push(...[
                        `if (${propertyPath} === undefined) {`,
                        `    ${propertyPath} = {`,
                        ...this.createSelfSufficientInterfaceModelOutputLines(selfSufficientInterfaceModel),
                        `    };`,
                        `}`
                    ]);
                }
            }
            // CASE: 2.2 PREPARE
            const preparedLines: Array<string> = [];
            const rules = this.classifyDisjunctiveArray(disjunctiveArray, [...pathStack, property.name]);
            const interfacesModels = disjunctiveArray.filter(element => element instanceof InterfaceModel) as Array<InterfaceModel>;
            interfacesModels.forEach(interfaceModel => {
                const rule = rules.get(interfaceModel) as string;
                if (rule) {
                    preparedLines.push(...[
                        `if (${rule}) {`,
                        ...this.createInterfaceModelOutputLines(interfaceModel, [...pathStack, property.name]),
                        `}`
                    ]);
                } else {
                    preparedLines.push(...[
                        ...this.createInterfaceModelOutputLines(interfaceModel, [...pathStack, property.name])
                    ]);
                }
            });
            // CASE: 2.1 && CASE 2.2
            const valuesModelsRules = disjunctiveArray
                .filter(element => element instanceof ValueModel)
                .map(element => `${propertyPath} === ${element.toString()}`);
            const typesModelsRules = (disjunctiveArray
                .filter(element => element instanceof TypeModel) as Array<TypeModel>)
                .map(element => element.rule.replaceAll('value', propertyPath));
            const rule = [...typesModelsRules, ...valuesModelsRules].join(' || ');
            if (rule) {
                lines.push(...[
                    `if (!(${rule})) {`,
                    ...preparedLines,
                    `    throw new TypeError();`,
                    `}`
                ]);
            } else {
                lines.push(...[
                    ...preparedLines
                ]);
            }
        });
        return lines;
    }

    private createValidationMethodOutputLines(propertyModel: PropertyModel, pathStack: Array<string>): Array<string> {
        const lines: Array<string> = [];
        if (pathStack.length === 1) {
            lines.push('const errors: Array<unknown> = [];');
        }
        const disjunctiveArray = this.createDisjunctiveArray(propertyModel.type);
        const propertyPath = pathStack.reduce((acc, val) => `(${acc} as { ${val}: unknown }).${val}`);
        const errors: Array<string> = [];
        disjunctiveArray.forEach(element => {
            if (element instanceof InterfaceModel) {
                lines.push(...[
                    `if (typeof ${propertyPath} === 'object' && ${propertyPath} && (${propertyPath} as { constructor: { name: string } }).constructor.name === 'Object') {`
                ]);
                element.properties.forEach(interfaceProperty => {
                    lines.push(...this.createValidationMethodOutputLines(interfaceProperty, [...pathStack, interfaceProperty.name]));
                });
                lines.push('} else {');
                errors.push(`{ description: 'is_object' }`);
            }
            if (element instanceof ValueModel) {
                lines.push(`if (${propertyPath} !== ${element.toString()}) {`);
                errors.push(`{ description: 'value_mismatch' }`);
            }
            if (element instanceof TypeModel) {
                lines.push(`if (!(${element.rule.replaceAll('value', propertyPath)})) {`);
                errors.push(`{ description: '${element.description}' }`);
            }
        });
        errors.forEach(error => lines.push(`errors.push(${error});`));
        disjunctiveArray.forEach(() => lines.push('}'));
        if (pathStack.length === 1) {
            lines.push('return errors;');
        }
        return lines;
    }

}
