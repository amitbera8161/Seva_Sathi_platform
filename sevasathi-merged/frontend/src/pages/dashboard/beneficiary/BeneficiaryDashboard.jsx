import React from 'react'
import DashboardLayout from '../../../components/layout/DashboardLayout.jsx'
import { DASH_ICONS } from '../../../components/layout/DashSidebar.jsx'
import OverviewPage from '../OverviewPage.jsx'
import BloodRequestsPage from '../BloodRequestsPage.jsx'
import EmergencyPage from '../EmergencyPage.jsx'
import SettingsPage from '../SettingsPage.jsx'
import BookExchangePage from '../BookExchangePage.jsx'
import { ResourcesPage, CommunityFeedPage } from '../OtherPages.jsx'

const { IconGrid, IconHeart, IconAlertTriangle, IconBox, IconBook, IconMessage, IconSettings } = DASH_ICONS

// Patient-side blood requests (create/track/cancel) — this replaces the
// old donor-search page here, since the spec's "Blood Support" feature
// for Beneficiaries means requesting blood, not browsing donors.
const BloodSupportPage = () => <BloodRequestsPage mode="patient" />

// Book donation/search/requests are their own dedicated module (Phase
// 2.2) — separate from the generic Resource Exchange page, which still
// covers non-book resources (food, clothes, medicine, tuition).
const BookSupportPage = () => <BookExchangePage mode="full" />

// People seeking help: create/track requests, find blood donors, browse
// books/resources, manage profile. Every page here is reused as-is from
// the shared dashboard page set — nothing role-specific needed rebuilding.
const NAV_SECTIONS = [
  {
    label: 'Get Help',
    items: [
      { id: 'overview', Icon: IconGrid, label: 'Overview' },
      { id: 'blood', Icon: IconHeart, label: 'Blood Support' },
      { id: 'emergency', Icon: IconAlertTriangle, label: 'Emergency Support' },
      { id: 'books', Icon: IconBook, label: 'Book Exchange' },
      { id: 'resources', Icon: IconBox, label: 'Resource Support' },
    ],
  },
  {
    label: 'Community',
    items: [
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
  overview: 'My Dashboard',
  blood: 'Blood Support',
  emergency: 'Emergency Support',
  books: 'Book Exchange',
  resources: 'Resource Support',
  feed: 'Community Feed',
  settings: 'Settings',
}

const PAGES = {
  overview: OverviewPage,
  blood: BloodSupportPage,
  emergency: EmergencyPage,
  books: BookSupportPage,
  resources: ResourcesPage,
  feed: CommunityFeedPage,
  settings: SettingsPage,
}

export default function BeneficiaryDashboard() {
  return (
    <DashboardLayout
      navSections={NAV_SECTIONS}
      pageTitles={PAGE_TITLES}
      pages={PAGES}
      defaultPage="overview"
    />
  )
}
