'use strict';

export interface ITreeElement {

    toString(): string;

    clone(): ITreeElement;

}


class Node<T> {

    public leftNode?: Node<T>;
    public rightNode?: Node<T>;

    constructor(
        public value: T
    ) { }

}


abstract class Operator implements ITreeElement {

    public static readonly CHARACTER: string;

    /**
     * @override
     */
    public clone(): Operator {
        return new (this.constructor as { new(): Operator });
    }

    /**
     * @override
     */
    public toString(): string {
        return (this.constructor as unknown as { CHARACTER: string }).CHARACTER;
    }

}


class AndOperator extends Operator {

    public static readonly CHARACTER = '&';

}


class OrOperator extends Operator {

    public static readonly CHARACTER = '|';

}


export class BinaryExpressionTree<T extends ITreeElement> {

    constructor(
        private readonly rootNode: Node<T>
    ) { }

    public static fromExpression<T extends ITreeElement>(expression: string, valueMapper: (value: string) => T): BinaryExpressionTree<T> {
        const rootNode = this.createExpressionTree(expression, valueMapper);
        return new BinaryExpressionTree(rootNode) as BinaryExpressionTree<T>;
    }

    public static fromValue<T extends ITreeElement>(value: T): BinaryExpressionTree<T> {
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
    private static createExpressionTree<T extends ITreeElement>(expression: string, valueMapper: (value: string) => T): Node<T | Operator> {
        let scopes = this.findLastSpecificOperatorInScope(OrOperator.CHARACTER, expression);
        if (scopes) {
            const [rightScope, leftScope] = scopes;
            const orNode = new Node(new OrOperator());
            orNode.rightNode = this.createExpressionTree(rightScope, valueMapper);
            orNode.leftNode = this.createExpressionTree(leftScope, valueMapper);
            return orNode;
        }
        scopes = this.findLastSpecificOperatorInScope(AndOperator.CHARACTER, expression);
        if (scopes) {
            const [rightScope, leftScope] = scopes;
            const andNode = new Node(new AndOperator());
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

    /**
     * @override
     */
    public map<V extends ITreeElement>(mapFunction: (value: T) => V): BinaryExpressionTree<V> {
        const clonedTree = this.clone();
        this.mapValuesRecursively(clonedTree.rootNode, mapFunction);
        return clonedTree as unknown as BinaryExpressionTree<V>;
    }

    private mapValuesRecursively<V>(node: Node<V | T>, mapFunction: (value: T) => V): void {
        if (node.leftNode) {
            this.mapValuesRecursively(node.leftNode, mapFunction);
        }
        if (node.rightNode) {
            this.mapValuesRecursively(node.rightNode, mapFunction);
        }
        if (!(node.value instanceof Operator)) {
            node.value = mapFunction(node.value as T);
        }
    }

    /**
     * @example
     * ```txt
     *      AND
     *     /  \
     *    OR   C
     *   / \
     *  A   B
     * 
     * First iteration: [A, B]
     * Second iteration: [C]
     * Third iteration: [A, B] AND [C] = [AC, BC]
     * ```
     */
    public toDisjunctiveArray(conjunction: (leftElement: T, rightElement: T) => T): Array<T> {
        return this.toDisjunctiveArrayRecursively(this.rootNode, conjunction);
    }

    private toDisjunctiveArrayRecursively(
        node: Node<T>,
        conjunction: (leftElement: T, rightElement: T) => T
    ): Array<T> {
        const leftArray = node.leftNode ? this.toDisjunctiveArrayRecursively(node.leftNode, conjunction) : [];
        const rightArray = node.rightNode ? this.toDisjunctiveArrayRecursively(node.rightNode, conjunction) : [];
        if (node.value instanceof AndOperator) {
            if (leftArray.length >= rightArray.length) {
                return leftArray
                    .map(leftValue => rightArray.map(rightValue => conjunction(leftValue, rightValue)))
                    .flatMap(x => x);
            } else {
                return rightArray
                    .map(rightValue => leftArray.map(leftValue => conjunction(leftValue, rightValue)))
                    .flatMap(x => x);
            }
        }
        if (node.value instanceof OrOperator) {
            return [...leftArray, ...rightArray];
        }
        return [node.value];
    }

    /**
     * @override
     */
    public toString(): string {
        return this.toStringRecursively(this.rootNode);
    }

    public toStringRecursively(node: Node<T>): string {
        const leftValue = node.leftNode ? this.toStringRecursively(node.leftNode) : '';
        const rightValue = node.rightNode ? this.toStringRecursively(node.rightNode) : '';
        const value = node.value.toString();
        return leftValue && rightValue ? `(${leftValue} ${value} ${rightValue})` : value;
    }

    /**
     * @override
     */
    public clone(): BinaryExpressionTree<T> {
        const rootNode = this.cloneRecursively(this.rootNode);
        return new BinaryExpressionTree(rootNode);
    }

    public cloneRecursively(node: Node<T>): Node<T> {
        const leftNode = node.leftNode ? this.cloneRecursively(node.leftNode) : undefined;
        const rightNode = node.rightNode ? this.cloneRecursively(node.rightNode) : undefined;
        const copy = new Node(node.value.clone() as T);
        copy.leftNode = leftNode;
        copy.rightNode = rightNode;
        return copy;
    }

}
