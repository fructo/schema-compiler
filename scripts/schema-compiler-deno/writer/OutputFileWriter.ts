'use strict';

export class OutputFileWriter {

    /**
     * Writes the source code to an output file.
     */
    public async writeSourceCode(sourceCode: Array<string>): Promise<void> {
        const outputFilePath = this.findOuputFilePath();
        await Deno.writeTextFile(outputFilePath, '');
        for (const line of sourceCode) {
            await Deno.writeTextFile(outputFilePath, `${line}\n`, { append: true });
        }
    }

    /**
     * Finds a file path in the arguments.
     */
    private findOuputFilePath(): string {
        const index = Deno.args.findIndex((arg => arg === '--outFile'));
        if (index === -1) {
            throw new Error('Please, use --outFile to specify the output file.');
        }
        return Deno.args[index + 1];
    }

}
