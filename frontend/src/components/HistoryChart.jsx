import React, { useRef, useMemo, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import { MdRefresh, MdRemove, MdAdd } from 'react-icons/md'

const CHART_Y_MAX = 15

/** Erster/letzter Zeitpunkt der gelieferten Reihe (ms). */
function getDataExtentMs(data) {
  if (!data.length) return null
  const min = new Date(data[0].time).getTime()
  const max = new Date(data[data.length - 1].time).getTime()
  return { min, max }
}

/** Letzte 3 Stunden bis „jetzt“ (bzw. Tagesende), geklemmt auf den gelieferten Tag. */
function getStandardTimeRangeMs(data, meta) {
  const day = getDataExtentMs(data)
  if (!day) return null
  const { min: t0, max: t1 } = day
  const isLatestDay = meta?.requestedDate === meta?.lastLogDate
  let endMs = isLatestDay ? Math.min(Date.now(), t1) : t1
  if (endMs < t0) endMs = t0
  let startMs = endMs - 3 * 60 * 60 * 1000
  if (startMs < t0) startMs = t0
  if (endMs <= startMs) {
    endMs = Math.min(t0 + 3 * 60 * 60 * 1000, t1)
  }
  return { min: startMs, max: endMs }
}

function timeRangeToDataZoomPercent(data, range) {
  if (!data.length || !range) return { start: 0, end: 100 }
  const t0 = new Date(data[0].time).getTime()
  const t1 = new Date(data[data.length - 1].time).getTime()
  const span = t1 - t0 || 1
  let startPct = ((range.min - t0) / span) * 100
  let endPct = ((range.max - t0) / span) * 100
  startPct = Math.max(0, Math.min(100, startPct))
  endPct = Math.max(0, Math.min(100, endPct))
  if (endPct <= startPct) endPct = Math.min(100, startPct + 0.02)
  return { start: startPct, end: endPct }
}

const xAxisLabelRich = {
  xzTime: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    lineHeight: 15,
    align: 'center',
  },
  xzDate: {
    fontSize: 10,
    fontWeight: 500,
    color: 'var(--text-muted)',
    lineHeight: 14,
    align: 'center',
    padding: [1, 0, 0, 0],
  },
}

/** X-Achse: erste Zeile Uhrzeit, zweite Zeile Datum (de-CH). */
function formatXAxisLabelRich(ms) {
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return ''
  const time = new Intl.DateTimeFormat('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
  const date = new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(d)
  return `{xzTime|${time}}\n{xzDate|${date}}`
}

export default function HistoryChart({
  data = [],
  meta = null,
  onRefresh,
  loading = false,
}) {
  const chartRef = useRef(null)

  const performZoom = useCallback((scale) => {
    if (!chartRef.current) return
    const inst = chartRef.current.getEchartsInstance()
    const opt = inst.getOption()
    const dz = opt.dataZoom?.[0]
    let start = dz?.start
    let end = dz?.end
    if (start == null || end == null) {
      start = 0
      end = 100
    }
    const span = end - start
    inst.dispatchAction({
      type: 'dataZoom',
      dataZoomIndex: 0,
      xAxisIndex: 0,
      start: Math.max(0, start + span * scale),
      end: Math.min(100, end - span * scale),
    })
  }, [])

  const zoomPercent = useMemo(() => {
    const range = getStandardTimeRangeMs(data, meta)
    return timeRangeToDataZoomPercent(data, range)
  }, [data, meta])

  const option = useMemo(
    () => ({
      backgroundColor: 'transparent',
      legend: {
        data: ['PV Erzeugung', 'Verbrauch', 'PV-Überschuss'],
        bottom: 0,
        icon: 'circle',
        textStyle: { color: 'var(--text-main)' },
      },
      grid: { left: '3%', right: '4%', bottom: '22%', top: '10%', containLabel: true },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          filterMode: 'none',
          zoomSensitivity: 2.5,
          start: zoomPercent.start,
          end: zoomPercent.end,
        },
      ],
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLine: { lineStyle: { color: 'var(--border-color)' } },
        splitNumber: 5,
        axisLabel: {
          hideOverlap: true,
          margin: 10,
          formatter: (value) => formatXAxisLabelRich(value),
          rich: xAxisLabelRich,
        },
      },
      yAxis: {
        type: 'value',
        name: 'kW',
        min: 0,
        max: CHART_Y_MAX,
        interval: 3,
        axisLabel: { color: 'var(--text-muted)' },
        nameTextStyle: { color: 'var(--text-muted)' },
        splitLine: { lineStyle: { color: 'var(--border-color)', type: 'dashed' } },
      },
      series: [
        {
          name: 'Verbrauch',
          type: 'line',
          stack: 'energie',
          smooth: true,
          itemStyle: { color: '#cd5c5c' },
          lineStyle: { width: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(205, 92, 92, 0.2)' },
                { offset: 1, color: 'rgba(205, 92, 92, 0.0)' },
              ],
            },
          },
          showSymbol: false,
          data: data.map((d) => [d.time, d.consumption]),
          z: 3,
        },
        {
          name: 'PV-Überschuss',
          type: 'line',
          stack: 'energie',
          smooth: true,
          data: data.map((d) => [d.time, d.surplus]),
          itemStyle: { color: 'rgb(83, 211, 141)' },
          lineStyle: { width: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(83, 211, 141, 0.8)' },
                { offset: 1, color: 'rgba(83, 211, 141, 0.0)' },
              ],
            },
          },
          showSymbol: false,
          z: 4,
        },
        {
          name: 'PV Erzeugung',
          type: 'line',
          smooth: true,
          itemStyle: { color: '#daa520' },
          lineStyle: { width: 2 },
          showSymbol: false,
          data: data.map((d) => [d.time, d.pv]),
          z: 5,
        },
      ],
    }),
    [data, zoomPercent.start, zoomPercent.end]
  )

  return (
    <div className="card history-chart-card">
      <div className="chart-toolbar">
        <h2 className="chart-card-title">Erzeugung & Überschuss</h2>
        <div
          className="chart-toolbar-actions"
          role="toolbar"
          aria-label="Diagramm-Werkzeuge"
        >
          <div className="chart-toolbar-tool-group">
            <button
              type="button"
              className="icon-btn chart-toolbar-btn"
              onClick={() => performZoom(-0.2)}
              title="Zoom verkleinern"
              aria-label="Zoom verkleinern"
            >
              <MdRemove aria-hidden />
            </button>
            <button
              type="button"
              className="icon-btn chart-toolbar-btn"
              onClick={() => performZoom(0.2)}
              title="Zoom vergrössern"
              aria-label="Zoom vergrössern"
            >
              <MdAdd aria-hidden />
            </button>
            {onRefresh ? (
              <button
                type="button"
                className="icon-btn chart-toolbar-btn"
                onClick={() => onRefresh()}
                title="Aktualisieren (letzte 3 Stunden, Daten neu laden)"
                aria-label="Aktualisieren"
                disabled={loading}
              >
                <MdRefresh className={loading ? 'icon-spin' : ''} aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ height: 380, width: '100%' }}
        opts={{ renderer: 'svg' }}
        replaceMerge={['xAxis', 'dataZoom']}
      />
    </div>
  )
}
