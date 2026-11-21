import { EMPTY_EXPRESSIONS, FIRST_OPTION, FIRST_QUASI, NODE_TYPE } from "#src/constants";
import type { Rule } from "eslint";
import type { Node } from "estree";

const DEFAULT_THRESHOLD = 3;
const DEFAULT_SHORT_STRING = 10;

interface Options {
	threshold?: number;
	ignoreStrings?: string[];
	shortString?: number;
}

function isStaticModuleSource(node: Node, parent: Node): boolean {
	const isModuleDeclaration = parent.type === NODE_TYPE.ImportDeclaration
		|| parent.type === NODE_TYPE.ExportNamedDeclaration
		|| parent.type === NODE_TYPE.ExportAllDeclaration;
	return isModuleDeclaration && parent.source === node;
}

export const noDuplicateStrings: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Require named constants instead of repeated string literals.",
		},
		schema: [{
			type: "object",
			properties: {
				threshold: { type: "integer", minimum: 2, default: DEFAULT_THRESHOLD },
				ignoreStrings: { type: "array", items: { type: "string" }, uniqueItems: true, default: [] },
				shortString: { type: "integer", minimum: 0, default: DEFAULT_SHORT_STRING },
			},
			additionalProperties: false,
		}],
		messages: {
			duplicateString: "This string appears {{count}} times. Replace it with a meaningfully named constant.",
		},
	},
	create(context) {
		// eslint-disable-next-line typescript/no-unsafe-assignment -- Rule options are validated against the schema before creation.
		const options: Options = context.options[FIRST_OPTION] ?? {};
		const threshold = options.threshold ?? DEFAULT_THRESHOLD;
		const shortString = options.shortString ?? DEFAULT_SHORT_STRING;
		const ignoredStrings = new Set(options.ignoreStrings);
		const occurrences = new Map<string, Node[]>();

		function collect(node: Node, value: string): void {
			const isExcluded = value.length < shortString || ignoredStrings.has(value);
			if (isExcluded) {
				return;
			}
			const nodes = occurrences.get(value);
			if (nodes) {
				nodes.push(node);
			} else {
				occurrences.set(value, [node]);
			}
		}

		return {
			Literal(node) {
				const { parent, value } = node;
				const isDirective = "directive" in parent && typeof parent.directive === "string";
				const isCountedString = typeof value === "string" && !isDirective && !isStaticModuleSource(node, parent);
				if (isCountedString) {
					collect(node, value);
				}
			},
			TemplateLiteral(node) {
				if (node.expressions.length === EMPTY_EXPRESSIONS) {
					const value = node.quasis.at(FIRST_QUASI)?.value.cooked;
					const hasCookedValue = value !== undefined && value !== null;
					if (hasCookedValue) {
						collect(node, value);
					}
				}
			},
			"Program:exit"() {
				for (const nodes of occurrences.values()) {
					if (nodes.length >= threshold) {
						for (const node of nodes) {
							context.report({ node, messageId: "duplicateString", data: { count: nodes.length } });
						}
					}
				}
			},
		};
	},
};
