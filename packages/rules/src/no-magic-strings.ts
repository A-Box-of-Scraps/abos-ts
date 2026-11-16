import type { Rule } from "eslint";
import type { Node } from "estree";

const EMPTY_EXPRESSIONS = 0;
const FIRST_QUASI = 0;
const TYPEOF_OPERATOR = "typeof";

const NODE_TYPE = {
	Literal: "Literal",
	TemplateLiteral: "TemplateLiteral",
	UnaryExpression: "UnaryExpression",
	SwitchStatement: "SwitchStatement",
} as const;

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
	if (node.type === NODE_TYPE.Literal && typeof node.value === "string") {
		return node.value;
	}
	if (node.type === NODE_TYPE.TemplateLiteral && node.expressions.length === EMPTY_EXPRESSIONS) {
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
			if (value === undefined || value.trim() === "") {
				return;
			}
			if (isTypeofExpression(comparedWith) && typeofResults.has(value)) {
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
				if (node.test && node.parent.type === NODE_TYPE.SwitchStatement) {
					checkString(node.test, node.parent.discriminant);
				}
			},
		};
	},
};
