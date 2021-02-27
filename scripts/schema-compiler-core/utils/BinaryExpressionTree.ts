'use strict';

class Node<T> {

    public leftNode?: Node<T>;
    public rightNode?: Node<T>;

    constructor(
        public value: T
    ) { }

}


export class BinaryExpressionTree {

    constructor(
        private readonly rootNode: Node<unknown>
    ) { }

    public static fromExpression(expression: string): BinaryExpressionTree {
        const rootNode = this.createExpressionTree(expression);
        return new BinaryExpressionTree(rootNode);
    }

    public static fromValue(value: unknown): BinaryExpressionTree {
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
    private static createExpressionTree(expression: string): Node<string> {
        let scopes = this.findLastSpecificOperatorInScope('|', expression);
        if (scopes) {
            const [rightScope, leftScope] = scopes;
            const orNode = new Node('|');
            orNode.rightNode = this.createExpressionTree(rightScope);
            orNode.leftNode = this.createExpressionTree(leftScope);
            return orNode;
        }
        scopes = this.findLastSpecificOperatorInScope('&', expression);
        if (scopes) {
            const [rightScope, leftScope] = scopes;
            const andNode = new Node('&');
            andNode.rightNode = this.createExpressionTree(rightScope);
            andNode.leftNode = this.createExpressionTree(leftScope);
            return andNode;
        }
        const valueNode = new Node(expression.trim());
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

    public mapValues(mapFunction: (value: unknown) => unknown): BinaryExpressionTree {
        this.mapValuesRecursively(this.rootNode, mapFunction);
        return this;
    }

    private mapValuesRecursively(node: Node<unknown>, mapFunction: (value: unknown) => unknown) {
        if (node.leftNode) {
            this.mapValuesRecursively(node.leftNode, mapFunction);
        }
        if (node.rightNode) {
            this.mapValuesRecursively(node.rightNode, mapFunction);
        }
        if (node.value !== '&' && node.value !== '|') {
            node.value = mapFunction(node.value);
        }
    }

}
