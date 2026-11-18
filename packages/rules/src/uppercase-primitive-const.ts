import { EMPTY_EXPRESSIONS, NODE_TYPE } from "#src/constants";
import type { Rule } from "eslint";
import type { VariableDeclarator } from "estree";

const upperCaseName = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;
const CONST = "const";
const MINUS = "-";

function matchesInitializer(init: VariableDeclarator["init"]): boolean {
	if (init?.type === NODE_TYPE.UnaryExpression) {
		return init.operator === MINUS && init.argument.type === NODE_TYPE.Literal
			&& typeof init.argument.value === "number";
	}
	if (init?.type === NODE_TYPE.Literal) {
		return !("regex" in init);
	}
	return init?.type === NODE_TYPE.TemplateLiteral && init.expressions.length === EMPTY_EXPRESSIONS;
}

export const uppercasePrimitiveConst: Rule.RuleModule = {
	meta: {
		type: "suggestion",
		docs: {
			description:
				"Require UPPER_CASE names for top-level const bindings initialized with primitive literals or negated number literals.",
		},
		schema: [],
		messages: {
			uppercaseName: "Use UPPER_CASE for the top-level constant '{{name}}'.",
		},
	},
	create(context) {
		return {
			VariableDeclaration({ kind, parent, declarations }) {
				const topLevelExport = parent.type === NODE_TYPE.ExportNamedDeclaration
					&& parent.parent.type === NODE_TYPE.Program;
				const topLevel = parent.type === NODE_TYPE.Program || topLevelExport;
				const isTopLevelConst = topLevel && kind === CONST;
				if (!isTopLevelConst) {
					return;
				}
				for (const { id, init } of declarations) {
					const needsUpperCase = id.type === NODE_TYPE.Identifier && matchesInitializer(init)
						&& !upperCaseName.test(id.name);
					if (needsUpperCase) {
						context.report({ node: id, messageId: "uppercaseName", data: { name: id.name } });
					}
				}
			},
		};
	},
};
