import React from 'react'
import Navbar from '../components/layout/Navbar.jsx'
import Hero from '../components/ui/Hero.jsx'
import StatsStrip from '../components/ui/StatsStrip.jsx'
import Services from '../components/ui/Services.jsx'
import LocalSection from '../components/ui/LocalSection.jsx'
import HowItWorks from '../components/ui/HowItWorks.jsx'
import Testimonials from '../components/ui/Testimonials.jsx'
import NGOSection from '../components/ui/NGOSection.jsx'
import ImpactSection from '../components/ui/ImpactSection.jsx'
import Partners from '../components/ui/Partners.jsx'
import Footer from '../components/layout/Footer.jsx'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />
      <StatsStrip />
      <Services />
      <LocalSection />
      <HowItWorks />
      <Testimonials />
      <NGOSection />
      <ImpactSection />
      <Partners />
      <Footer />
    </>
  )
}
