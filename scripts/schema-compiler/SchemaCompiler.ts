'use strict';

interface IPropertyBody {
    readonly types?: Array<Array<string>>;
    readonly default?: unknown;
    readonly docs?: Array<string>;
    readonly keywords?: Array<'optional' | 'writable'>
    readonly example?: unknown;
}


interface IEntityBody {
    readonly types: Array<'interface' | 'class'>;
    readonly inherits?: Array<string>;
    readonly docs?: Array<string>;
    readonly properties?: Record<string, IPropertyBody> | Array<string>;
}


export interface ISchema {
    [entityName: string]: IEntityBody;
}


abstract class EntityBuilder {

    /**
     * Contains a mix of entity properties and its ancestor properties.
     */
    public mergedProperties?: Record<string, IPropertyBody>;

    public mergedPropertiesSourceCode?: Array<string>;

    constructor(
        protected readonly registry: BuildRegistry,
        public readonly entityName: string,
        protected readonly entityBody: IEntityBody
    ) { }

    /**
     * @returns TypeScript lines.
     */
    public build(): Array<string> {
        this.mergedProperties = this.constructMergedProperties();
        this.mergedPropertiesSourceCode = this.constructMergedPropertiesSourceCode();
        return this._build();
    }

    /**
     * Constructs TypeScript lines.
     */
    public abstract _build(): Array<string>;

    /**
     * Constructs documentation string.
     * 
     * @param docs - An array of documentation rows.
     * @returns TypeScript lines.
     */
    protected constructDocs(docs?: Array<string>): Array<string> {
        return docs && docs.length ? [
            '/**',
            ...docs.map(doc => ` * ${doc}`),
            ' */'
        ] : [];
    }

    /**
     * Merges entity properties with ancestor properties.
     */
    private constructMergedProperties(): Record<string, IPropertyBody> {
        if (this.entityBody.properties && this.entityBody.properties.constructor.name === 'Array') {
            console.log(`WARNING: ${this.entityName} defines properties as an array, ignoring.`);
        }
        if (this.entityBody.properties && this.entityBody.properties.constructor.name === 'Object') {
            let properties = this.entityBody.properties as Record<string, IPropertyBody>;
            this.entityBody.inherits?.map(ancestorName => {
                const ancestorEntityBuilder = this.registry.getEntityBuilder(ancestorName);
                const ancestorProperties = ancestorEntityBuilder.mergedProperties;
                if (ancestorProperties) {
                    properties = this.mergeProperties(ancestorProperties, properties);
                }
            });
            return properties;
        }
        return {};
    }

    /**
     * Merges ancestor and its child properties.
     * 
     * @returns A new object with merged properties.
     */
    private mergeProperties(
        ancestorProperties: Record<string, IPropertyBody>,
        childProperties: Record<string, IPropertyBody>
    ): Record<string, IPropertyBody> {
        const properties: Record<string, IPropertyBody> = {};
        Object.keys(ancestorProperties).forEach(ancestorPropertyName => {
            const ancestorPropertyBody = ancestorProperties[ancestorPropertyName];
            if (ancestorPropertyName in childProperties) {
                const childPropertyBody = childProperties[ancestorPropertyName];
                const mergedPropertyBody: IPropertyBody = {
                    ...ancestorPropertyBody,
                    ...childPropertyBody,
                    keywords: [...new Set([...ancestorPropertyBody.keywords || [], ...childPropertyBody.keywords || []])],
                };
                properties[ancestorPropertyName] = mergedPropertyBody;
            } else {
                properties[ancestorPropertyName] = ancestorPropertyBody;
            }
        });
        Object
            .keys(childProperties)
            .filter(childPropertyName => !(childPropertyName in ancestorProperties))
            .forEach(childPropertyName => properties[childPropertyName] = childProperties[childPropertyName]);
        return properties;
    }

    /**
     * @returns TypeScript lines.
     */
    private constructMergedPropertiesSourceCode(): Array<string> {
        return Object.entries(this.mergedProperties || {})
            .map(([propertyName, propertyBody]) => {
                const docs = this.constructDocs(propertyBody.docs);
                const readonly = propertyBody.keywords?.includes('writable') ? '' : 'readonly ';
                const optional = (propertyBody.keywords?.includes('optional')) || ('default' in propertyBody) ? '?' : '';
                const types = (propertyBody.types?.map(intersection => intersection.join(' & ')).join(' | '))
                    || ('default' in propertyBody ? typeof propertyBody.default : 'unknown');
                return [
                    ...docs,
                    `${readonly}${propertyName}${optional}: ${types};`
                ];
            })
            .flatMap(x => x);
    }

}


class BuildRegistry {

    /**
     * Contains all builders of entities (interfaces, classes).
     */
    private readonly entitiesBuilders: Array<EntityBuilder> = [];

    /**
     * Registers a builder of an entity (interface, class).
     */
    public registerEntityBuilder(entityBuilder: EntityBuilder) {
        this.entitiesBuilders.push(entityBuilder);
    }

    /**
     * Returns an entity builder by its name.
     */
    public getEntityBuilder(entityName: string): EntityBuilder {
        const entityBuilder = this.entitiesBuilders.find((entityBuilder) => entityBuilder.entityName === entityName);
        if (entityBuilder) {
            return entityBuilder;
        }
        throw new TypeError(`Unable to find entity: ${entityName}`);
    }

    /**
     * Constructs TypeScript lines.
     */
    public build(): Array<string> {
        return this.entitiesBuilders
            .map(entityBuilder => entityBuilder.build())
            .flatMap(x => x);
    }

}


