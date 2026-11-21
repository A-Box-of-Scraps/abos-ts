import { NODE_TYPE } from "#src/constants";
import { tsNode } from "#src/ts-node";
import type {
	ArrowFunctionExpression,
	Expression,
	Function as FunctionNode,
	Node as TSNode,
	TSSignature,
	TSType,
	TSTypePredicate,
	TSTypeReference,
} from "@oxc-project/types";
import type { Rule, Scope } from "eslint";
import type { Node } from "estree";

const ARRAY = "Array";
const ARRAY_CONTAINER = "array";
const OBJECT = "object";
const RECORD = "Record";
const READONLY = "readonly";
const AND = "&&";
const NOT = "!";
const TYPEOF = "typeof";
const ONE = 1;
const NONE = 0;
const typeOnlyDeclarations = new Set<string>([
	NODE_TYPE.TSTypeAliasDeclaration,
	NODE_TYPE.TSInterfaceDeclaration,
	"TSTypeParameter",
]);
const unconstrained = new Set<string>(["TSAnyKeyword", "TSUnknownKeyword"]);
const concreteValues = new Set<string>([
	"TSStringKeyword",
	"TSNumberKeyword",
	"TSBooleanKeyword",
	"TSBigIntKeyword",
	"TSSymbolKeyword",
	"TSObjectKeyword",
	"TSNullKeyword",
	"TSUndefinedKeyword",
	"TSNeverKeyword",
	"TSLiteralType",
	"TSArrayType",
]);
const arrayTypes = new Set([ARRAY, "ReadonlyArray"]);
const equality = new Set(["===", "=="]);
const inequality = new Set(["!==", "!="]);

type GuardFunction = FunctionNode | ArrowFunctionExpression;
type Container = typeof OBJECT | typeof ARRAY_CONTAINER;

function binding(scope: Scope.Scope, name: string): Scope.Variable | undefined {
	for (let current: Scope.Scope | null = scope; current !== null; current = current.upper) {
		const variable = current.set.get(name);
		if (variable !== undefined) {
			return variable;
		}
	}
	return undefined;
}

function hasValueBinding(scope: Scope.Scope, name: string): boolean {
	for (let current: Scope.Scope | null = scope; current !== null; current = current.upper) {
		const defs = current.set.get(name)?.defs;
		const definesValue = defs?.some((definition) => !typeOnlyDeclarations.has(tsNode(definition.node).type)) ?? false;
		if (definesValue) {
			return true;
		}
	}
	return false;
}

function requiredFields(members: TSSignature[]): boolean {
	return members.some((member) => member.type === NODE_TYPE.TSPropertySignature && !member.optional);
}

function localDeclaration(type: TSTypeReference, scope: Scope.Scope): TSNode | undefined {
	if (type.typeName.type !== NODE_TYPE.Identifier) {
		return undefined;
	}
	const defs = binding(scope, type.typeName.name)?.defs;
	const [definition] = defs ?? [];
	const unique = defs?.length === ONE && definition !== undefined;
	if (unique) {
		return tsNode(definition.node);
	}
	return undefined;
}

function hasFields(type: TSType, scope: Scope.Scope): boolean {
	if (type.type === NODE_TYPE.TSTypeLiteral) {
		return requiredFields(type.members);
	}
	if (type.type !== NODE_TYPE.TSTypeReference) {
		return false;
	}
	const declaration = localDeclaration(type, scope);
	if (declaration?.type === NODE_TYPE.TSInterfaceDeclaration) {
		return requiredFields(declaration.body.body);
	}
	return declaration?.type === NODE_TYPE.TSTypeAliasDeclaration
		&& declaration.typeAnnotation.type === NODE_TYPE.TSTypeLiteral
		&& requiredFields(declaration.typeAnnotation.members);
}

