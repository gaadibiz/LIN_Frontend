"use client"

import * as React from "react"
import { UploadIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onFileChange?: (file: File | null) => void
  accept?: string
  placeholder?: string
  file?: File | null
}

const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  ({ className, onFileChange, accept, placeholder = "Click to upload", file, ...props }, ref) => {
    const [fileName, setFileName] = React.useState<string>("")

    React.useEffect(() => {
      if (file && file.size > 0) {
        setFileName(file.name)
      } else {
        setFileName("")
      }
    }, [file])

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0] || null
      setFileName(selectedFile && selectedFile.size > 0 ? selectedFile.name : "")
      onFileChange?.(selectedFile)
    }

    return (
      <div className="relative">
        <input
          type="file"
          ref={ref}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          accept={accept}
          {...props}
        />
        <div
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden",
            className
          )}
        >
          <div className="flex-1 min-w-0 mr-2">
            <span className={cn("text-muted-foreground truncate block w-full", fileName && "text-foreground")}>
              {fileName || placeholder}
            </span>
          </div>
          <UploadIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </div>
    )
  }
)
FileUpload.displayName = "FileUpload"

export { FileUpload }
