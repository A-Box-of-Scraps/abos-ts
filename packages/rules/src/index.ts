import { expressionComplexity } from "#src/expression-complexity";
import { namedConditions } from "#src/named-conditions";
import { noDuplicateStrings } from "#src/no-duplicate-strings";
import { noMagicStrings } from "#src/no-magic-strings";
import { noShallowTypePredicate } from "#src/no-shallow-type-predicate";
import { uppercasePrimitiveConst } from "#src/uppercase-primitive-const";

const rules = {
	"named-conditions": namedConditions,
	"expression-complexity": expressionComplexity,
	"no-duplicate-strings": noDuplicateStrings,
	"no-magic-strings": noMagicStrings,
	"no-shallow-type-predicate": noShallowTypePredicate,
	"uppercase-primitive-const": uppercasePrimitiveConst,
};

const plugin = {
	meta: { name: "@a-box-of-scraps/ts-rules" },
	rules,
};

export { expressionComplexity } from "#src/expression-complexity";
export { namedConditions } from "#src/named-conditions";
export { noDuplicateStrings } from "#src/no-duplicate-strings";
export { noMagicStrings } from "#src/no-magic-strings";
export { noShallowTypePredicate } from "#src/no-shallow-type-predicate";
export { uppercasePrimitiveConst } from "#src/uppercase-primitive-const";
export { rules };
export default plugin;
