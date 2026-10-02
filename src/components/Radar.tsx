import { AXES, type Signal } from "@/lib/types";

// Diagramme radar à 5 axes (notes de 1 à 5), comme dans l'artéfact.
export function Radar({ radar }: { radar: Signal["radar"] }) {
  const cx = 160, cy = 150, r = 100;
  const point = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
    return [cx + Math.cos(a) * (r * v) / 5, cy + Math.sin(a) * (r * v) / 5];
  };
  const poly = (v: (i: number) => number) => AXES.map((_, i) => point(i, v(i)).join(",")).join(" ");
  return (
    <svg className="radar" viewBox="0 0 320 300" role="img" aria-label="Profil radar du signal">
      {[1, 2, 3, 4, 5].map((n) => (
        <polygon key={n} className="ring" points={poly(() => n)} />
      ))}
      {AXES.map(([k, label], i) => {
        const [x, y] = point(i, 5);
        const [lx, ly] = point(i, 6.1);
        return (
          <g key={k}>
            <line className="axis" x1={cx} y1={cy} x2={x} y2={y} />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle">
              {label} {radar[k] ?? "–"}
            </text>
          </g>
        );
      })}
      <polygon className="area" points={poly((i) => Number(radar[AXES[i][0]] ?? 0))} />
    </svg>
  );
}