function concreteValue(type: TSType | undefined, scope: Scope.Scope): boolean {
	if (type?.type === NODE_TYPE.TSParenthesizedType) {
		return concreteValue(type.typeAnnotation, scope);
	}
	if (type?.type === NODE_TYPE.TSUnionType) {
		return type.types.every((member) => concreteValue(member, scope));
	}
	return type !== undefined && (concreteValues.has(type.type) || hasFields(type, scope));
}

function builtinName(type: TSTypeReference, scope: Scope.Scope): string | undefined {
	if (type.typeName.type !== NODE_TYPE.Identifier) {
		return undefined;
	}
	const { name } = type.typeName;
	if ((binding(scope, name)?.defs.length ?? NONE) === NONE) {
		return name;
	}
	return undefined;
}

function arrayElement(type: TSType, scope: Scope.Scope): TSType | undefined {
	if (type.type === NODE_TYPE.TSArrayType) {
		return type.elementType;
	}
	const readonly = type.type === NODE_TYPE.TSTypeOperator && type.operator === READONLY;
	if (readonly) {
		return arrayElement(type.typeAnnotation, scope);
	}
	const builtinArray = type.type === NODE_TYPE.TSTypeReference && arrayTypes.has(builtinName(type, scope) ?? "");
	if (builtinArray) {
		return type.typeArguments?.params.at(NONE);
	}
	return undefined;
}

function claimsValues(type: TSType, scope: Scope.Scope): boolean {
	const record = type.type === NODE_TYPE.TSTypeReference && builtinName(type, scope) === RECORD;
	if (!record) {
		return false;
	}
	const [key, value] = type.typeArguments?.params ?? [];
	return key?.type === NODE_TYPE.TSStringKeyword && concreteValue(value, scope);
}

function missingObjectCheck(type: TSType, scope: Scope.Scope): string | undefined {
	if (arrayElement(type, scope) !== undefined) {
		return "uncheckedArray";
	}
	if (hasFields(type, scope)) {
		return "uncheckedFields";
	}
	if (claimsValues(type, scope)) {
		return "uncheckedValues";
	}
	return undefined;
}

function missingCheck(type: TSType, container: Container | undefined, scope: Scope.Scope): string | undefined {
	if (container === OBJECT) {
		return missingObjectCheck(type, scope);
	}
	const uncheckedElements = container === ARRAY_CONTAINER && concreteValue(arrayElement(type, scope), scope);
	if (uncheckedElements) {
		return "uncheckedElements";
	}
	return undefined;
}

function isParameter(node: TSNode | undefined, name: string): boolean {
	return node?.type === NODE_TYPE.Identifier && node.name === name;
}

function isArrayCall(expr: Expression, name: string, scope: Scope.Scope): boolean {
	const checksParameter = expr.type === NODE_TYPE.CallExpression && expr.arguments.length === ONE
		&& isParameter(expr.arguments.at(NONE), name);
	if (!checksParameter) {
		return false;
	}
	const { callee } = expr;
	const staticMember = callee.type === NODE_TYPE.MemberExpression && !callee.computed;
	const callsIsArray = staticMember && isParameter(callee.object, ARRAY) && isParameter(callee.property, "isArray");
	return callsIsArray && !hasValueBinding(scope, ARRAY);
}

function objectTest(expr: Expression, name: string): boolean {
	const comparison = expr.type === NODE_TYPE.BinaryExpression && equality.has(expr.operator);
	if (!comparison) {
		return false;
	}
	const { left, right } = expr;
	function isTypeof(node: TSNode): boolean {
		return node.type === NODE_TYPE.UnaryExpression && node.operator === TYPEOF && isParameter(node.argument, name);
	}
	const normal = isTypeof(left) && right.type === NODE_TYPE.Literal && right.value === OBJECT;
	return normal || (isTypeof(right) && left.type === NODE_TYPE.Literal && left.value === OBJECT);
}

