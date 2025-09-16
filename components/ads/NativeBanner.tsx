'use client'

import { useEffect, useRef, useState } from 'react'

interface NativeBannerProps {
  className?: string
}

export default function NativeBanner({ className }: NativeBannerProps) {
  const scriptLoadedRef = useRef(false)
  const [adLoaded, setAdLoaded] = useState(false)
  const [scriptError, setScriptError] = useState(false)

  // Adsterra要求的确切容器ID - 必须与脚本中的ID匹配
  const CONTAINER_ID = 'container-e343bb6a5bd995e4c35cdb4241758d93'

  useEffect(() => {
    // 避免重复加载脚本
    if (scriptLoadedRef.current) return

    const loadAdScript = () => {
      // 检查是否已经存在该脚本
      const existingScript = document.querySelector('script[src*="e343bb6a5bd995e4c35cdb4241758d93"]')
      if (existingScript) {
        console.log('[NativeBanner] 脚本已存在，跳过重复加载')
        return
      }

      const script = document.createElement('script')
      script.async = true
      script.setAttribute('data-cfasync', 'false')
      script.src = '//pl27656116.revenuecpmgate.com/e343bb6a5bd995e4c35cdb4241758d93/invoke.js'

      script.onload = () => {
        console.log('[NativeBanner] 广告脚本加载成功')
        scriptLoadedRef.current = true
        setAdLoaded(true)

        // 给广告脚本一些时间来渲染内容
        setTimeout(() => {
          const container = document.getElementById(CONTAINER_ID)
          if (container && container.children.length > 0) {
            console.log('[NativeBanner] 广告内容已加载')
          } else {
            console.warn('[NativeBanner] 广告脚本已加载但容器中无内容')
          }
        }, 2000)
      }

      script.onerror = (error) => {
        console.error('[NativeBanner] 广告脚本加载失败:', error)
        setScriptError(true)
      }

      document.head.appendChild(script)
    }

    // 延迟加载，确保页面主要内容先渲染
    const timer = setTimeout(() => {
      if (document.readyState === 'complete') {
        loadAdScript()
      } else {
        window.addEventListener('load', loadAdScript)
      }
    }, 1000)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('load', loadAdScript)
    }
  }, [])

  return (
    <div className={className}>
      <div
        id={CONTAINER_ID}
        style={{
          minHeight: '120px',
          width: '100%',
          display: 'block',
          backgroundColor: adLoaded ? 'transparent' : '#f8f9fa',
          border: adLoaded ? 'none' : '1px dashed #dee2e6',
          borderRadius: '8px',
          padding: adLoaded ? '0' : '20px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#6c757d',
          transition: 'all 0.3s ease',
          position: 'relative'
        }}
      >
        {/* 仅在广告未加载时显示占位符 */}
        {!adLoaded && !scriptError && (
          <div style={{
            opacity: 0.6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            minHeight: '80px'
          }}>
            <div>🔄 加载广告中...</div>
            <div style={{ fontSize: '12px' }}>Native Banner</div>
          </div>
        )}

        {scriptError && (
          <div style={{
            opacity: 0.5,
            color: '#dc3545',
            fontSize: '12px'
          }}>
            广告加载失败
          </div>
        )}
      </div>
    </div>
  )
}