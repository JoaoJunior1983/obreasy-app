import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-all outline-none",
        "border-input dark:bg-input dark:border-border",
        "placeholder:text-muted-foreground",
        "hover:dark:bg-input/80 hover:dark:border-border/80",
        "focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[3px] focus-visible:dark:bg-input/90",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
