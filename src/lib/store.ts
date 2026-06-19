'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, SectionType } from './types'

interface AppState {
  session: Session | null
  setSession: (s: Session | null) => void
  logout: () => void
  section: SectionType
  setSection: (s: SectionType) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (s) => set({ session: s }),
      logout: () => {
        try {
          localStorage.clear()
          if ('indexedDB' in window) {
            indexedDB.databases?.().then((dbs) => {
              dbs.forEach((db) => indexedDB.deleteDatabase(db.name))
            })
          }
        } catch (e) {
          // ignore
        }
        set({ session: null, section: 'home' })
      },
      section: 'home',
      setSection: (s) => set({ section: s }),
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'school-attendance-session',
      partialize: (state) => ({ session: state.session, section: state.section }),
    }
  )
)
