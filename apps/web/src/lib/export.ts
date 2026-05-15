import type { SceneNode } from '@aether/types';

// ─── SVG export ───────────────────────────────────────────────────────────────

function renderSvgNode(node: SceneNode, parentAbsX: number, parentAbsY: number): string {
  const ax = parentAbsX + node.x;
  const ay = parentAbsY + node.y;

  if (node.type === 'circle') {
    const cx = ax + node.width  / 2;
    const cy = ay + node.height / 2;
    return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(node.width / 2).toFixed(1)}" ry="${(node.height / 2).toFixed(1)}" fill="${node.fill}" opacity="${node.opacity}"/>`;
  }

  const childSvg = (node.children ?? [])
    .map((c) => '  ' + renderSvgNode(c, ax, ay))
    .join('\n');

  if (node.type === 'frame') {
    const cid    = `c${node.id.replace(/[^a-z0-9]/gi, '').slice(0, 8)}`;
    const bgFill = node.fill.startsWith('rgba') ? 'none' : node.fill;
    const parts  = [
      `<defs><clipPath id="${cid}"><rect x="${ax.toFixed(1)}" y="${ay.toFixed(1)}" width="${node.width.toFixed(1)}" height="${node.height.toFixed(1)}"/></clipPath></defs>`,
      `<rect x="${ax.toFixed(1)}" y="${ay.toFixed(1)}" width="${node.width.toFixed(1)}" height="${node.height.toFixed(1)}" fill="${bgFill}" opacity="${node.opacity}"/>`,
    ];
    if (childSvg) parts.push(`<g clip-path="url(#${cid})">\n${childSvg}\n</g>`);
    return parts.join('\n');
  }

  // rect
  const parts = [
    `<rect x="${ax.toFixed(1)}" y="${ay.toFixed(1)}" width="${node.width.toFixed(1)}" height="${node.height.toFixed(1)}" fill="${node.fill}" opacity="${node.opacity}" rx="6"/>`,
  ];
  if (childSvg) parts.push(childSvg);
  return parts.join('\n');
}

export function exportNodeAsSvg(node: SceneNode): void {
  const body = renderSvgNode(node, -node.x, -node.y);
  const svg  = [
    `<svg xmlns="http://www.w3.org/2000/svg"`,
    `     width="${node.width}" height="${node.height}"`,
    `     viewBox="0 0 ${node.width} ${node.height}">`,
    body.split('\n').map((l) => `  ${l}`).join('\n'),
    `</svg>`,
  ].join('\n');

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'aether-export.svg';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Tailwind class generator ─────────────────────────────────────────────────

export function nodeToTailwind(node: SceneNode): string {
  const cls: string[] = ['relative'];

  cls.push(`w-[${Math.round(node.width)}px]`, `h-[${Math.round(node.height)}px]`);

  if (node.type === 'circle')     cls.push('rounded-full');
  else if (node.type === 'rect')  cls.push('rounded-md');
  else if (node.type === 'frame') cls.push('overflow-hidden');

  if (!node.fill.startsWith('rgba')) cls.push(`bg-[${node.fill}]`);

  if (node.opacity < 1) cls.push(`opacity-[${(node.opacity * 100).toFixed(0)}%]`);

  if (node.type === 'frame' && node.layoutMode && node.layoutMode !== 'none') {
    cls.push('flex', node.layoutMode === 'flex-row' ? 'flex-row' : 'flex-col');
    if (node.gap)     cls.push(`gap-[${node.gap}px]`);
    if (node.padding) cls.push(`p-[${node.padding}px]`);
  }

  return cls.join(' ');
}
