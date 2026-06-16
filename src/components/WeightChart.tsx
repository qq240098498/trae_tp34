import { useMemo } from 'react';
import type { WeightRecord } from '@/store';
import { format, parseISO } from 'date-fns';

interface WeightChartProps {
  records: WeightRecord[];
  idealWeight?: number;
}

export default function WeightChart({ records, idealWeight }: WeightChartProps) {
  const chartData = useMemo(() => {
    if (records.length === 0) return null;

    const sorted = [...records].sort(
      (a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime()
    );

    const weights = sorted.map((r) => r.weight);
    const minWeightRaw = Math.min(...weights);
    const maxWeightRaw = Math.max(...weights, idealWeight ?? 0);

    const padding = (maxWeightRaw - minWeightRaw) * 0.15 || 0.5;
    const minWeight = Math.max(0, minWeightRaw - padding);
    const maxWeight = maxWeightRaw + padding;

    const width = 600;
    const height = 280;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 50;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const points = sorted.map((record, index) => {
      const x =
        sorted.length === 1
          ? paddingLeft + chartWidth / 2
          : paddingLeft + (index / (sorted.length - 1)) * chartWidth;
      const y =
        paddingTop +
        chartHeight -
        ((record.weight - minWeight) / (maxWeight - minWeight)) * chartHeight;
      return { x, y, weight: record.weight, date: record.recordDate };
    });

    const pathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');

    const areaPathD =
      pathD +
      ` L ${points[points.length - 1].x.toFixed(1)} ${(paddingTop + chartHeight).toFixed(1)}` +
      ` L ${points[0].x.toFixed(1)} ${(paddingTop + chartHeight).toFixed(1)} Z`;

    const yTickCount = 5;
    const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => {
      const value = minWeight + ((maxWeight - minWeight) * i) / yTickCount;
      const y = paddingTop + chartHeight - (i / yTickCount) * chartHeight;
      return { value, y };
    });

    const xTickCount = Math.min(sorted.length, 6);
    const xTicks = sorted
      .filter((_, i) => i % Math.ceil(sorted.length / xTickCount) === 0 || i === sorted.length - 1)
      .map((record) => {
        const index = sorted.indexOf(record);
        const x =
          sorted.length === 1
            ? paddingLeft + chartWidth / 2
            : paddingLeft + (index / (sorted.length - 1)) * chartWidth;
        return { x, date: record.recordDate };
      });

    const idealWeightY =
      idealWeight !== undefined
        ? paddingTop +
          chartHeight -
          ((idealWeight - minWeight) / (maxWeight - minWeight)) * chartHeight
        : null;

    return {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      chartWidth,
      chartHeight,
      points,
      pathD,
      areaPathD,
      yTicks,
      xTicks,
      idealWeightY,
      minWeight,
      maxWeight,
      sorted,
    };
  }, [records, idealWeight]);

  if (!chartData || records.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-white/60">
        <div className="text-5xl mb-3 opacity-40">📊</div>
        <p className="text-sm text-gray-400">暂无体重数据</p>
        <p className="text-xs text-gray-300 mt-1">添加体重记录后查看趋势图</p>
      </div>
    );
  }

  const { sorted } = chartData;
  const firstWeight = sorted[0].weight;
  const lastWeight = sorted[sorted.length - 1].weight;
  const diff = lastWeight - firstWeight;
  const diffPercent = ((diff / firstWeight) * 100).toFixed(1);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg text-gray-800">📈 体重趋势</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-gradient-to-br from-primary to-secondary" />
            <span className="text-gray-600">实际体重</span>
          </div>
          {idealWeight !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-5 bg-success" />
              <span className="text-gray-600">理想 {idealWeight}kg</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-orange-50 p-3 text-center">
          <p className="text-xs text-gray-500">起始体重</p>
          <p className="mt-1 font-display text-xl text-gray-800">{firstWeight} kg</p>
          <p className="text-[10px] text-gray-400">{format(parseISO(sorted[0].recordDate), 'MM-dd')}</p>
        </div>
        <div className="rounded-xl bg-teal-50 p-3 text-center">
          <p className="text-xs text-gray-500">当前体重</p>
          <p className="mt-1 font-display text-xl text-gray-800">{lastWeight} kg</p>
          <p className="text-[10px] text-gray-400">{format(parseISO(sorted[sorted.length - 1].recordDate), 'MM-dd')}</p>
        </div>
        <div className={`rounded-xl p-3 text-center ${diff >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className="text-xs text-gray-500">变化</p>
          <p className={`mt-1 font-display text-xl ${diff >= 0 ? 'text-danger' : 'text-success'}`}>
            {diff >= 0 ? '+' : ''}{diff.toFixed(2)} kg
          </p>
          <p className={`text-[10px] ${diff >= 0 ? 'text-danger/70' : 'text-success/70'}`}>
            {diff >= 0 ? '+' : ''}{diffPercent}%
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartData.width} ${chartData.height}`}
          className="w-full"
          style={{ minWidth: '320px' }}
        >
          <defs>
            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF8C42" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FF8C42" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FF8C42" />
              <stop offset="100%" stopColor="#4ECDC4" />
            </linearGradient>
          </defs>

          {chartData.yTicks.map((tick, i) => (
            <g key={`y-${i}`}>
              <line
                x1={chartData.paddingLeft}
                y1={tick.y}
                x2={chartData.width - chartData.paddingRight}
                y2={tick.y}
                stroke="#f0f0f0"
                strokeWidth="1"
              />
              <text
                x={chartData.paddingLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="fill-gray-400"
                fontSize="11"
              >
                {tick.value.toFixed(1)}
              </text>
            </g>
          ))}

          {chartData.idealWeightY !== null && (
            <>
              <line
                x1={chartData.paddingLeft}
                y1={chartData.idealWeightY}
                x2={chartData.width - chartData.paddingRight}
                y2={chartData.idealWeightY}
                stroke="#6BCB77"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <text
                x={chartData.width - chartData.paddingRight - 4}
                y={chartData.idealWeightY - 6}
                textAnchor="end"
                className="fill-success"
                fontSize="10"
                fontWeight="500"
              >
                理想 {idealWeight}kg
              </text>
            </>
          )}

          <path d={chartData.areaPathD} fill="url(#weightGradient)" />

          <path
            d={chartData.pathD}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {chartData.points.map((point, i) => (
            <g key={`point-${i}`}>
              <circle cx={point.x} cy={point.y} r="6" fill="white" stroke="#FF8C42" strokeWidth="2.5" />
              <circle cx={point.x} cy={point.y} r="2.5" fill="#FF8C42" />
            </g>
          ))}

          {chartData.xTicks.map((tick, i) => (
            <text
              key={`x-${i}`}
              x={tick.x}
              y={chartData.height - chartData.paddingBottom + 20}
              textAnchor="middle"
              className="fill-gray-400"
              fontSize="11"
            >
              {format(parseISO(tick.date), 'MM-dd')}
            </text>
          ))}

          <text
            x={chartData.paddingLeft - 30}
            y={chartData.paddingTop + chartData.chartHeight / 2}
            textAnchor="middle"
            className="fill-gray-400"
            fontSize="11"
            transform={`rotate(-90, ${chartData.paddingLeft - 30}, ${chartData.paddingTop + chartData.chartHeight / 2})`}
          >
            kg
          </text>
        </svg>
      </div>
    </div>
  );
}
