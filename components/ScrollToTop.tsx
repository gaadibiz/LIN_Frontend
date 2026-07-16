"use client"

import { Suspense, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

function ScrollToTopInner() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        // Anchor links (/page#section) should land on their section, not the top
        if (window.location.hash) return
        window.scrollTo({ top: 0, left: 0, behavior: "instant" })
    }, [pathname, searchParams])

    return null
}

/**
 * Guarantees every route change starts at the top of the page,
 * regardless of where the user was scrolled on the previous page.
 * Mounted once in the root layout.
 */
export default function ScrollToTop() {
    return (
        <Suspense fallback={null}>
            <ScrollToTopInner />
        </Suspense>
    )
}