class InterfaceBuilder extends EntityBuilder {

    /**
     * @override
     */
    public _build(): Array<string> {
        return this.constructInterfaceSourceCode();
    }

    /**
     * Constructs the interface.
     * 
     * @returns TypeScript lines.
     */
    private constructInterfaceSourceCode(): Array<string> {
        const inherits = this.entityBody.inherits && this.entityBody.inherits.length
            ? `extends ${this.entityBody.inherits.join(', ')} ` : '';
        return [
            ...this.constructDocs(this.entityBody.docs),
            `export interface ${this.entityName} ${inherits}{`,
            ...this.constructPropertiesSourceCode(),
            '}'
        ];
    }

    /**
     * Constructs all properties of an interface.
     * 
     * @remarks
     * If the default value of a property is specified, its type is used.
     * 
     * @returns TypeScript lines.
     */
    private constructPropertiesSourceCode(): Array<string> {
        if (this.entityBody.properties && this.entityBody.properties.constructor.name === 'Object') {
            const typedProperties = this.entityBody.properties as Record<string, IPropertyBody>;
            return Object.entries(typedProperties)
                .map(([propertyName, propertyBody]) => {
                    const docs = this.constructDocs(propertyBody.docs);
                    const readonly = propertyBody.keywords?.includes('writable') ? '' : 'readonly ';
                    const optional = propertyBody.keywords?.includes('optional') ? '?' : '';
                    const types = (propertyBody.types?.map(intersection => intersection.join(' & ')).join(' | '))
                        || ('default' in propertyBody ? typeof propertyBody.default : 'unknown');
                    return [
                        ...docs,
                        `${readonly}${propertyName}${optional}: ${types};`
                    ].map(row => `${' '.repeat(4)}${row}`);
                })
                .flatMap(x => x);
        }
        if (this.entityBody.properties && this.entityBody.properties.constructor.name === 'Array') {
            throw new TypeError(`Currently, an interface cannot define properties as an array: ${this.entityName}.`);
        }
        return [];
    }

}


class ClassBuilder extends EntityBuilder {

    /**
     * @override
     */
    public _build(): Array<string> {
        return this.constructClassSourceCode();
    }

    /**
     * Constructs the interface.
     * 
     * @returns TypeScript lines.
     */
    private constructClassSourceCode(): Array<string> {
        const inherits = this.entityBody.inherits && this.entityBody.inherits.length
            ? `extends ${this.entityBody.inherits.join(', ')} ` : '';
        return [
            ...this.constructDocs(this.entityBody.docs),
            `export class ${this.entityName} ${inherits}{`,
            ...this.constructPropertiesSourceCode(),
            '}'
        ];
    }

    /**
     * Constructs all properties of a class.
     * 
     * @returns TypeScript lines.
     */
    private constructPropertiesSourceCode(): Array<string> {
        if (this.entityBody.properties && this.entityBody.properties.constructor.name === 'Array') {
            const typedProperties = this.entityBody.properties as Array<string>;
            return typedProperties
                .map(interfaceName => {
                    const propertyName = interfaceName.split(/(?=[A-Z])/).join('_').toUpperCase();
                    const interfaceEntityBuilder = this.registry.getEntityBuilder(interfaceName);
                    const propertiesSourceCode = interfaceEntityBuilder.mergedPropertiesSourceCode || [];
                    const defaultValues = Object.entries(interfaceEntityBuilder.mergedProperties || {})
                        .filter(([, propertyBody]) => 'default' in propertyBody)
                        .map(([propertyName, propertyBody]) => [propertyName, propertyBody.default]);
                    const defaultValuesSourceCode = (defaultValues as Array<[string, unknown]>).map(([propertyName, defaultValue]) =>
                        `${propertyName}: ${JSON.stringify(defaultValue)},`
                    );
                    const createMethodBodySourceCode = [
                        `return {`,
                        ...defaultValuesSourceCode.map(row => `${' '.repeat(4)}${row}`),
                        `    ...properties`,
                        `};`
                    ];
                    return [
                        `public static readonly ${propertyName} = {`,
                        `    create(properties: {`,
                        ...propertiesSourceCode.map(row => `${' '.repeat(4 * 2)}${row}`),
                        `    }): ${interfaceName} {`,
                        ...createMethodBodySourceCode.map(row => `${' '.repeat(4 * 2)}${row}`),
                        `    },`,
                        `    validate(value: unknown): void {`,
                        `        `,
                        `    }`,
                        `}`
                    ].map(row => `${' '.repeat(4)}${row}`);
                })
                .flatMap(x => x);
        }
        if (this.entityBody.properties && this.entityBody.properties.constructor.name === 'Object') {
            throw new TypeError(`Currently, a class cannot define properties as an object: ${this.entityName}.`);
        }
        return [];
    }

}


export class SchemaCompiler {

    /**
     * Compiles a schema into TypeScript.
     * 
     * @returns An array of TypeScript lines.
     */
    public compileSchema(schema: ISchema): Array<string> {
        const buildRegistry = new BuildRegistry();
        Object.entries(schema).forEach(([entityName, entityBody]) => {
            if (entityBody.types.includes('interface')) {
                buildRegistry.registerEntityBuilder(new InterfaceBuilder(buildRegistry, entityName, entityBody));
            }
            if (entityBody.types.includes('class')) {
                buildRegistry.registerEntityBuilder(new ClassBuilder(buildRegistry, entityName, entityBody));
            }
        });
        return buildRegistry.build();
    }

}
