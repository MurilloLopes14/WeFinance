import { AmbientBackground } from '@/components/landing/ambient-background'
import { LandingCta } from '@/components/landing/landing-cta'
import { LandingDivider } from '@/components/landing/landing-section'
import { LandingFeatures } from '@/components/landing/landing-features'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingHero } from '@/components/landing/landing-hero'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingPrinciples } from '@/components/landing/landing-principles'
import { LandingRoadmap } from '@/components/landing/landing-roadmap'

export function LandingPage() {
  return (
    <div className="dark min-h-dvh overflow-x-clip">
      <AmbientBackground />
      <LandingNavbar />
      <main className="pb-[env(safe-area-inset-bottom)]">
        <LandingHero />
        <LandingDivider />
        <LandingFeatures />
        <LandingDivider />
        <LandingPrinciples />
        <LandingDivider />
        <LandingRoadmap />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  )
}
