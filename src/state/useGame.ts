import { useEffect, useReducer } from 'react'
import { clearRun, loadRun, saveRun } from '../game/storage'
import { appReducer, initAppState } from './gameReducer'

/** Spielzustand mit automatischer Speicherung in localStorage. */
export function useGame() {
  const [state, dispatch] = useReducer(appReducer, null, () => initAppState(loadRun()))

  useEffect(() => {
    if (state.run) saveRun(state.run)
    else clearRun()
  }, [state.run])

  return { state, dispatch }
}
