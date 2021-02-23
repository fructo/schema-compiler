'use strict';

import { IEntityBody } from '../schema/IEntityBody.js';
import { IPropertyBody } from '../schema/IPropertyBody.js';
import { TDeepMutable, CompilationRegistry } from '../registry/CompilationRegistry.js';


/**
 * @sealed
 */
export abstract class MergedInterfacesEntitiesFactory {

    /**
     * Creates and registers a new entity of an interface merged with its ancestors.
     * 
     * Merged interface creation algorithm:
     * - Rename original name (create a name for a merged interface).
     * - Rename nested properties (make references to merged interfaces).
     * - Inject properties from ancestors.
     * - Make a property optional if a default value exists.
     * - Remove ancestors to avoid conflicts because of optional values.
     * 
     * @param compilationRegistry - The compilation registry. Used to register a new merged interface.
     * @param originalEntityName - A name of an original entity for which a new merged interface should be created.
     * @param originalEntityBodyDeepMutable - Deeply copied body of an original entity. Can be safely modified without any risks.
     */
    public static createMergedInterfaceEntity(
        compilationRegistry: CompilationRegistry,
        originalEntityName: string,
        originalEntityBodyDeepMutable: TDeepMutable<IEntityBody>
    ): void {
        if (originalEntityBodyDeepMutable.types.includes('interface')) {
            const mergedInterfaceName = this.createMergedInterfaceName(originalEntityName);
            this.renameNestedProperties(compilationRegistry, originalEntityBodyDeepMutable);
            this.injectPropertiesFromAncestors(compilationRegistry, originalEntityBodyDeepMutable);
            this.makePropertiesWithDefaultValueOptional(originalEntityBodyDeepMutable);
            this.removeAncestors(originalEntityBodyDeepMutable);
            compilationRegistry.registerEntitySilently(mergedInterfaceName, originalEntityBodyDeepMutable);
        }
    }

    /**
     * Creates a name for a merged interface based on another entity name.
     * 
     * @param originalEntityName - A name of an original entity for which a new name should be created.
     * @returns A name for a merged interface based on the original entity name.
     */
    public static createMergedInterfaceName(originalEntityName: string): string {
        return `${originalEntityName}Merged`;
    }

    /**
     * If one of the properties uses an interface as a type, the interface will be replaced with a corresponding merged interface.
     * 
     * This substitution is necessary because nested properties can have default values.
     * If the original interface is used, properties with default values will stay required.
     * 
     * TODO: Handle the properties defined as an array.
     * 
     * @param compilationRegistry - The compilation registry. Used to check if a type is an interface.
     * @param mergedInterfaceEntityBody - Body of a merged interface entity. The body will be modified.
     */
    private static renameNestedProperties(
        compilationRegistry: CompilationRegistry,
        { properties }: TDeepMutable<IEntityBody>
    ): void {
        if (properties?.constructor.name === 'Object') {
            Object
                .entries(properties as TDeepMutable<Record<string, IPropertyBody>>)
                .forEach(([, propertyBody]) => {
                    propertyBody.types = propertyBody.types?.map(intersection => intersection.map(typeName => {
                        const mergedInterfaceName = this.createMergedInterfaceName(typeName);
                        return compilationRegistry.hasEntity(mergedInterfaceName) ? mergedInterfaceName : typeName;
                    }));
                });
        } else {
            console.log(`WARNING: MERGE: RENAME: An entity defines properties not as an object, ignoring.`);
        }
    }

    /**
     * Takes all ancestors and injects their properties into a merged interface entity.
     * 
     * @param compilationRegistry - The compilation registry. Used to retrieve merged interfaces of ancestors.
     * @param mergedInterfaceEntityBody - Body of a merged interface entity. The body will be modified.
     */
    private static injectPropertiesFromAncestors(
        compilationRegistry: CompilationRegistry,
        mergedInterfaceEntityBody: TDeepMutable<IEntityBody>
    ): void {
        if (mergedInterfaceEntityBody.properties?.constructor.name === 'Object') {
            mergedInterfaceEntityBody.inherits?.forEach(ancestorName => {
                const mergedAncestorName = this.createMergedInterfaceName(ancestorName);
                const mergedAncestorEntityBody = compilationRegistry.getEntityBody(mergedAncestorName);
                const typedMergedAncestorProperties = mergedAncestorEntityBody.properties as Readonly<Record<string, IPropertyBody>>;
                this.injectAncestorPropertiesIntoChild(typedMergedAncestorProperties, mergedInterfaceEntityBody);
            });
        } else {
            console.log(`WARNING: MERGE: INJECT: An entity defines properties not as an object, ignoring.`);
        }
    }

    /**
     * Injects all properties of an ancestor into its child.
     * 
     * @param ancestorProperties - The properties of a merged interface ancestor.
     * @param mergedInterfaceEntityBody - Body of a merged interface entity. The body will be modified.
     */
    private static injectAncestorPropertiesIntoChild(
        ancestorProperties: Record<string, IPropertyBody>,
        mergedInterfaceEntityBody: TDeepMutable<IEntityBody>
    ): void {
        const typedChildProperties = mergedInterfaceEntityBody.properties as Record<string, IPropertyBody>;
        Object.entries(ancestorProperties).forEach(([ancestorPropertyName, ancestorPropertyBody]) => {
            if (ancestorPropertyName in typedChildProperties) {
                const childPropertyBody = typedChildProperties[ancestorPropertyName];
                typedChildProperties[ancestorPropertyName] = {
                    ...ancestorPropertyBody,
                    ...childPropertyBody,
                    keywords: [...new Set([...ancestorPropertyBody.keywords || [], ...childPropertyBody.keywords || []])],
                };
            } else {
                typedChildProperties[ancestorPropertyName] = ancestorPropertyBody;
            }
        });
    }

    /**
     * If a property has a default value, it should be marked as optional.
     * 
     * @param mergedInterfaceEntityBody - Body of a merged interface entity. The body will be modified.
     */
    private static makePropertiesWithDefaultValueOptional({ properties }: TDeepMutable<IEntityBody>) {
        if (properties?.constructor.name === 'Object') {
            const typedProperties = properties as TDeepMutable<Record<string, IPropertyBody>>;
            Object.values(typedProperties).forEach(propertyBody => {
                if ('default' in propertyBody) {
                    propertyBody.keywords = [...propertyBody.keywords || [], 'optional'];
                }
            });
        } else {
            console.log(`WARNING: MERGE: DEFAULTS: An entity defines properties not as an object, ignoring.`);
        }
    }

    /**
     * Remove ancestors to avoid conflicts because of optional values.
     * 
     * @param mergedInterfaceEntityBody - Body of a merged interface entity. The body will be modified.
     */
    private static removeAncestors(mergedInterfaceEntityBody: TDeepMutable<IEntityBody>) {
        mergedInterfaceEntityBody.inherits = undefined;
    }

}
