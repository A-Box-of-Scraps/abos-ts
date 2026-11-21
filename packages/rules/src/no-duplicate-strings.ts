import { EMPTY_EXPRESSIONS, FIRST_OPTION, FIRST_QUASI, NODE_TYPE } from "#src/constants";
import { tsNode } from "#src/ts-node";
import type { Rule } from "eslint";
import type { Node } from "estree";

const DEFAULT_THRESHOLD = 3;
const DEFAULT_SHORT_STRING = 10;

interface Options {
	threshold?: number;
	ignoreStrings?: string[];
	shortString?: number;
}

// Direct literal children in these positions are module syntax, not runtime values.
const moduleSyntaxParents = new Set<string>([
	NODE_TYPE.ImportDeclaration,
	NODE_TYPE.ExportNamedDeclaration,
	NODE_TYPE.ExportAllDeclaration,
	NODE_TYPE.TSImportType,
	"ImportAttribute",
	"ImportSpecifier",
	"ExportSpecifier",
]);

function isModuleSyntax(parent: Rule.Node): boolean {
	if (moduleSyntaxParents.has(parent.type)) {
		return true;
	}
	// Some TS-ESTree versions wrap the module specifier in a literal type.
	const type = tsNode(parent);
	return type.type === NODE_TYPE.TSLiteralType && type.parent?.type === NODE_TYPE.TSImportType;
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
				const isCountedString = typeof value === "string" && !isDirective && !isModuleSyntax(parent);
				if (isCountedString) {
					collect(node, value);
				}
			},
			TemplateLiteral(node) {
				const { parent } = node;
				const isTagged = parent.type === NODE_TYPE.TaggedTemplateExpression && parent.quasi === node;
				const isStaticString = !isTagged && node.expressions.length === EMPTY_EXPRESSIONS;
				if (isStaticString) {
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
