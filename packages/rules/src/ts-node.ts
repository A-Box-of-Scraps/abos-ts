import type { Node as TSNode } from "@oxc-project/types";
import type { Node } from "estree";

export function tsNode(node: Node): TSNode {
	// The TypeScript parser supplies TS-ESTree nodes beyond ESLint's JavaScript-only listener types.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return node as unknown as TSNode;
}
