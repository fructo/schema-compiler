'use strict';

class Node<T> {

    public leftNode?: Node<T>;
    public rightNode?: Node<T>;

    constructor(
        public value: T
    ) { }

}


export class BinaryExpressionTree {

    private readonly rootNode: Node<string>;

    constructor(expression: string) {
        this.rootNode = BinaryExpressionTree.createExpressionTree(expression);
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

}
