import { FC, ReactNode } from 'react'

type LayoutProps = {
  children: ReactNode
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  return (
    <div className="text-gray-700 flex min-h-screen flex-col items-center justify-center font-mono text-sm bg-lime-300">
      <h1 className="text-4xl font-bold">
        Soundfont2 Synth Audio Worklet Demo
      </h1>
      {children}
    </div>
  )
}
