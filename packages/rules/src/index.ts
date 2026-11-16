import { noDuplicateStrings } from "#src/no-duplicate-strings";
import { noMagicStrings } from "#src/no-magic-strings";

const rules = {
	"no-duplicate-strings": noDuplicateStrings,
	"no-magic-strings": noMagicStrings,
};

const plugin = {
	meta: { name: "@pi-pack/ts-rules" },
	rules,
};

export { noDuplicateStrings } from "#src/no-duplicate-strings";
export { noMagicStrings } from "#src/no-magic-strings";
export { rules };
export default plugin;
