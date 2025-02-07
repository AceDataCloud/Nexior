export function mergeAndSortLists(list1: any, list2: any) {
  const mergedMap = new Map();

  [...list1, ...list2].forEach((item) => {
    mergedMap.set(item.id, item);
  });

  // @ts-ignore
  return Array.from(mergedMap.values()).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}
