import React, { useRef, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'

export default function HistoryChart({ data }) {
  const chartRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  const nowMs = new Date().getTime();
  const startMs = nowMs - (2 * 60 * 60 * 1000);
  const endMs = nowMs + (10 * 60 * 1000);

  const performZoom = (scale) => {
    if (chartRef.current) {
      const inst = chartRef.current.getEchartsInstance();
      const currentZoom = inst.getOption().dataZoom[0];
      const span = currentZoom.end - currentZoom.start;
      inst.dispatchAction({
        type: 'dataZoom',
        start: Math.max(0, currentZoom.start + span * scale),
        end: Math.min(100, currentZoom.end - span * scale)
      });
    }
  };

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: 'Erzeugung & Überschuss',
      left: 'center',
      textStyle: { color: 'var(--text-muted)', fontSize: 14, fontWeight: '500', letterSpacing: 1 }
    },
    toolbox: {
      show: false,
      right: 15,
      top: 0,
      itemGap: 8,
      itemSize: 16,
      iconStyle: { borderColor: 'var(--text-muted)', color: 'var(--text-muted)', borderWidth: 0 },
      emphasis: { iconStyle: { color: 'var(--text-main)' } },
      feature: {
        myZoomOut: {
          show: true,
          title: 'Zoom -',
          icon: 'path://M19 13H5v-2h14v2z',
          onclick: () => performZoom(-0.2)
        },
        myZoomIn: {
          show: true,
          title: 'Zoom +',
          icon: 'path://M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
          onclick: () => performZoom(0.2)
        },
        myRestore: {
          show: true,
          title: 'Zurück',
          icon: 'path://M17.65 6.35A7.95 7.95 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
          onclick: function () {
            if (chartRef.current) {
              const liveMs = new Date().getTime();
              chartRef.current.getEchartsInstance().dispatchAction({
                type: 'dataZoom',
                startValue: liveMs - (2 * 60 * 60 * 1000),
                endValue: liveMs + (10 * 60 * 1000)
              });
            }
          }
        }
      }
    },
    legend: {
      data: ['PV Erzeugung', 'Verbrauch', 'PV-Überschuss'],
      bottom: 0,
      icon: 'circle',
      textStyle: { color: 'var(--text-main)' }
    },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'none',
        zoomSensitivity: 2.5,  // Drastically improves mobile pinch to zoom responsiveness
        ...(isFirstRender.current ? { startValue: startMs, endValue: endMs } : {})
      }
    ],
    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisLabel: { color: 'var(--text-muted)', hideOverlap: true },
      axisLine: { lineStyle: { color: 'var(--border-color)' } },
      splitNumber: 5
    },
    yAxis: {
      type: 'value',
      name: 'kW',
      min: 0,
      max: 14,
      interval: 2,
      axisLabel: { color: 'var(--text-muted)' },
      nameTextStyle: { color: 'var(--text-muted)' },
      splitLine: { lineStyle: { color: 'var(--border-color)', type: 'dashed' } }
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
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(205, 92, 92, 0.2)' },
              { offset: 1, color: 'rgba(205, 92, 92, 0.0)' }
            ]
          }
        },
        showSymbol: false,
        data: data.map(d => [d.time, d.consumption]),
        z: 3
      },
      {
        name: 'PV-Überschuss',
        type: 'line',
        stack: 'energie',
        smooth: true,
        data: data.map(d => [d.time, d.surplus]),
        itemStyle: { color: 'rgb(83, 211, 141)' },
        lineStyle: { width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(83, 211, 141, 0.8)' },
              { offset: 1, color: 'rgba(83, 211, 141, 0.0)' }
            ]
          }
        },
        showSymbol: false,
        z: 4
      },
      {
        name: 'PV Erzeugung',
        type: 'line',
        smooth: true,
        itemStyle: { color: 'gold' },
        lineStyle: { width: 2 },
        showSymbol: false,
        data: data.map(d => [d.time, d.pv]),
        z: 5
      }
    ]
  }

  return (
    <div className="card">
      <ReactECharts ref={chartRef} option={option} style={{ height: 350, width: '100%' }} opts={{ renderer: 'svg' }} />
    </div>
  )
}
