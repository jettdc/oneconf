"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = void 0;
const ts = __importStar(require("typescript"));
const dotenv = __importStar(require("dotenv"));
function recurseType(type, typeChecker, statement, currentPath, completed) {
    var _a;
    for (const prop of type.getProperties()) {
        const name = prop.getName();
        const propType = typeChecker.getTypeOfSymbolAtLocation(prop, statement);
        if (((_a = propType.getSymbol()) === null || _a === void 0 ? void 0 : _a.getName()) === "__type") {
            recurseType(propType, typeChecker, statement, `${currentPath}${currentPath.length === 0 ? "" : "."}${name.replace(/([a-z](?=[A-Z]))/g, '$1_').toUpperCase()}`, completed);
        }
        else {
            const type = typeChecker.typeToString(typeChecker.getTypeOfSymbolAtLocation(prop, statement));
            completed[(`${currentPath}${currentPath.length === 0 ? "" : "."}${name.replace(/([a-z](?=[A-Z]))/g, '$1_').toUpperCase()}`)] = type;
        }
    }
}
function extractTypeSignature(filename, aliasName) {
    const program = ts.createProgram([filename], { emitDeclarationOnly: true });
    const sourceFile = program.getSourceFile(filename);
    const typeChecker = program.getTypeChecker();
    // Get the declaration node you're looking for by it's type name.
    // This condition can be adjusted to your needs
    const statement = sourceFile.statements.find((s) => ts.isTypeAliasDeclaration(s) && s.name.text === aliasName);
    if (!statement) {
        throw new Error(`Type: '${aliasName}' not found in file: '${filename}'`);
    }
    const type = typeChecker.getTypeAtLocation(statement);
    const fields = [];
    // Iterate over the `ts.Symbol`s representing Property Nodes of `ts.Type`
    const completed = {};
    recurseType(type, typeChecker, statement, ``, completed);
    return completed;
}
function camelCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
        return index == 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
}
function attemptTypeConvert(key, propType) {
    const prop = process.env[key];
    switch (propType) {
        case 'boolean':
            if (prop.toLowerCase() === "true") {
                return true;
            }
            else if (prop.toLowerCase() === "false") {
                return false;
            }
            else {
                throw new Error(`Invalid property value for boolean variable ${key}.`);
            }
            break;
        case 'number':
            const parsed = prop.indexOf(".") === -1 ? parseInt(prop) : parseFloat(prop);
            if (isNaN(parsed)) {
                throw new Error(`Invalid property value for number variable ${key}.`);
            }
            return parsed;
        default:
            throw new Error(`Unsupported environment variable type for ${key}: ${propType}`);
    }
}
function loadConfig(path) {
    const typeBSignature = extractTypeSignature("./config.ts", "Config");
    dotenv.config();
    const config = {};
    Object.keys(typeBSignature).forEach((key) => {
        if (!process.env[key]) {
            throw new Error(`Missing required environment variable: ${key}=<${typeBSignature[key]}>`);
        }
        const broken = key.split(".").map((k) => camelCase(k.toLowerCase().replace("_", " ")));
        let ptr = config;
        broken.forEach((level, i) => {
            if (i === broken.length - 1) {
                ptr[level] = typeBSignature[key] !== 'string' ? attemptTypeConvert(key, typeBSignature[key]) : process.env[key];
            }
            else {
                if (!ptr[level]) {
                    ptr[level] = {};
                }
                ptr = ptr[level];
            }
        });
    });
    return config;
}
exports.loadConfig = loadConfig;
