import solc from 'solc';

/**
 * Interface for key-value pairs used for placeholder replacement in templates.
 * The key is the placeholder string (e.g., "%%TOKEN_NAME%%"), and the value is its replacement.
 */
export interface PlaceholderValues {
  [key: string]: string | number;
}

/**
 * Interface for the result of a successful Solidity compilation.
 */
export interface CompilationResult {
  /** The contract's Application Binary Interface (ABI) as an array. */
  abi: any[];
  /** The compiled bytecode of the contract, prefixed with '0x'. */
  bytecode: string;
}

/**
 * Service class responsible for processing Solidity templates and compiling them.
 */
export class GeneratorService {
  constructor() {
    // Constructor can be used for future configurations or dependency injections.
  }

  /**
   * Replaces placeholders in a Solidity template string with provided values.
   * @param templateString The raw Solidity template string containing placeholders.
   * @param placeholderValues An object where keys are placeholders (e.g., "%%NAME%%")
   *                          and values are their replacements.
   * @returns The Solidity code string with all placeholders replaced.
   */
  private _replacePlaceholders(
    templateString: string,
    placeholderValues: PlaceholderValues
  ): string {
    let processedString = templateString;
    for (const placeholder in placeholderValues) {
      // Using a RegExp for global replacement of each placeholder.
      // Special characters in the placeholder key are escaped to ensure they are treated literally.
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\]/g, '\\$&'), 'g');
      processedString = processedString.replace(regex, String(placeholderValues[placeholder]));
    }
    return processedString;
  }

  /**
   * Compiles a Solidity template string after replacing placeholders.
   * @param templateString The raw Solidity template string.
   * @param placeholderValues Values to replace placeholders in the template.
   * @param contractName The name of the specific contract within the Solidity code to compile.
   * @returns A Promise resolving to a CompilationResult containing the ABI and bytecode.
   * @throws Error if compilation fails or if the specified contract is not found.
   */
  public async compile(
    templateString: string,
    placeholderValues: PlaceholderValues,
    contractName: string
  ): Promise<CompilationResult> {
    const processedSolidityCode = this._replacePlaceholders(templateString, placeholderValues);

    const compilerInput = {
      language: 'Solidity',
      sources: {
        'Contract.sol': { // Using a generic filename, as solc expects a file structure
          content: processedSolidityCode,
        },
      },
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode.object'],
          },
        },
      },
    };

    const outputString = solc.compile(JSON.stringify(compilerInput));
    const output = JSON.parse(outputString);

    if (output.errors) {
      const errorMessages = output.errors
        .filter((err: any) => err.severity === 'error')
        .map((err: any) => err.formattedMessage || err.message)
        .join('\n');
      if (errorMessages.length > 0) {
        throw new Error(`Solidity compilation failed:\n${errorMessages}`);
      }
    }

    const compiledContract = output.contracts?.['Contract.sol']?.[contractName];

    if (!compiledContract || !compiledContract.abi || !compiledContract.evm?.bytecode?.object) {
      let specificError = `Contract '${contractName}' not found in compiler output or missing ABI/Bytecode.`;
      if (!compiledContract) {
          specificError = `Contract with name '${contractName}' not found in compiled output. Available contracts from compilation: ${Object.keys(output.contracts?.['Contract.sol'] || {}).join(', ')}. Ensure the 'contractName' parameter matches a contract in your template.`;
      } else if (!compiledContract.abi) {
          specificError = `ABI not found for contract '${contractName}'.`;
      } else if (!compiledContract.evm?.bytecode?.object) {
          specificError = `Bytecode not found for contract '${contractName}'.`;
      }
      throw new Error(specificError);
    }

    return {
      abi: compiledContract.abi,
      bytecode: '0x' + compiledContract.evm.bytecode.object,
    };
  }
}
