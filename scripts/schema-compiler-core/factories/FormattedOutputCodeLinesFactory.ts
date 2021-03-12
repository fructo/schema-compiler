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
            const noSpacesLine = line.slice(line.split('').findIndex(char => char !== ' '));
            if (/^[})]/.test(noSpacesLine)) {
                bracketsCount--;
            }
            const spacesCount = 4 * bracketsCount;
            lines[i] = `${' '.repeat(spacesCount)}${noSpacesLine}`;
            if (/[{(]$/.test(line)) {
                bracketsCount++;
            }
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
