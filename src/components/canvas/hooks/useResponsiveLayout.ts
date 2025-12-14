"use client"

import { useState, useEffect } from "react"

interface ResponsiveLayout {
  isDesktop: boolean   // > 1024px
  isTablet: boolean    // 768-1024px
  isMobile: boolean    // < 768px
  showSidebar: boolean // Desktop only
  showRightPanel: boolean // Desktop and tablet
}

// Get initial layout - mobile-first for SSR to prevent flash
const getInitialLayout = (): ResponsiveLayout => {
  // SSR: default to mobile to prevent layout flash on mobile devices
  if (typeof window === 'undefined') {
    return {
      isDesktop: false,
      isTablet: false,
      isMobile: true,
      showSidebar: false,
      showRightPanel: false,
    }
  }
  // Client: detect actual viewport immediately
  const width = window.innerWidth
  const isDesktop = width > 1024
  const isTablet = width >= 768 && width <= 1024
  const isMobile = width < 768
  return {
    isDesktop,
    isTablet,
    isMobile,
    showSidebar: isDesktop,
    showRightPanel: isDesktop || isTablet,
  }
}

export function useResponsiveLayout(): ResponsiveLayout {
  const [layout, setLayout] = useState<ResponsiveLayout>(getInitialLayout)

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth

      const isDesktop = width > 1024
      const isTablet = width >= 768 && width <= 1024
      const isMobile = width < 768

      setLayout({
        isDesktop,
        isTablet,
        isMobile,
        showSidebar: isDesktop, // Sidebar visible only on desktop
        showRightPanel: isDesktop || isTablet, // Right panel visible on desktop and tablet
      })
    }

    // Initial check
    updateLayout()

    // Listen to resize
    window.addEventListener('resize', updateLayout)
    return () => window.removeEventListener('resize', updateLayout)
  }, [])

  return layout
}
