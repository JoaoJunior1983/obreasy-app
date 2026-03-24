import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 512,
  height: 512,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(to bottom right, #3b82f6, #2563eb)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui',
          fontWeight: 'bold',
          borderRadius: '25%',
        }}
      >
        <svg width="384" height="384" viewBox="0 0 512 512" fill="none">
          <path d="M256 128L384 192V384L256 448L128 384V192L256 128Z" fill="white"/>
          <path d="M256 192V384M192 224V352M320 224V352M160 256H352M160 320H352" stroke="#3b82f6" strokeWidth="16" strokeLinecap="round"/>
          <circle cx="256" cy="288" r="32" fill="#3b82f6"/>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
