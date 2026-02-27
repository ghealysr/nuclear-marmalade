import { lazy, Suspense } from 'react'
import { SmoothScrollProvider } from './components/SmoothScrollProvider'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { Services } from './components/Services'
import { TelemetryFeed } from './components/TelemetryFeed'
import { Manifesto } from './components/Manifesto'
import { SystemFooter } from './components/SystemFooter'
// import { RoamingNuke } from './components/RoamingNuke'

const CaseStudies = lazy(() => import('./components/CaseStudies'))

export default function App() {
  return (
    <SmoothScrollProvider>
      <div className="bg-black min-h-screen">
        <Navbar />
        <Hero />
        <Services />
        <Suspense fallback={<div className="h-screen bg-black" />}>
          <CaseStudies />
        </Suspense>
        <TelemetryFeed />
        <Manifesto />
        <SystemFooter />
        {/* <RoamingNuke /> */}
      </div>
    </SmoothScrollProvider>
  )
}
