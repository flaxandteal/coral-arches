import { describe, expect, it } from "vitest";

import { capTree, isShowMoreNode } from "@/arches_controlled_lists/capTree.ts";

import type { TreeNode } from "primevue/treenode";

function makeNode(key: string, kids = 0): TreeNode {
    return {
        key,
        children: Array.from({ length: kids }, (_, i) =>
            makeNode(`${key}-${i}`),
        ),
    };
}

describe("capTree", () => {
    it("returns a list at or under the limit by reference", () => {
        const nodes = [makeNode("a", 3)];
        const result = capTree(nodes, {}, 3);
        expect(result[0]).toBe(nodes[0]);
        expect(result[0].children).toHaveLength(3);
    });

    it("shows step real children and one show-more node for a big list", () => {
        const [list] = capTree([makeNode("a", 10)], {}, 4);
        const kids = list.children!;
        expect(kids).toHaveLength(5);
        expect(kids.filter((k) => !isShowMoreNode(k))).toHaveLength(4);
        expect(isShowMoreNode(kids[4])).toBe(true);
        expect(kids[4].data.remaining).toBe(6);
        expect(kids[4].data.coralShowMore).toBe("a");
    });

    it("reveals more when shown is raised", () => {
        const [list] = capTree([makeNode("a", 10)], { a: 8 }, 4);
        expect(list.children).toHaveLength(9);
        expect(list.children![8].data.remaining).toBe(2);
    });

    it("shows everything when shown is Infinity", () => {
        const [list] = capTree([makeNode("a", 10)], { a: Infinity }, 4);
        expect(list.children).toHaveLength(10);
        expect(list.children!.some(isShowMoreNode)).toBe(false);
    });

    it("caps nested children", () => {
        const root = makeNode("r", 2);
        root.children![0] = makeNode("r-0", 6);
        const [capped] = capTree([root], {}, 3);
        const inner = capped.children![0];
        expect(inner.children).toHaveLength(4);
        expect(isShowMoreNode(inner.children![3])).toBe(true);
        expect(capped.children![1]).toBe(root.children![1]);
    });

    it("does not mutate its input", () => {
        const nodes = [makeNode("a", 10)];
        capTree(nodes, {}, 4);
        expect(nodes[0].children).toHaveLength(10);
    });
});
