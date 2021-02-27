'use strict';

/**
 * @sealed
 */
export abstract class TypeUtil {

    /**
     * Returns true if an object is an array.
     * 
     * @param obj - An object to be checked.
     */
    public static isArray(obj: unknown): boolean {
        return typeof obj === 'object' && obj !== null && obj.constructor.name === 'Array';
    }

    /**
     * Returns true if an object is a dictionary.
     * 
     * @param obj - An object to be checked.
     */
    public static isDictionary(obj: unknown): boolean {
        return typeof obj === 'object' && obj !== null && obj.constructor.name === 'Object';
    }

}
