import { InfoIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface MetricsPanelProps {
  data: {
    revenueLost: number
    usersLost: number
    structuralDecay: number
    orphanedPages: number
    deadLinks: number
    deadEnds: number
  }
}

export function MetricsPanel({ data }: MetricsPanelProps) {
  return (
    <div className="bg-gray-950 border border-gray-900 rounded-md p-4">
      <h2 className="text-lg font-light mb-3 text-green-400">Key Metrics</h2>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">Revenue Impact</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-3 w-3 text-gray-600" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Estimated monthly revenue lost due to site issues. Calculated based on average conversion value,
                    dead links, and orphaned pages.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-xl text-red-500">${data.revenueLost}</div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">Users Lost</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-3 w-3 text-gray-600" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Estimated monthly users lost due to navigation issues. Based on 20 users per dead link and 10 users
                    per orphaned page.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-xl text-red-500">{data.usersLost}</div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">Health Score</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-3 w-3 text-gray-600" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Overall site health percentage. Lower scores indicate more structural issues. Based on the ratio of
                    problematic pages to total pages.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-xl text-red-500">{data.structuralDecay}%</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-900">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Orphaned Pages</span>
          <span className="text-sm text-gray-300">{data.orphanedPages}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Dead Links</span>
          <span className="text-sm text-gray-300">{data.deadLinks}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Dead Ends</span>
          <span className="text-sm text-gray-300">{data.deadEnds}</span>
        </div>
      </div>
    </div>
  )
}
