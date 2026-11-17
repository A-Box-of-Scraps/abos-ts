import { EMPTY_EXPRESSIONS, FIRST_QUASI, NODE_TYPE } from "#src/constants";
import type { Rule } from "eslint";
import type { Node } from "estree";

const TYPEOF_OPERATOR = "typeof";

const comparisonOperators = new Set(["===", "!==", "==", "!=", "<", "<=", ">", ">="]);
const typeofResults = new Set([
	"undefined",
	"object",
	"boolean",
	"number",
	"bigint",
	"string",
	"symbol",
	"function",
]);

function getStaticString(node: Node): string | undefined {
	const literalValue = node.type === NODE_TYPE.Literal && node.value;
	if (typeof literalValue === "string") {
		return literalValue;
	}
	const isStaticTemplate = node.type === NODE_TYPE.TemplateLiteral && node.expressions.length === EMPTY_EXPRESSIONS;
	if (isStaticTemplate) {
		return node.quasis.at(FIRST_QUASI)?.value.cooked ?? undefined;
	}
	return undefined;
}

function isTypeofExpression(node: Node | undefined): boolean {
	return node?.type === NODE_TYPE.UnaryExpression && node.operator === TYPEOF_OPERATOR;
}

export const noMagicStrings: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Require named constants or enum members instead of magic strings in comparisons and switches.",
		},
		schema: [],
		messages: {
			magicString: "Replace this magic string with a meaningfully named constant or enum member.",
		},
	},
	create(context) {
		function checkString(node: Node, comparedWith?: Node): void {
			const value = getStaticString(node);
			const isBlank = value === undefined || value.trim() === "";
			if (isBlank) {
				return;
			}
			const isTypeofResult = isTypeofExpression(comparedWith) && typeofResults.has(value);
			if (isTypeofResult) {
				return;
			}
			context.report({ node, messageId: "magicString" });
		}

		return {
			BinaryExpression(node) {
				if (comparisonOperators.has(node.operator)) {
					checkString(node.left, node.right);
					checkString(node.right, node.left);
				}
			},
			SwitchStatement(node) {
				checkString(node.discriminant);
			},
			SwitchCase(node) {
				const { test, parent } = node;
				const isTestedSwitchCase = test !== null && test !== undefined && parent.type === NODE_TYPE.SwitchStatement;
				if (isTestedSwitchCase) {
					checkString(test, parent.discriminant);
				}
			},
		};
	},
};
