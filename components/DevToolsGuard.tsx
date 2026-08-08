"use client"

import { useEffect } from "react"

/**
 * Discourages casual inspection in production by blocking the right-click
 * context menu and the common DevTools keyboard shortcuts.
 *
 * This is a deterrent only — it cannot truly prevent a determined user from
 * opening DevTools. It stays disabled in development so the team can debug.
 * Mounted once in the root layout.
 */
export default function DevToolsGuard() {
    useEffect(() => {
        if (process.env.NODE_ENV !== "production") return

        const blockContextMenu = (e: MouseEvent) => {
            e.preventDefault()
        }

        const blockShortcuts = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase()

            // F12 -> DevTools
            if (e.key === "F12") {
                e.preventDefault()
                return
            }

            // Ctrl/Cmd + Shift + I / J / C -> DevTools / console / inspect element
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(key)) {
                e.preventDefault()
                return
            }

            // Ctrl/Cmd + U -> view source
            if ((e.ctrlKey || e.metaKey) && key === "u") {
                e.preventDefault()
                return
            }
        }

        document.addEventListener("contextmenu", blockContextMenu)
        document.addEventListener("keydown", blockShortcuts)

        return () => {
            document.removeEventListener("contextmenu", blockContextMenu)
            document.removeEventListener("keydown", blockShortcuts)
        }
    }, [])

    return null
}
