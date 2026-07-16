"use client"

import { useEffect, useRef } from "react"

/**
 * Aggressively scrolls the window to the top.
 * - Waits for the next paint so the new screen content exists before scrolling.
 * - Re-checks shortly after and forces the scroll again if anything
 *   (late-rendering forms, images, focus jumps) pushed the page back down.
 */
export function scrollToTop(behavior: ScrollBehavior = "smooth") {
    if (typeof window === "undefined") return

    const doScroll = (b: ScrollBehavior) => {
        window.scrollTo({ top: 0, left: 0, behavior: b })
        if (b !== "smooth") {
            document.documentElement.scrollTop = 0
            document.body.scrollTop = 0
        }
    }

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            doScroll(behavior)

            // Enforcement pass: if async content re-rendered and the page is
            // still not at the top shortly after, force it instantly.
            setTimeout(() => {
                if (window.scrollY > 0) doScroll("auto")
            }, 350)
        })
    })
}

/**
 * Scrolls to the top whenever any of the given values change
 * (step number, submitted flag, rejection status, etc).
 * Skips the initial mount so it doesn't fight page-load anchor scrolling.
 *
 * Usage: useScrollToTop([internalStep, applicationSubmitted])
 */
export function useScrollToTop(deps: unknown[], behavior: ScrollBehavior = "smooth") {
    const isFirstRender = useRef(true)

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        scrollToTop(behavior)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
}
