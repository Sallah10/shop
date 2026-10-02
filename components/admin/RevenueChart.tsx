import type { DailyRevenue } from "@/lib/orders";

type Point = {
  x: number;
  y: number;
  day: string;
  revenue: number;
  orders: number;
};

const WIDTH = 720;
const HEIGHT = 240;
const PADDING = { top: 16, right: 16, bottom: 32, left: 56 };
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_POINTS = 30;

/**
 * Revenue per day as a hand-drawn SVG, so the admin overview needs no charting
 * dependency. Renders server side, which keeps it a plain component.
 */
export function RevenueChart({ data }: { data: DailyRevenue[] }) {
  const series = fillGaps(data);
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const points = toPoints(series, plotWidth, plotHeight);
  const maxRevenue = Math.max(...series.map((entry) => entry.revenue), 0);
  const totalRevenue = series.reduce((sum, entry) => sum + entry.revenue, 0);
  const totalOrders = series.reduce((sum, entry) => sum + entry.orders, 0);

  if (points.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-500">
        No revenue recorded yet.
      </div>
    );
  }

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");

  const area = `${line} L${points[points.length - 1].x} ${plotHeight} L${points[0].x} ${plotHeight} Z`;

  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-2xl font-semibold tabular-nums">
          ${totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
        </p>
        <p className="text-sm text-zinc-500">
          across {totalOrders} {totalOrders === 1 ? "order" : "orders"}
        </p>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Revenue per day. ${describe(series)}`}
        className="mt-4 h-auto w-full"
      >
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#18181b" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#18181b" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        <g transform={`translate(${PADDING.left} ${PADDING.top})`}>
          {[0, 0.5, 1].map((step) => {
            const y = plotHeight - step * plotHeight;

            return (
              <g key={step}>
                <line
                  x1={0}
                  y1={y}
                  x2={plotWidth}
                  y2={y}
                  stroke="#e4e4e7"
                  strokeWidth="1"
                />
                <text
                  x={-10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-zinc-400 text-[10px]"
                >
                  {formatAxisValue(maxRevenue * step)}
                </text>
              </g>
            );
          })}

          <path d={area} fill="url(#revenue-fill)" />
          <path
            d={line}
            fill="none"
            stroke="#18181b"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map((point, index) => (
            <g key={point.day}>
              <circle cx={point.x} cy={point.y} r="3" fill="#18181b" />
              <title>{describePoint(point)}</title>

              {index % labelEvery === 0 && (
                <text
                  x={point.x}
                  y={plotHeight + 20}
                  textAnchor="middle"
                  className="fill-zinc-400 text-[10px]"
                >
                  {point.day.slice(5)}
                </text>
              )}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

function toPoints(series: DailyRevenue[], plotWidth: number, plotHeight: number): Point[] {
  const maxRevenue = Math.max(...series.map((entry) => entry.revenue), 0);

  return series.map((entry, index) => {
    const ratio = series.length === 1 ? 0.5 : index / (series.length - 1);
    const heightRatio = maxRevenue === 0 ? 0 : entry.revenue / maxRevenue;

    return {
      x: Math.round(ratio * plotWidth * 100) / 100,
      y: Math.round((1 - heightRatio) * plotHeight * 100) / 100,
      day: entry.day.slice(0, 10),
      revenue: entry.revenue,
      orders: entry.orders,
    };
  });
}

/**
 * The view only returns days that have orders, so a quiet week would render as
 * a flat line between distant points. Padding with empty days keeps the x axis
 * proportional to real time.
 */
function fillGaps(data: DailyRevenue[]): DailyRevenue[] {
  if (data.length < 2) {
    return data;
  }

  const days = data.map((entry) => entry.day.slice(0, 10));
  const start = new Date(`${days[0]}T00:00:00Z`).getTime();
  const end = new Date(`${days[days.length - 1]}T00:00:00Z`).getTime();
  const span = Math.round((end - start) / DAY_MS);

  if (span >= MAX_POINTS - 1 || span < 1) {
    return data.slice(-MAX_POINTS);
  }

  const byDay = new Map(days.map((day, index) => [day, data[index]]));

  return Array.from({ length: span + 1 }, (_, index) => {
    const day = new Date(start + index * DAY_MS).toISOString().slice(0, 10);

    return byDay.get(day) ?? { day, orders: 0, revenue: 0 };
  });
}

function formatAxisValue(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function describePoint(point: Point): string {
  return `${point.day}: ${formatAxisValue(point.revenue)} from ${point.orders} ${
    point.orders === 1 ? "order" : "orders"
  }`;
}

function describe(series: DailyRevenue[]): string {
  const busiest = series.reduce(
    (best, entry) => (entry.revenue > best.revenue ? entry : best),
    series[0],
  );

  return `Best day was ${busiest.day.slice(0, 10)} with ${formatAxisValue(busiest.revenue)}.`;
}