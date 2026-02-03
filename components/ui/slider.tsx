"use client"

/**
 * ⚠️ CRITICAL NOTE - READ BEFORE ANY CHANGES ⚠️
 * 
 * This file contains the shadcn/ui Slider component.
 * 
 * HOWEVER - The I4IGUANA project uses NATIVE HTML INPUT TYPE="RANGE" sliders!
 * NOT this component!
 * 
 * If sliders stop working, check:
 * 1. components/search-settings-modal.tsx - uses <input type="range">
 * 2. components/onboarding-age.tsx - uses <input type="range">
 * 
 * The working slider pattern is:
 * ```
 * <input
 *   type="range"
 *   min="18"
 *   max="80"
 *   value={value}
 *   onChange={(e) => setValue(parseInt(e.target.value))}
 *   className="w-full h-2 appearance-none cursor-pointer
 *     [&::-webkit-slider-thumb]:appearance-none
 *     [&::-webkit-slider-thumb]:w-6
 *     [&::-webkit-slider-thumb]:h-6
 *     [&::-webkit-slider-thumb]:rounded-full
 *     [&::-webkit-slider-thumb]:bg-[#4ade80]
 *     [&::-webkit-slider-thumb]:cursor-pointer
 *     [&::-moz-range-thumb]:w-6
 *     [&::-moz-range-thumb]:h-6
 *     [&::-moz-range-thumb]:rounded-full
 *     [&::-moz-range-thumb]:bg-[#4ade80]"
 * />
 * ```
 * 
 * DO NOT replace this file with SVG or other random content!
 */

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-white/10">
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-[#4ade80] to-[#22c55e]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-6 w-6 rounded-full border-2 border-[#0d2920] bg-[#4ade80] ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-lg cursor-pointer" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
