#! /usr/bin/env node

import * as ts from "typescript";
import {writeFileSync} from "fs";

if (process.argv.length < 3) {
    throw new Error("Cannot initialize without path to ts file containing the Config type.")
}

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

const configType = extractTypeSignature(process.argv[2], 'Config');

let fileContents = "";
Object.keys(configType).forEach((key) => {
    fileContents += `${key}=<${configType[key]}>\n`
})
fileContents += "\n"

writeFileSync('./.env', fileContents);

