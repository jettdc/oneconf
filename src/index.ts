import * as ts from "typescript";
import * as dotenv from "dotenv";

function recurseType(type: ts.Type, typeChecker: ts.TypeChecker, statement: ts.Statement, currentPath: string, completed: {[key: string]: string}): any {
        for (const prop of type.getProperties()) {
            const name: string = prop.getName();
            const propType: ts.Type = typeChecker.getTypeOfSymbolAtLocation(prop, statement);

            if (propType.getSymbol()?.getName() === "__type") {
                recurseType(propType, typeChecker, statement, `${currentPath}${currentPath.length === 0 ? "" : "."}${name.replace(/([a-z](?=[A-Z]))/g, '$1_').toUpperCase()}`, completed);
            } else {
                const type = typeChecker.typeToString(typeChecker.getTypeOfSymbolAtLocation(prop, statement))
                completed[(`${currentPath}${currentPath.length === 0 ? "" : "."}${name.replace(/([a-z](?=[A-Z]))/g, '$1_').toUpperCase()}`)] = type;
            }
        }
}

function extractTypeSignature(filename: string, aliasName: string): {[key: string]: string} {

    const program: ts.Program = ts.createProgram([ filename ], { emitDeclarationOnly: true });
    const sourceFile: ts.SourceFile = program.getSourceFile(filename)!;
    const typeChecker: ts.TypeChecker = program.getTypeChecker();
    // Get the declaration node you're looking for by it's type name.
    // This condition can be adjusted to your needs
    const statement: ts.Statement | undefined = sourceFile.statements.find(
        (s) => ts.isTypeAliasDeclaration(s) && s.name.text === aliasName
    );
    if (!statement) {
        throw new Error(`Type: '${aliasName}' not found in file: '${filename}'`);
    }
    const type: ts.Type = typeChecker.getTypeAtLocation(statement);
    const fields: string[] = [];
    // Iterate over the `ts.Symbol`s representing Property Nodes of `ts.Type`

    const completed: {[key: string]: string} = {}
    recurseType(type, typeChecker, statement, ``, completed)
    return completed

}

function camelCase(str: string) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index)
    {
        return index == 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
}
function attemptTypeConvert(key: string, propType: string): number | boolean {
    const prop = process.env[key]!;
    switch (propType) {
        case 'boolean':
            if (prop.toLowerCase() === "true") {
                return true
            } else if (prop.toLowerCase() === "false") {
                return false;
            } else {
                throw new Error(`Invalid property value for boolean variable ${key}.`)
            }
            break;
        case 'number':
            const parsed = prop.indexOf(".") === -1 ? parseInt(prop) : parseFloat(prop)
            if (isNaN(parsed)) {
                throw new Error(`Invalid property value for number variable ${key}.`)
            }
            return parsed;
        default:
            throw new Error(`Unsupported environment variable type for ${key}: ${propType}`)
    }
}
export function loadConfig<T>(path: string): T {
    const typeBSignature = extractTypeSignature(path, "Config");
    dotenv.config()
    const config: any = {};
    Object.keys(typeBSignature).forEach((key) => {
        if (!process.env[key]) {
            throw new Error(`Missing required environment variable: ${key}=<${typeBSignature[key]}>`)
        }
        const broken = key.split(".").map((k) => camelCase(k.toLowerCase().replace("_", " ")));
        let ptr = config
        broken.forEach((level, i) => {
            if (i === broken.length - 1) {
                ptr[level] = typeBSignature[key] !== 'string' ? attemptTypeConvert(key, typeBSignature[key]) : process.env[key]
            }else {
                if (!ptr[level]) {
                    ptr[level] = {}
                }
                ptr = ptr[level]
            }
        })

    })
    return config as T;
}