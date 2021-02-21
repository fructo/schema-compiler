'use strict';


export class SourceCodeFormatter {

    /**
     * Beautifies the code.
     * 
     * @param lines - An array of TypeScript lines.
     */
    public formatLines(lines: Array<string>): Array<string> {
        let formattedCode = this.addIndents(lines);
        formattedCode = this.removeEmtpyLines(formattedCode);
        return formattedCode;
    }

    /**
     * Adds indents to the beginning of lines.
     * 
     * @param lines - An array of TypeScript lines.
     */
    private addIndents(lines: Array<string>): Array<string> {
        let bracketsCount = 0;
        return lines.map(line => {
            if (/}[,;]{0,1}$/.test(line)) {
                bracketsCount--;
            }
            const actualCount = Math.max(0, line.split('').findIndex(char => char !== ' '));
            const requiredCount = Math.max(0, 4 * bracketsCount - (actualCount - actualCount % 2));
            if (line.endsWith('{')) {
                bracketsCount++;
            }
            return `${' '.repeat(requiredCount)}${line}`;
        });
    }

    /**
     * Removes empty lines from the code.
     * 
     * @param lines - An array of TypeScript lines.
     */
    private removeEmtpyLines(lines: Array<string>): Array<string> {
        return lines.filter(line => !/^ *$/.test(line));
    }

}
