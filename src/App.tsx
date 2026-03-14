import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SmoothScrollProvider } from './components/SmoothScrollProvider'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { Services } from './components/Services'
import { TelemetryFeed } from './components/TelemetryFeed'
import { Manifesto } from './components/Manifesto'
import { MeetNuke } from './components/MeetNuke'
import { SystemFooter } from './components/SystemFooter'

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
  return (
    <BrowserRouter>
      <div className="bg-black min-h-screen">
        <Navbar />
        {/* NukeCanvas + NukeChatOverlay disabled — 3D model needs rigged armature for proper animation */}
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
