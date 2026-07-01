import { useRef } from 'react'

export default function useAutosave(callback: ()=>Promise<void>, delay = 2000){
  const timer = useRef<number|null>(null)
  return {
    trigger(){
      if(timer.current) window.clearTimeout(timer.current)
      // @ts-ignore
      timer.current = window.setTimeout(()=>{ callback() }, delay)
    }
  }
}
