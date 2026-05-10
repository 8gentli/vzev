import ReactECharts from 'echarts-for-react'

function formatKw(value) {
  const n = typeof value === 'number' && !Number.isNaN(value) ? value : 0
  return `${n.toLocaleString('de-CH', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kW`
}

function formatUpdatedAt(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('de-CH', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date)
}

export default function SurplusGauge({ currentSurplus, lastUpdated }) {
  const cappedValue = currentSurplus > 10 ? 10 : currentSurplus

  const option = {
    backgroundColor: 'transparent',
    series: [
      {
        // Series 1: The Main Gauge Track and Needle
        type: 'gauge',
        center: ['50%', '70%'],
        startAngle: 180, endAngle: 0,
        min: 0, max: 10,
        splitNumber: 10,
        radius: '75%',
        axisLine: {
          lineStyle: {
            width: 18,
            color: [
              [0.2, '#1E5D3A'],
              [0.5, '#2e8b57'],
              [1, '#53D38D']
            ]
          }
        },
        pointer: {
          icon: 'path://M50,0 C65,0 70,50 70,100 C70,110 30,110 30,100 C30,50 35,0 50,0 Z',
          length: '65%', width: 8, offsetCenter: [0, '-10%'],
          itemStyle: { color: 'IndianRed' }
        },
        axisTick: { show: false },
        splitLine: { length: 25, lineStyle: { color: 'var(--surface-color)', width: 3 } },
        axisLabel: {
          color: 'var(--text-muted)', distance: -12, fontSize: 13, fontWeight: 'bold',
          formatter: function (value) {
            if (value === 0) return '0'
            return value
          }
        },
        title: { show: false },
        detail: {
          fontSize: 45, fontWeight: '800', offsetCenter: [0, 45], color: 'var(--text-main)',
          formatter: function () { return formatKw(currentSurplus) }
        },
        data: [{ value: cappedValue, name: '' }],
        z: 2
      },
      {
        // Series 2: The precise Overlays for Custom Tick Icons
        type: 'gauge',
        center: ['50%', '70%'],
        startAngle: 180, endAngle: 0,
        min: 0, max: 10,
        splitNumber: 100, // Important: Resolves scale to 0.1 intervals
        radius: '75%',
        axisLine: { show: false },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        detail: { show: false },
        axisLabel: {
          show: true,
          distance: -70, // Negative pushes icons OUTSIDE the green arc
          formatter: function (value) {
            const v = parseFloat(value.toFixed(1))
            if (v === 0.9) return '{vacuum|}\n{textStyle|Saugen}'
            if (v === 2.0) return '{washer|}\n{textStyle|Waschen}'
            if (v === 3.5) return '{soup|}\n{textStyle|Kochen}'
            if (v === 5.0) return '{heatpump|}\n{textStyle|Heizen}'
            return ''
          },
          rich: {
            textStyle: { color: 'var(--text-muted)', fontSize: 11, fontWeight: 500, lineHeight: 18, align: 'center' },
            vacuum: {
              backgroundColor: { image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 2v10'/><path d='M10 12h4v4h-4z'/><path d='M7 16h10l1 6H6z'/></svg>" },
              height: 24, width: 24
            },
            washer: {
              backgroundColor: { image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='5' y='3' width='14' height='18' rx='2' ry='2'/><circle cx='12' cy='13' r='5'/><path d='M8 6h.01M11 6h.01'/></svg>" },
              height: 24, width: 24
            },
            soup: {
              backgroundColor: { image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M4 10h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3z'/><path d='M8 8V5M12 8V4M16 8V6'/></svg>" },
              height: 24, width: 24
            },
            heatpump: {
              backgroundColor: { image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='5' width='18' height='14' rx='2' ry='2'/><circle cx='12' cy='12' r='4'/><path d='M12 8v8M8 12h8'/></svg>" },
              height: 24, width: 24
            }
          }
        },
        z: 3
      }
    ]
  }

  const updatedLabel = formatUpdatedAt(lastUpdated)

  return (
    <div className="card surplus-card">
      <div className="surplus-card-header">
        <h2 className="surplus-card-title">Aktueller PV-Überschuss</h2>
        {updatedLabel ? (
          <time
            className="surplus-card-timestamp"
            dateTime={lastUpdated.toISOString()}
          >
            {updatedLabel}
          </time>
        ) : null}
      </div>
      <ReactECharts option={option} style={{ height: 350, width: '100%' }} opts={{ renderer: 'svg' }} />
    </div>
  )
}
