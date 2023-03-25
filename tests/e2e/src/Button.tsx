import { type ComponentPropsWithoutRef, type FC } from 'react'

type Props =
  | ComponentPropsWithoutRef<'button'> & {
      width: number
      color?: 'black' | 'white'
    }

export const Button: FC<Props> = ({
  width = 48,
  color = 'black',
  children,
  ...props
}) => {
  return (
    <button
      style={{ width: `${width}px` }}
      className={`focus:outline-none active:ring-2 active:ring-slate-400 active:ring-offset-2 active:ring-offset-slate-50 font-semibold h-12 rounded-lg flex items-center justify-center ${
        color === 'black'
          ? 'bg-slate-900 enabled:hover:bg-slate-700 text-white disabled:opacity-25'
          : 'bg-white enabled:hover:bg-slate-100 border-2 border-slate-900 enabled:hover:border-slate-700 text-slate-900 disabled:opacity-25'
      }`}
      {...props}
    >
      {children}
    </button>
  )
}
