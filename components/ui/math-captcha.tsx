"use client"

import React, { useCallback, useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"

interface MathCaptchaProps {
  // Called whenever the answer's correctness changes
  onValidChange: (valid: boolean) => void
  // Change this value to force a new question (e.g. after an OTP is sent)
  resetKey?: number | string
  disabled?: boolean
}

function generateQuestion() {
  const a = Math.floor(Math.random() * 9) + 1
  const b = Math.floor(Math.random() * 9) + 1
  return { a, b }
}

export function MathCaptcha({ onValidChange, resetKey, disabled = false }: MathCaptchaProps) {
  const [question, setQuestion] = useState<{ a: number; b: number } | null>(null)
  const [answer, setAnswer] = useState("")

  const refresh = useCallback(() => {
    setQuestion(generateQuestion())
    setAnswer("")
    onValidChange(false)
  }, [onValidChange])

  // Generate on the client only to avoid hydration mismatches from Math.random
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 2)
    setAnswer(value)
    onValidChange(!!question && value !== "" && Number(value) === question.a + question.b)
  }

  const isWrong = !!question && answer.length > 0 && Number(answer) !== question.a + question.b

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Security check: solve to continue
      </label>
      <div className="flex items-center gap-3">
        <div className="h-12 min-w-[96px] px-4 flex items-center justify-center rounded-md border border-gray-300 bg-gray-50 text-lg font-bold text-gray-800 select-none tracking-wider">
          {question ? `${question.a} + ${question.b} =` : "…"}
        </div>
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="?"
          value={answer}
          onChange={handleChange}
          disabled={disabled}
          className="h-12 w-20 text-center text-base font-medium"
          aria-label="Captcha answer"
        />
        <button
          type="button"
          onClick={refresh}
          disabled={disabled}
          className="p-2 text-gray-500 hover:text-red-600 disabled:opacity-50"
          aria-label="New question"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
      {isWrong && <p className="text-red-500 text-sm mt-1">Incorrect answer, please try again.</p>}
    </div>
  )
}
