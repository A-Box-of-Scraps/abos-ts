import { EMPTY_EXPRESSIONS, FIRST_OPTION, FIRST_QUASI } from "#src/constants";
import type { Rule } from "eslint";
import type { Node } from "estree";

const DEFAULT_THRESHOLD = 3;
const DEFAULT_SHORT_STRING = 10;

interface Options {
	threshold?: number;
	ignoreStrings?: string[];
	shortString?: number;
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
			if (value.length < shortString || ignoredStrings.has(value)) {
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
				if (typeof node.value === "string") {
					collect(node, node.value);
				}
			},
			TemplateLiteral(node) {
				if (node.expressions.length === EMPTY_EXPRESSIONS) {
					const value = node.quasis.at(FIRST_QUASI)?.value.cooked;
					if (value !== undefined && value !== null) {
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
