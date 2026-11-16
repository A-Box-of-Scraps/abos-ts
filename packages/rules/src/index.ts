import { noMagicStrings } from "#src/no-magic-strings";

const rules = {
	"no-magic-strings": noMagicStrings,
};

const plugin = {
	meta: { name: "@pi-pack/ts-rules" },
	rules,
};

export { noMagicStrings } from "#src/no-magic-strings";
export { rules };
export default plugin;
