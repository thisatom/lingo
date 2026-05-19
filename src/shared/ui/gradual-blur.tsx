/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState, useMemo } from 'react'
import './gradual-blur.css'

type BlurPosition = 'top' | 'bottom' | 'left' | 'right'
type BlurPreset = keyof typeof PRESETS

export interface GradualBlurProps {
  position?: BlurPosition
  strength?: number
  height?: string
  width?: string
  divCount?: number
  exponential?: boolean
  zIndex?: number
  animated?: boolean | 'scroll'
  duration?: string
  easing?: string
  opacity?: number
  curve?: keyof typeof CURVE_FUNCTIONS
  responsive?: boolean
  target?: 'parent' | 'page'
  className?: string
  style?: React.CSSProperties
  preset?: BlurPreset
  hoverIntensity?: number
  onAnimationComplete?: () => void
}

const DEFAULT_CONFIG = {
  position: 'bottom' as BlurPosition,
  strength: 2,
  height: '6rem',
  divCount: 5,
  exponential: false,
  zIndex: 1000,
  animated: false as boolean | 'scroll',
  duration: '0.3s',
  easing: 'ease-out',
  opacity: 1,
  curve: 'linear' as keyof typeof CURVE_FUNCTIONS,
  responsive: false,
  target: 'parent' as const,
  className: '',
  style: {}
}

const PRESETS = {
  top: { position: 'top' as const, height: '6rem' },
  bottom: { position: 'bottom' as const, height: '6rem' },
  left: { position: 'left' as const, height: '6rem' },
  right: { position: 'right' as const, height: '6rem' },
  subtle: { height: '4rem', strength: 1, opacity: 0.8, divCount: 3 },
  intense: { height: '10rem', strength: 4, divCount: 8, exponential: true },
  smooth: { height: '8rem', curve: 'bezier' as const, divCount: 10 },
  sharp: { height: '5rem', curve: 'linear' as const, divCount: 4 },
  header: { position: 'top' as const, height: '8rem', curve: 'ease-out' as const },
  footer: { position: 'bottom' as const, height: '8rem', curve: 'ease-out' as const },
  sidebar: { position: 'left' as const, height: '6rem', strength: 2.5 },
  'page-header': { position: 'top' as const, height: '10rem', target: 'page' as const, strength: 3 },
  'page-footer': { position: 'bottom' as const, height: '10rem', target: 'page' as const, strength: 3 }
}

const CURVE_FUNCTIONS = {
  linear: (p: number) => p,
  bezier: (p: number) => p * p * (3 - 2 * p),
  'ease-in': (p: number) => p * p,
  'ease-out': (p: number) => 1 - Math.pow(1 - p, 2),
  'ease-in-out': (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mergeConfigs = (...configs: any[]) =>
  configs.reduce<Record<string, unknown>>((acc, c) => ({ ...acc, ...c }), {})

const getGradientDirection = (position: BlurPosition) =>
  (
    ({
      top: 'to top',
      bottom: 'to bottom',
      left: 'to left',
      right: 'to right'
    }) as const
  )[position] || 'to bottom'

function GradualBlur(props: GradualBlurProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const config = useMemo(() => {
    const presetConfig = props.preset && PRESETS[props.preset] ? PRESETS[props.preset] : {}
    return mergeConfigs(DEFAULT_CONFIG, presetConfig, props)
  }, [props])

  const isVisible = true

  const blurDivs = useMemo(() => {
    const divs: React.ReactNode[] = []
    const increment = 100 / (config.divCount as number)
    const currentStrength =
      isHovered && config.hoverIntensity
        ? (config.strength as number) * (config.hoverIntensity as number)
        : (config.strength as number)

    const curveFunc = CURVE_FUNCTIONS[config.curve as keyof typeof CURVE_FUNCTIONS] || CURVE_FUNCTIONS.linear

    for (let i = 1; i <= (config.divCount as number); i++) {
      let progress = i / (config.divCount as number)
      progress = curveFunc(progress)

      let blurValue: number
      if (config.exponential) {
        blurValue = Math.pow(2, progress * 4) * 0.0625 * currentStrength
      } else {
        blurValue = 0.0625 * (progress * (config.divCount as number) + 1) * currentStrength
      }

      const p1 = Math.round((increment * i - increment) * 10) / 10
      const p2 = Math.round(increment * i * 10) / 10
      const p3 = Math.round((increment * i + increment) * 10) / 10
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10

      let gradient = `transparent ${p1}%, black ${p2}%`
      if (p3 <= 100) gradient += `, black ${p3}%`
      if (p4 <= 100) gradient += `, transparent ${p4}%`

      const direction = getGradientDirection(config.position as BlurPosition)

      divs.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            maskImage: `linear-gradient(${direction}, ${gradient})`,
            WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
            backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
            WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
            opacity: config.opacity as number
          }}
        />
      )
    }

    return divs
  }, [config, isHovered])

  const containerStyle = useMemo(() => {
    const position = config.position as BlurPosition
    const isVertical = ['top', 'bottom'].includes(position)
    const isHorizontal = ['left', 'right'].includes(position)
    const isPageTarget = config.target === 'page'

    const baseStyle: React.CSSProperties = {
      position: isPageTarget ? 'fixed' : 'absolute',
      pointerEvents: 'none',
      opacity: isVisible ? 1 : 0,
      zIndex: isPageTarget ? (config.zIndex as number) + 100 : (config.zIndex as number),
      ...(config.style as React.CSSProperties)
    }

    if (isVertical) {
      baseStyle.height = config.height as string
      baseStyle.width = (config.width as string) || '100%'
      baseStyle[position] = 0
      baseStyle.left = 0
      baseStyle.right = 0
    } else if (isHorizontal) {
      baseStyle.width = (config.width as string) || (config.height as string)
      baseStyle.height = '100%'
      baseStyle[position] = 0
      baseStyle.top = 0
      baseStyle.bottom = 0
    }

    return baseStyle
  }, [config, isVisible])

  return (
    <div
      ref={containerRef}
      className={`gradual-blur gradual-blur-parent pointer-events-none ${config.className as string}`}
      style={containerStyle}
    >
      <div className="gradual-blur-inner">{blurDivs}</div>
    </div>
  )
}

export default React.memo(GradualBlur)
