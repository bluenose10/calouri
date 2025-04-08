
import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile() {
  const [deviceInfo, setDeviceInfo] = React.useState<{
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  }>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  })

  const [forceMobileView, setForceMobileView] = React.useState<boolean>(false)

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setDeviceInfo({
        isMobile: width < MOBILE_BREAKPOINT,
        isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
        isDesktop: width >= TABLET_BREAKPOINT
      })
    }

    // Set initial value
    handleResize()
    
    // Add event listener
    window.addEventListener("resize", handleResize)
    
    // Cleanup
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Toggle mobile view for development/testing
  const toggleMobileView = React.useCallback(() => {
    setForceMobileView(prev => !prev)
  }, [])

  // Check if inside simulator iframe
  const location = typeof window !== 'undefined' ? window.location : undefined
  const isInsideSimulator = location ? new URLSearchParams(location.search).has('_mobilesim') : false

  // Check if running in production environment
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    // Device detection based on screen size
    isMobile: forceMobileView || deviceInfo.isMobile,
    isTablet: !forceMobileView && deviceInfo.isTablet,
    isDesktop: !forceMobileView && deviceInfo.isDesktop,
    
    // For controlling mobile view manually
    systemIsMobile: deviceInfo.isMobile,
    forceMobileView,
    toggleMobileView,
    
    // Environment information
    isInsideSimulator,
    isProduction,
    
    // Constants
    MOBILE_BREAKPOINT
  }
}
