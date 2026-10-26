import type { TreeNode } from "primevue/treenode";

export const CAP_STEP = 200;

export function isShowMoreNode(node: TreeNode): boolean {
    return Boolean(node.data?.coralShowMore);
}

// Shows at most shown[key] ?? step children per node, then a show-more node; nodes under the limit stay the same object.
export function capTree(
    nodes: TreeNode[],
    shown: Record<string, number>,
    step: number,
): TreeNode[] {
    return nodes.map((node) => {
        const children = node.children;
        if (!children?.length) return node;
        const limit = shown[node.key as string] ?? step;
        const kept = children.slice(0, limit);
        const cappedKids = capTree(kept, shown, step);
        if (children.length <= limit) {
            const changed = cappedKids.some((kid, i) => kid !== children[i]);
            return changed ? { ...node, children: cappedKids } : node;
        }
        const remaining = children.length - limit;
        const moreNode: TreeNode = {
            key: `${node.key}::more`,
            label: `Show more (${remaining} remaining)`,
            leaf: true,
            selectable: false,
            data: { coralShowMore: node.key, remaining },
        };
        return { ...node, children: [...cappedKids, moreNode] };
    });
}
