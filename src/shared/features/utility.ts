export const flatToObj = (flat = []) => {
  const all = {};
  [...flat]
    .filter((item) => !!item)
    .forEach((item) => {
      all[item.id] = {
        ...item,
      };
    });
  return all;
};

export const flatToHierarchy = (flat) => {
  const roots = []; // things without parent
  const all = flatToObj(flat);
  Object.keys(all).forEach((id) => {
    const item = all[id];
    if (item.parentId === null || item.parentId === undefined) {
      roots.push(item);
    } else if (all[item.parentId]) {
      const p = all[item.parentId];
      if (!p?.children) {
        p.children = [];
      }
      p.children.push(item);
    }
  });
  return roots;
};