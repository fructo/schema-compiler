'use strict';

export class FormattedOutputCodeLinesFactory {

    public static createFormattedOutputCodeLines(
        outputCodeLines: Array<string>
    ): void {
        this.addIndents(outputCodeLines);
        this.removeEmptyLines(outputCodeLines);
    }

    /**
     * Adds indents to the beginning of lines.
     * 
     * @param lines - An array of TypeScript lines.
     */
    private static addIndents(lines: Array<string>): void {
        let bracketsCount = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineBracketsCount = (line.split('{').length - 1) - (line.split('}').length - 1);
            if (lineBracketsCount < 0) {
                bracketsCount--;
            }
            const actualCount = Math.max(0, line.split('').findIndex(char => char !== ' '));
            const requiredCount = Math.max(0, 4 * bracketsCount - (actualCount - actualCount % 2));
            if (lineBracketsCount > 0) {
                bracketsCount++;
            }
            lines[i] = `${' '.repeat(requiredCount)}${line}`;
        }
    }

    /**
     * Removes empty lines from the code.
     * 
     * @param lines - An array of TypeScript lines.
     */
    private static removeEmptyLines(lines: Array<string>): void {
        for (let i = 0; i < lines.length; i++) {
            if (/^ *$/.test(lines[i])) {
                lines.splice(i, 1);
            }
        }
    }

}
