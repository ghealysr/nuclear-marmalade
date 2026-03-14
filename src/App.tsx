import { lazy, Suspense, useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SmoothScrollProvider } from './components/SmoothScrollProvider'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { Services } from './components/Services'
import { TelemetryFeed } from './components/TelemetryFeed'
import { Manifesto } from './components/Manifesto'
import { MeetNuke } from './components/MeetNuke'
import { SystemFooter } from './components/SystemFooter'
import { NukeCanvas } from './components/NukeCanvas'
import { NukeChatOverlay } from './components/NukeChatOverlay'
import { useNukeFlight } from './hooks/useNukeFlight'
import { useNukeChat } from './hooks/useNukeChat'
import { useIsMobile } from './hooks/useIsMobile'

const CaseStudies = lazy(() => import('./components/CaseStudies'))
const BlogIndex = lazy(() => import('./components/BlogIndex'))
const BlogPost = lazy(() => import('./components/BlogPost'))

function HomePage() {
  return (
    <SmoothScrollProvider>
      <div className="bg-black min-h-screen">
        <Hero />
        <Services />
        <Suspense fallback={<div className="h-screen bg-black" />}>
          <CaseStudies />
        </Suspense>
        <TelemetryFeed />
        <MeetNuke />
        <Manifesto />
        <SystemFooter />
      </div>
    </SmoothScrollProvider>
  )
}

export default function App() {
  // Shared state — NukeCanvas (hit area) toggles, NukeChatOverlay consumes
  const [chatOpen, setChatOpen] = useState(false)
  const [hasLanded, setHasLanded] = useState(false)

  const handleModelClick = useCallback(() => {
    setChatOpen((prev) => !prev)
  }, [])

  const handleChatClose = useCallback(() => {
    setChatOpen(false)
  }, [])

  const handleLanded = useCallback(() => {
    setHasLanded(true)
  }, [])

  // Mobile detection — shared across canvas, chat overlay, and flight hook
  const isMobile = useIsMobile()

  // Section-triggered flight — observes scroll position, returns target for model
  const { targetPosition, currentSection } = useNukeFlight(hasLanded, isMobile)

  // Chat state — lifted to App level so both NukeCanvas and NukeChatOverlay can use it
  const { chatState, response, sendMessage, clearResponse } = useNukeChat()

  // Smile visible during streaming responses
  const isSmiling = chatState === 'streaming'

  // Chat is "active" when any bubble/input is visible — suppresses hover tooltip
  const chatActive = chatOpen || chatState !== 'idle' || response.length > 0

  return (
    <BrowserRouter>
      <div className="bg-black min-h-screen">
        <Navbar />
        {/* NukeCanvas disabled — 3D model needs rigged armature for proper animation */}
        {/* <NukeCanvas
          onModelClick={handleModelClick}
          onLanded={handleLanded}
          targetPosition={targetPosition}
          currentSection={currentSection}
          isSmiling={isSmiling}
          chatState={chatState}
          chatActive={chatActive}
          isMobile={isMobile}
        /> */}
        {/* <NukeChatOverlay
          chatOpen={chatOpen}
          onClose={handleChatClose}
          hasLanded={hasLanded}
          currentSection={currentSection}
          chatState={chatState}
          response={response}
          sendMessage={sendMessage}
          clearResponse={clearResponse}
          isMobile={isMobile}
        /> */}
        <Suspense fallback={<div className="h-screen bg-black" />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/blog" element={<BlogIndex />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  )
}
