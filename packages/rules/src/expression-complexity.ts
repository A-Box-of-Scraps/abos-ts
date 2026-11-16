import { FIRST_OPTION, NODE_TYPE } from "#src/constants";
import type { Rule } from "eslint";
import type { Node } from "estree";

const DEFAULT_MAX = 3;
const NO_OPERATORS = 0;
const ONE_OPERATOR = 1;
const NOT_OPERATOR = "!";
const transparentWrappers = new Set([
	"TSAsExpression",
	"TSSatisfiesExpression",
	"TSTypeAssertion",
	"TSNonNullExpression",
	"ParenthesizedExpression",
]);

interface Options {
	max?: number;
}

export const expressionComplexity: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Limit logical operators in an expression and encourage named boolean variables.",
		},
		schema: [{
			type: "object",
			properties: {
				max: { type: "integer", minimum: 0, default: DEFAULT_MAX },
			},
			additionalProperties: false,
		}],
		messages: {
			tooComplex:
				"This expression has {{count}} logical operators (maximum {{max}}). Split it into meaningfully named boolean variables.",
		},
	},
	create(context) {
		// eslint-disable-next-line typescript/no-unsafe-assignment -- Rule options are validated against the schema before creation.
		const options: Options = context.options[FIRST_OPTION] ?? {};
		const max = options.max ?? DEFAULT_MAX;
		const counts = new WeakMap<Node, number>();

		return {
			"LogicalExpression:exit"(node) {
				const count = (counts.get(node) ?? NO_OPERATORS) + ONE_OPERATOR;
				let parent: Rule.Node | null = node.parent;
				// Negation and type wrappers do not split a logical expression into independent checks.
				while (
					parent !== null
					&& (transparentWrappers.has(parent.type)
						|| (parent.type === NODE_TYPE.UnaryExpression && parent.operator === NOT_OPERATOR))
				) {
					({ parent } = parent);
				}
				if (parent?.type === NODE_TYPE.LogicalExpression) {
					counts.set(parent, (counts.get(parent) ?? NO_OPERATORS) + count);
				} else if (count > max) {
					context.report({ node, messageId: "tooComplex", data: { count, max } });
				}
			},
		};
	},
};
