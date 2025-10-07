import { GhostIcon } from "lucide-react"
import { useState, useEffect } from "react"

interface LoadingScreenProps {
  progress?: number
  message?: string
  url?: string
}

const loadingMessages = [
  "The spirits whisper in the digital void...",
  "Ancient pathways are being mapped...",
  "The spirits trace forgotten connections...",
  "Digital echoes reveal hidden structures...",
  "The spirits commune with the ethereal network...",
  "Lost pages emerge from the digital shadows...",
  "The spirits weave through the web's tapestry...",
  "Digital phantoms dance between domains...",
  "The spirits chart the realm's hidden geometry...",
  "Ethereal connections materialize in the void...",
  "The spirits navigate the labyrinth of links...",
  "Digital spirits commune with the network's soul...",
  "The spirits reveal the site's hidden architecture...",
  "Echoes of forgotten pages call from the void...",
  "The spirits map the digital realm's true form..."
]

export function LoadingScreen({ progress, message, url }: LoadingScreenProps) {
  const [currentMessage, setCurrentMessage] = useState(loadingMessages[0])
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2000) // Change message every 2 seconds

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setCurrentMessage(loadingMessages[messageIndex])
  }, [messageIndex])

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <GhostIcon className="h-16 w-16 text-green-400 animate-pulse opacity-80" />
          <h2 className="text-xl sm:text-2xl font-light mt-4 text-white text-center min-h-[3rem] flex items-center transition-opacity duration-500">
            {message || currentMessage}
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
              {progress < 100 ? `${currentMessage} ${progress}% complete` : "The spirits are preparing their revelation..."}
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
          <p className="transition-opacity duration-500">
            {progress === 100 
              ? "The spirits have completed their journey... The digital realm awaits your exploration..."
              : "The digital realm reveals its secrets to those who wait... The spirits are patient, but they will speak."
            }
          </p>
        </div>
      </div>
    </div>
  )
}
