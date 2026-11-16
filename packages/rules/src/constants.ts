const EMPTY_EXPRESSIONS = 0;
const FIRST_QUASI = 0;
const FIRST_OPTION = 0;

const NODE_TYPE = {
	ArrowFunctionExpression: "ArrowFunctionExpression",
	ConditionalExpression: "ConditionalExpression",
	DoWhileStatement: "DoWhileStatement",
	ForStatement: "ForStatement",
	FunctionDeclaration: "FunctionDeclaration",
	FunctionExpression: "FunctionExpression",
	IfStatement: "IfStatement",
	WhileStatement: "WhileStatement",
	Literal: "Literal",
	LogicalExpression: "LogicalExpression",
	TemplateLiteral: "TemplateLiteral",
	UnaryExpression: "UnaryExpression",
	SwitchStatement: "SwitchStatement",
} as const;

export { EMPTY_EXPRESSIONS, FIRST_OPTION, FIRST_QUASI, NODE_TYPE };
