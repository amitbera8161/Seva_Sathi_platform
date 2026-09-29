import React from 'react'
import DashboardLayout from '../../../components/layout/DashboardLayout.jsx'
import { DASH_ICONS } from '../../../components/layout/DashSidebar.jsx'
import OverviewPage from '../OverviewPage.jsx'
import BloodNetworkPage from '../BloodNetworkPage.jsx'
import BloodRequestsPage from '../BloodRequestsPage.jsx'
import MyBloodDonorProfilePage from '../MyBloodDonorProfilePage.jsx'
import EmergencyPage from '../EmergencyPage.jsx'
import SettingsPage from '../SettingsPage.jsx'
import BookExchangePage from '../BookExchangePage.jsx'
import { ResourcesPage, VolunteersPage, CommunityFeedPage } from '../OtherPages.jsx'
import { makeComingSoonPage } from '../ComingSoonPage.jsx'

const { IconGrid, IconAlertTriangle, IconHeart, IconBox, IconBook, IconUsers, IconMessage, IconCalendar, IconCheckSquare, IconSettings } = DASH_ICONS

// Opportunities page (NGO events/campaigns) needs the Event model, which
// is Phase 2 — placeholder until then. Everything else (emergency
// requests to help with, blood donor registration, resource
// distribution, the volunteer directory) is real and reused as-is.
const OpportunitiesPage = makeComingSoonPage(
  '🗓️ Volunteer Opportunities',
  'NGO campaigns and events will appear here once the Events module is built. In the meantime, respond to open Emergency Requests to start helping.'
)

// Requests where this volunteer (as a registered blood donor) was
// auto-matched — separate from the "Blood Donation" tab, which is about
// managing their donor profile, not responding to a specific request.
const BloodRequestsMatchedPage = () => <BloodRequestsPage mode="donor" />

// Volunteers can both donate and request books like any community
// member — full access, same as Beneficiaries — reusing the same shared
// page rather than building a volunteer-specific variant.
const BookSupportPage = () => <BookExchangePage mode="full" />

const NAV_SECTIONS = [
  {
    label: 'Volunteer',
    items: [
      { id: 'overview', Icon: IconGrid, label: 'Overview' },
      { id: 'opportunities', Icon: IconCalendar, label: 'Opportunities' },
      { id: 'emergency', Icon: IconAlertTriangle, label: 'Emergency Requests' },
      { id: 'blood', Icon: IconHeart, label: 'Blood Donation' },
      { id: 'myDonorProfile', Icon: IconCheckSquare, label: 'My Donor Profile' },
      { id: 'bloodRequests', Icon: IconCheckSquare, label: 'Blood Requests' },
      { id: 'books', Icon: IconBook, label: 'Book Exchange' },
      { id: 'resources', Icon: IconBox, label: 'Resource Distribution' },
    ],
  },
  {
    label: 'Community',
    items: [
      { id: 'volunteers', Icon: IconUsers, label: 'Fellow Volunteers' },
      { id: 'feed', Icon: IconMessage, label: 'Community Feed' },
    ],
  },
  {
    label: 'Account',
    items: [
      { id: 'settings', Icon: IconSettings, label: 'Settings' },
    ],
  },
]

const PAGE_TITLES = {
  overview: 'Volunteer Dashboard',
  opportunities: 'Opportunities',
  emergency: 'Emergency Requests',
  blood: 'Blood Donation',
  myDonorProfile: 'My Donor Profile',
  bloodRequests: 'Blood Requests',
  books: 'Book Exchange',
  resources: 'Resource Distribution',
  volunteers: 'Fellow Volunteers',
  feed: 'Community Feed',
  settings: 'Settings',
}

const PAGES = {
  overview: OverviewPage,
  opportunities: OpportunitiesPage,
  emergency: EmergencyPage,
  blood: BloodNetworkPage,
  myDonorProfile: MyBloodDonorProfilePage,
  bloodRequests: BloodRequestsMatchedPage,
  books: BookSupportPage,
  resources: ResourcesPage,
  volunteers: VolunteersPage,
  feed: CommunityFeedPage,
  settings: SettingsPage,
}

export default function VolunteerDashboard() {
  return (
    <DashboardLayout
      navSections={NAV_SECTIONS}
      pageTitles={PAGE_TITLES}
      pages={PAGES}
      defaultPage="overview"
    />
  )
}
