import { NODE_TYPE } from "#src/constants";
import type { Rule } from "eslint";
import type { Node } from "estree";

const booleanOperators = new Set(["&&", "||"]);
const functionTypes = new Set<string>([
	NODE_TYPE.FunctionDeclaration,
	NODE_TYPE.FunctionExpression,
	NODE_TYPE.ArrowFunctionExpression,
]);
const branchTypes = new Set<string>([NODE_TYPE.IfStatement, NODE_TYPE.ConditionalExpression]);
const loopTypes = new Set<string>([NODE_TYPE.WhileStatement, NODE_TYPE.DoWhileStatement, NODE_TYPE.ForStatement]);

function getConditionMessage(parent: Rule.Node, child: Rule.Node): string | undefined {
	const isConditionTest = "test" in parent && parent.test === child;
	if (!isConditionTest) {
		return undefined;
	}
	if (branchTypes.has(parent.type)) {
		return "namedBoolean";
	}
	if (loopTypes.has(parent.type)) {
		return "namedPredicate";
	}
	return undefined;
}

function findCondition(node: Rule.Node): { test: Node; messageId: string } | undefined {
	for (let child = node; child.parent !== null; child = child.parent) {
		const { parent } = child;
		// Instance initializers run on construction; computed keys and static initializers run at class definition.
		const instanceInitializer = parent.type === NODE_TYPE.PropertyDefinition && !parent.static
			&& parent.value === child;
		const deferred = instanceInitializer || functionTypes.has(parent.type);
		if (deferred) {
			return undefined;
		}
		const messageId = getConditionMessage(parent, child);
		if (messageId !== undefined) {
			return { test: child, messageId };
		}
	}
	return undefined;
}

export const namedConditions: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Require named booleans or predicates instead of logical operators in conditions.",
		},
		schema: [],
		messages: {
			namedBoolean: "Extract this condition into a meaningfully named boolean variable or predicate.",
			namedPredicate:
				"Extract this loop condition into a meaningfully named predicate so it is reevaluated each iteration.",
		},
	},
	create(context) {
		const reported = new WeakSet<Node>();

		function report(test: Node, messageId: string): void {
			if (!reported.has(test)) {
				reported.add(test);
				context.report({ node: test, messageId });
			}
		}

		return {
			LogicalExpression(node) {
				if (!booleanOperators.has(node.operator)) {
					return;
				}
				const condition = findCondition(node);
				if (condition) {
					report(condition.test, condition.messageId);
				}
			},
		};
	},
};
