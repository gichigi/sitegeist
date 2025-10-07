import { GhostIcon } from "lucide-react"

interface LoadingScreenProps {
  progress?: number
  message?: string
  url?: string
}

export function LoadingScreen({ progress, message, url }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <GhostIcon className="h-16 w-16 text-green-400 animate-pulse opacity-80" />
          <h2 className="text-xl sm:text-2xl font-light mt-4 text-white">
            {message || "Summoning digital spirits..."}
          </h2>

          {url && <p className="text-green-400 text-sm mt-2 break-all text-center">{url}</p>}
        </div>

        {typeof progress === "number" && (
          <div className="space-y-2">
            <div className="w-full bg-gray-900 rounded-md h-2">
              <div
                className="bg-green-500 h-2 rounded-md transition-all duration-300"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
            <p className="text-gray-500 text-xs text-center">
              {progress < 100 ? `Mapping the structure... ${progress}% complete` : "Preparing visualization..."}
            </p>
          </div>
        )}

        <div className="pt-8">
          <div className="flex space-x-2 justify-center">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-ping" style={{ animationDelay: "0ms" }}></div>
            <div className="h-2 w-2 bg-green-400 rounded-full animate-ping" style={{ animationDelay: "300ms" }}></div>
            <div className="h-2 w-2 bg-green-400 rounded-full animate-ping" style={{ animationDelay: "600ms" }}></div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 mt-8">
          <p>"The digital realm reveals its secrets to those who wait..."</p>
        </div>
      </div>
    </div>
  )
}
