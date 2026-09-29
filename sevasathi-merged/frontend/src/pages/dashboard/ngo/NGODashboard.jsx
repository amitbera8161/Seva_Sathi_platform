import React from 'react'
import DashboardLayout from '../../../components/layout/DashboardLayout.jsx'
import { DASH_ICONS } from '../../../components/layout/DashSidebar.jsx'
import OverviewPage from '../OverviewPage.jsx'
import EmergencyPage from '../EmergencyPage.jsx'
import BloodRequestsPage from '../BloodRequestsPage.jsx'
import SettingsPage from '../SettingsPage.jsx'
import BookExchangePage from '../BookExchangePage.jsx'
import { ResourcesPage, VolunteersPage, NGOsPage, AnalyticsPage, CommunityFeedPage } from '../OtherPages.jsx'
import { makeComingSoonPage } from '../ComingSoonPage.jsx'

const { IconGrid, IconAlertTriangle, IconHeart, IconBox, IconBook, IconUsers, IconBuilding, IconCalendar, IconBarChart, IconMessage, IconSettings } = DASH_ICONS

// Posting campaigns/events needs the (Phase 2) Event model.
const CampaignsPage = makeComingSoonPage(
  '📢 Campaigns & Events',
  'Posting and managing campaigns/drives will be available once the Events module is built.'
)

// Platform-wide, read-oriented view of blood requests for NGO coordination.
const BloodRequestsOversightPage = () => <BloodRequestsPage mode="oversight" />

// Platform-wide, read-oriented view of book listings/requests for NGO
// coordination — same 'oversight' mode used for blood requests above.
const BookExchangeOversightPage = () => <BookExchangePage mode="oversight" />

const NAV_SECTIONS = [
  {
    label: 'Organization',
    items: [
      { id: 'overview', Icon: IconGrid, label: 'Overview' },
      { id: 'campaigns', Icon: IconCalendar, label: 'Campaigns & Events' },
      { id: 'volunteers', Icon: IconUsers, label: 'Manage Volunteers' },
      { id: 'emergency', Icon: IconAlertTriangle, label: 'Community Requests' },
      { id: 'bloodRequests', Icon: IconHeart, label: 'Blood Requests' },
      { id: 'books', Icon: IconBook, label: 'Book Exchange' },
      { id: 'resources', Icon: IconBox, label: 'Resources & Donations' },
    ],
  },
  {
    label: 'Network',
    items: [
      { id: 'ngos', Icon: IconBuilding, label: 'NGO Directory' },
      { id: 'feed', Icon: IconMessage, label: 'Community Feed' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { id: 'analytics', Icon: IconBarChart, label: 'Reports & Analytics' },
      { id: 'settings', Icon: IconSettings, label: 'Settings' },
    ],
  },
]

const PAGE_TITLES = {
  overview: 'NGO Dashboard',
  campaigns: 'Campaigns & Events',
  volunteers: 'Manage Volunteers',
  emergency: 'Community Requests',
  bloodRequests: 'Blood Requests',
  books: 'Book Exchange',
  resources: 'Resources & Donations',
  ngos: 'NGO Directory',
  feed: 'Community Feed',
  analytics: 'Reports & Analytics',
  settings: 'Settings',
}

const PAGES = {
  overview: OverviewPage,
  campaigns: CampaignsPage,
  volunteers: VolunteersPage,
  emergency: EmergencyPage,
  bloodRequests: BloodRequestsOversightPage,
  books: BookExchangeOversightPage,
  resources: ResourcesPage,
  ngos: NGOsPage,
  feed: CommunityFeedPage,
  analytics: AnalyticsPage,
  settings: SettingsPage,
}

export default function NGODashboard() {
  return (
    <DashboardLayout
      navSections={NAV_SECTIONS}
      pageTitles={PAGE_TITLES}
      pages={PAGES}
      defaultPage="overview"
    />
  )
}
