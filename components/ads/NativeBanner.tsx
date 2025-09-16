'use client'

import { useEffect } from 'react'

interface NativeBannerProps {
  className?: string
}

export default function NativeBanner({ className }: NativeBannerProps) {
  useEffect(() => {
    // 动态加载广告脚本
    const script = document.createElement('script')
    script.async = true
    script.setAttribute('data-cfasync', 'false')
    script.src = '//pl27656116.revenuecpmgate.com/e343bb6a5bd995e4c35cdb4241758d93/invoke.js'

    document.head.appendChild(script)

    return () => {
      // 清理脚本
      document.head.removeChild(script)
    }
  }, [])

  return (
    <div className={className}>
      <div id="container-e343bb6a5bd995e4c35cdb4241758d93" />
    </div>
  )
}