function excludesNull(expr: Expression, name: string): boolean {
	const comparison = expr.type === NODE_TYPE.BinaryExpression && inequality.has(expr.operator);
	if (!comparison) {
		return false;
	}
	const { left, right } = expr;
	const normal = isParameter(left, name) && right.type === NODE_TYPE.Literal && right.value === null;
	return normal || (isParameter(right, name) && left.type === NODE_TYPE.Literal && left.value === null);
}

function conjunction(expr: Expression): Expression[] {
	const isAnd = expr.type === NODE_TYPE.LogicalExpression && expr.operator === AND;
	if (isAnd) {
		return [...conjunction(expr.left), ...conjunction(expr.right)];
	}
	return [expr];
}

function checkedContainer(expr: Expression, name: string, scope: Scope.Scope): Container | undefined {
	const terms = conjunction(expr).filter((term) => !excludesNull(term, name));
	const nonObjectTerms = terms.filter((term) => !objectTest(term, name));
	const checksArray = nonObjectTerms.length > NONE && nonObjectTerms.every((term) => isArrayCall(term, name, scope));
	if (checksArray) {
		return ARRAY_CONTAINER;
	}
	const onlyArrayExclusions = nonObjectTerms.every((term) =>
		term.type === NODE_TYPE.UnaryExpression && term.operator === NOT && isArrayCall(term.argument, name, scope)
	);
	const objectOnly = nonObjectTerms.length < terms.length && onlyArrayExclusions;
	if (objectOnly) {
		return OBJECT;
	}
	return undefined;
}

function returnedExpression(fn: GuardFunction): Expression | undefined {
	const { body } = fn;
	if (body?.type !== NODE_TYPE.BlockStatement) {
		return body ?? undefined;
	}
	const [statement] = body.body;
	const singleReturn = body.body.length === ONE && statement?.type === NODE_TYPE.ReturnStatement;
	if (singleReturn) {
		return statement.argument ?? undefined;
	}
	return undefined;
}

function guardBody(predicate: TSTypePredicate, name: string): Expression | undefined {
	const fn = predicate.parent?.parent;
	const hasBody = fn?.type === NODE_TYPE.FunctionDeclaration || fn?.type === NODE_TYPE.ArrowFunctionExpression
		|| fn?.type === NODE_TYPE.FunctionExpression;
	if (!hasBody) {
		return undefined;
	}
	const param = fn.params.find((entry) => isParameter(entry, name));
	const wideInput = param?.type === NODE_TYPE.Identifier
		&& unconstrained.has(param.typeAnnotation?.typeAnnotation.type ?? "");
	if (wideInput) {
		return returnedExpression(fn);
	}
	return undefined;
}

function inspect(predicate: TSTypePredicate, scope: Scope.Scope): string | undefined {
	const target = predicate.typeAnnotation?.typeAnnotation;
	const { parameterName } = predicate;
	const explicit = !predicate.asserts && parameterName.type === NODE_TYPE.Identifier && target !== undefined;
	if (!explicit) {
		return undefined;
	}
	const { name } = parameterName;
	const expr = guardBody(predicate, name);
	if (expr === undefined) {
		return undefined;
	}
	return missingCheck(target, checkedContainer(expr, name, scope), scope);
}

export const noShallowTypePredicate: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: { description: "Flag explicit type predicates that check only the container, not its contents." },
		schema: [],
		messages: {
			uncheckedArray: "This checks for an object, but does not establish that the value is an array.",
			uncheckedElements: "This checks for an array, but not the element type promised by the predicate.",
			uncheckedFields: "This checks for an object, but none of the required fields promised by the predicate.",
			uncheckedValues: "This checks for an object, but not the dictionary value type promised by the predicate.",
		},
	},
	create(context) {
		return {
			TSTypePredicate(node: Node) {
				const predicate = tsNode(node);
				if (predicate.type !== NODE_TYPE.TSTypePredicate) {
					return;
				}
				const messageId = inspect(predicate, context.sourceCode.getScope(node));
				if (messageId !== undefined) {
					context.report({ node, messageId });
				}
			},
		};
	},
};
