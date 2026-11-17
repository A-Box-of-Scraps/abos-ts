import { expressionComplexity } from "#src/expression-complexity";
import { namedConditions } from "#src/named-conditions";
import { noDuplicateStrings } from "#src/no-duplicate-strings";
import { noMagicStrings } from "#src/no-magic-strings";
import { noShallowTypePredicate } from "#src/no-shallow-type-predicate";

const rules = {
	"named-conditions": namedConditions,
	"expression-complexity": expressionComplexity,
	"no-duplicate-strings": noDuplicateStrings,
	"no-magic-strings": noMagicStrings,
	"no-shallow-type-predicate": noShallowTypePredicate,
};

const plugin = {
	meta: { name: "@pi-pack/ts-rules" },
	rules,
};

export { expressionComplexity } from "#src/expression-complexity";
export { namedConditions } from "#src/named-conditions";
export { noDuplicateStrings } from "#src/no-duplicate-strings";
export { noMagicStrings } from "#src/no-magic-strings";
export { noShallowTypePredicate } from "#src/no-shallow-type-predicate";
export { rules };
export default plugin;
