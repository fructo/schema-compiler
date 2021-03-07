'use strict';

class Node<T> {

    public leftNode?: Node<T>;
    public rightNode?: Node<T>;

    constructor(
        public value: T
    ) { }

}


export class BinaryExpressionTree<T> {

    constructor(
        private readonly rootNode: Node<T | string>
    ) { }

    public static fromExpression<T>(expression: string, valueMapper: (value: string) => T): BinaryExpressionTree<T> {
        const rootNode = this.createExpressionTree(expression, valueMapper);
        return new BinaryExpressionTree<T>(rootNode);
    }

    public static fromValue<T>(value: T): BinaryExpressionTree<T> {
        const rootNode = new Node(value);
        return new BinaryExpressionTree(rootNode);
    }

    /**
     * The algorithm:
     * 1. Find the last OR in a scope
     *     If found:
     *       create OR node:
     *          left node = GOTO 1 with the left side of the scope
     *          right node = GOTO 1 with the right side of the scope
     * 2. Find the last AND in a scope
     *      If found:
     *        create AND node:
     *           left node = GOTO 1 with the left side of the scope
     *           right node = GOTO 1 with the right side of the scope
     *      Else:
     *         create VALUE node
     *
     * @example
     * ```txt
     * ((A or B) and C and D) or F and E
     * 
     *                   OR
     *                 /    \
     *              AND      AND
     *             /  \     /  \
     *          AND    D   F    E
     *         /  \
     *       OR    C
     *      / \
     *     A   B
     * ```
     */
    private static createExpressionTree<T>(expression: string, valueMapper: (value: string) => T): Node<T | string> {
        let scopes = this.findLastSpecificOperatorInScope('|', expression);
        if (scopes) {
            const [rightScope, leftScope] = scopes;
            const orNode = new Node<T | string>('|');
            orNode.rightNode = this.createExpressionTree(rightScope, valueMapper);
            orNode.leftNode = this.createExpressionTree(leftScope, valueMapper);
            return orNode;
        }
        scopes = this.findLastSpecificOperatorInScope('&', expression);
        if (scopes) {
            const [rightScope, leftScope] = scopes;
            const andNode = new Node<T | string>('&');
            andNode.rightNode = this.createExpressionTree(rightScope, valueMapper);
            andNode.leftNode = this.createExpressionTree(leftScope, valueMapper);
            return andNode;
        }
        const valueAsString = expression.replace(/[()]/g, '').trim();
        const value = valueMapper(valueAsString);
        const valueNode = new Node(value);
        return valueNode;
    }

    /**
     * Performs a search of a specified last operator in a scope.
     * 
     * @example
     * ```ts
     * findLastSpecificOperatorInScope('&', 'A & B & C | D') // => ['A & B', 'C | D']
     * findLastSpecificOperatorInScope('&', 'A & (B & C) | D') // => ['A', '(B & C) | D']
     * ```
     * @param operatorChar - A character of an operator to seek.
     * @param scope - A scope in which the search is to be performed.
     * @returns Undefined if the specified operator does not exist in the scope. A tuple of right and left scopes otherwise.
     */
    private static findLastSpecificOperatorInScope(operatorChar: '&' | '|', scope: string): [string, string] | undefined {
        const chars = scope.split('');
        let minimalBracketsCount = Number.MAX_SAFE_INTEGER;
        let openBracketsCount = 0;
        let operatorIndex: number | undefined;
        for (let i = 0; i < chars.length; i++) {
            switch (chars[i]) {
                case '(':
                    openBracketsCount++;
                    break;
                case ')':
                    openBracketsCount--;
                    break;
                case '|':
                case '&':
                    if (openBracketsCount < minimalBracketsCount) {
                        minimalBracketsCount = openBracketsCount;
                        operatorIndex = chars[i] === operatorChar ? i : undefined;
                    }
                    if (openBracketsCount === minimalBracketsCount) {
                        operatorIndex = chars[i] === operatorChar ? i : operatorIndex;
                    }
            }
        }
        return operatorIndex ? [scope.slice(0, operatorIndex).trim(), scope.slice(operatorIndex + 1).trim()] : undefined;
    }

    public mapValues<V>(mapFunction: (value: T) => V): BinaryExpressionTree<V | string> {
        this.mapValuesRecursively(this.rootNode, mapFunction);
        return this as unknown as BinaryExpressionTree<V | string>;
    }

    private mapValuesRecursively<V>(node: Node<V | T | string>, mapFunction: (value: T) => V): void {
        if (node.leftNode) {
            this.mapValuesRecursively(node.leftNode, mapFunction);
        }
        if (node.rightNode) {
            this.mapValuesRecursively(node.rightNode, mapFunction);
        }
        if (node.value !== '&' && node.value !== '|') {
            node.value = mapFunction(node.value as T);
        }
    }

    public toString(valueConverter: (value: unknown) => string): string {
        return this.toStringRecursively(this.rootNode, valueConverter);
    }

    private toStringRecursively(node: Node<unknown>, valueConverter: (value: unknown) => string): string {
        const leftValue = node.leftNode ? this.toStringRecursively(node.leftNode, valueConverter) : '';
        const rightValue = node.rightNode ? this.toStringRecursively(node.rightNode, valueConverter) : '';
        const value = (node.value === '&' || node.value === '|') ? node.value : valueConverter(node.value);
        return leftValue && rightValue ? `(${leftValue} ${value} ${rightValue})` : value;
    }

    public clone(): BinaryExpressionTree<T> {
        const rootNode = this.cloneRecursively(this.rootNode);
        return new BinaryExpressionTree(rootNode);
    }

    public cloneRecursively(node: Node<T | string>): Node<T | string> {
        const leftNode = node.leftNode ? this.cloneRecursively(node.leftNode) : undefined;
        const rightNode = node.rightNode ? this.cloneRecursively(node.rightNode) : undefined;
        const copy = new Node(node.value);
        copy.leftNode = leftNode;
        copy.rightNode = rightNode;
        return copy;
    }

}
