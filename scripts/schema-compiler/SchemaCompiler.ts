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

    constructor(
        protected readonly registry: BuildRegistry,
        protected readonly entityName: string,
        protected readonly entityBody: IEntityBody
    ) { }

    /**
     * Constructs TypeScript lines.
     */
    public abstract build(): Array<string>;

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
    public build(): Array<string> {
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
    public build(): Array<string> {
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
            '}'
        ];
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
