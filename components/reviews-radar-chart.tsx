'use client'

import React from 'react'

interface RadarChartProps {
  humanScores: {
    impact: number
    feasibility: number
    team: number
    innovation: number
    market: number
  }
  aiScores?: {
    impact: number
    feasibility: number
    team: number
    innovation: number
    market: number
  } | null
}

export default function ReviewsRadarChart({ humanScores, aiScores }: RadarChartProps) {
  const dimensions = [
    { key: 'impact', label: 'Impact' },
    { key: 'feasibility', label: 'Feasibility' },
    { key: 'team', label: 'Team' },
    { key: 'innovation', label: 'Innovation' },
    { key: 'market', label: 'Market' },
  ]

  const size = 300
  const center = size / 2
  const rMax = 100 // max radius corresponding to score 10

  // Helper to compute coordinate for a dimension index and score
  const getCoordinates = (index: number, score: number) => {
    const angle = (index * 2 * Math.PI) / dimensions.length - Math.PI / 2
    const radius = (score / 10) * rMax
    const x = center + radius * Math.cos(angle)
    const y = center + radius * Math.sin(angle)
    return { x, y }
  }

  // Draw pentagon grid lines for scores 2, 4, 6, 8, 10
  const gridLevels = [2, 4, 6, 8, 10]
  const gridPolygons = gridLevels.map((level) => {
    const points = dimensions.map((_, idx) => {
      const { x, y } = getCoordinates(idx, level)
      return `${x},${y}`
    }).join(' ')
    return points
  })

  // Get points for human scores
  const humanPoints = dimensions.map((dim, idx) => {
    const score = humanScores[dim.key as keyof typeof humanScores] || 0
    const { x, y } = getCoordinates(idx, score)
    return `${x},${y}`
  }).join(' ')

  // Get points for AI scores
  const aiPoints = aiScores
    ? dimensions.map((dim, idx) => {
        const score = aiScores[dim.key as keyof typeof aiScores] || 0
        const { x, y } = getCoordinates(idx, score)
        return `${x},${y}`
      }).join(' ')
    : ''

  // Labels rendering
  const labelRadius = rMax + 20
  const labels = dimensions.map((dim, idx) => {
    const angle = (idx * 2 * Math.PI) / dimensions.length - Math.PI / 2
    const x = center + labelRadius * Math.cos(angle)
    const y = center + labelRadius * Math.sin(angle)
    
    // adjust text alignment based on coordinates
    let textAnchor = 'middle'
    if (Math.cos(angle) > 0.1) textAnchor = 'start'
    if (Math.cos(angle) < -0.1) textAnchor = 'end'
    
    return {
      label: dim.label,
      x,
      y: y + 4, // slight vertical offset
      textAnchor,
    }
  })

  return (
    <div className="flex flex-col items-center justify-center bg-slate-950/30 border border-slate-800 rounded-2xl p-6">
      <h4 className="text-xs font-bold text-slate-350 uppercase tracking-widest mb-4">Gate Review Breakdown</h4>
      <svg width={size} height={size} className="relative z-10 overflow-visible">
        {/* Draw background grid lines */}
        {gridPolygons.map((points, idx) => (
          <polygon
            key={idx}
            points={points}
            fill="none"
            stroke="rgba(71, 85, 105, 0.25)"
            strokeWidth="1"
          />
        ))}

        {/* Draw axes lines */}
        {dimensions.map((_, idx) => {
          const { x, y } = getCoordinates(idx, 10)
          return (
            <line
              key={idx}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(71, 85, 105, 0.25)"
              strokeWidth="1"
            />
          );
        })}

        {/* Human Reviews Polygon */}
        {humanPoints && (
          <polygon
            points={humanPoints}
            fill="rgba(59, 130, 246, 0.15)"
            stroke="rgba(59, 130, 246, 0.85)"
            strokeWidth="2.5"
            className="animate-pulse"
          />
        )}

        {/* AI Reviews Polygon */}
        {aiScores && aiPoints && (
          <polygon
            points={aiPoints}
            fill="rgba(245, 158, 11, 0.1)"
            stroke="rgba(245, 158, 11, 0.8)"
            strokeWidth="2"
            strokeDasharray="4,4"
          />
        )}

        {/* Human data points */}
        {dimensions.map((dim, idx) => {
          const score = humanScores[dim.key as keyof typeof humanScores] || 0
          const { x, y } = getCoordinates(idx, score)
          return (
            <circle
              key={`h-${idx}`}
              cx={x}
              cy={y}
              r="4"
              className="fill-blue-500 stroke-slate-900 stroke-2"
            />
          )
        })}

        {/* AI data points */}
        {aiScores && dimensions.map((dim, idx) => {
          const score = aiScores[dim.key as keyof typeof aiScores] || 0
          const { x, y } = getCoordinates(idx, score)
          return (
            <circle
              key={`ai-${idx}`}
              cx={x}
              cy={y}
              r="3.5"
              className="fill-amber-500 stroke-slate-900 stroke-2"
            />
          )
        })}

        {/* Render text labels */}
        {labels.map((lbl, idx) => (
          <text
            key={idx}
            x={lbl.x}
            y={lbl.y}
            textAnchor={lbl.textAnchor}
            className="text-[10px] fill-slate-400 font-bold uppercase tracking-wide"
          >
            {lbl.label}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-6 text-[10px] font-semibold text-slate-450">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-blue-500 border border-slate-900" />
          <span>Human Review Average</span>
        </div>
        {aiScores && (
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-amber-500 border border-slate-900" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
            <span>AI Pre-evaluation</span>
          </div>
        )}
      </div>
    </div>
  )
}
