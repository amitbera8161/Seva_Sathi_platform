import React from 'react'
import DashboardLayout from '../../../components/layout/DashboardLayout.jsx'
import { DASH_ICONS } from '../../../components/layout/DashSidebar.jsx'
import OverviewPage from '../OverviewPage.jsx'
import BloodRequestsPage from '../BloodRequestsPage.jsx'
import SettingsPage from '../SettingsPage.jsx'
import BookExchangePage from '../BookExchangePage.jsx'
import { AnalyticsPage } from '../OtherPages.jsx'
import { makeComingSoonPage } from '../ComingSoonPage.jsx'
import AdminNGOVerificationPage from './AdminNGOVerificationPage.jsx'
import AdminBloodDonorVerificationPage from './AdminBloodDonorVerificationPage.jsx'

const { IconGrid, IconShield, IconUsers, IconHeart, IconBook, IconBarChart, IconSettings } = DASH_ICONS

// User Management still needs new admin-only backend endpoints (list/block
// users) that don't exist yet — out of scope for this phase. Blood
// Management is now real, as of Phase 2.1: platform-wide oversight of
// every BloodRequest, with admin-only cancel power baked into the shared
// BloodRequestsPage component (isAdmin check, no separate page needed).
const UserManagementPage = makeComingSoonPage(
  '👥 User Management',
  'Verifying users, blocking suspicious accounts, and managing roles from here needs new admin endpoints — planned for a later phase.'
)
const BloodManagementPage = () => <BloodRequestsPage mode="oversight" />

// Same pattern for Phase 2.2: platform-wide oversight of every Book
// listing/request, with admin-only cancel power baked into the shared
// BookExchangePage component (isAdmin check, no separate page needed).
const BookManagementPage = () => <BookExchangePage mode="oversight" />

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { id: 'overview', Icon: IconGrid, label: 'Overview' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { id: 'ngoVerification', Icon: IconShield, label: 'NGO Verification' },
      { id: 'users', Icon: IconUsers, label: 'User Management' },
      { id: 'blood', Icon: IconHeart, label: 'Blood Management' },
      { id: 'bloodVerification', Icon: IconShield, label: 'Blood Donor Verification' },
      { id: 'books', Icon: IconBook, label: 'Book Exchange' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'analytics', Icon: IconBarChart, label: 'System Analytics' },
      { id: 'settings', Icon: IconSettings, label: 'Settings' },
    ],
  },
]

const PAGE_TITLES = {
  overview: 'Admin Dashboard',
  ngoVerification: 'NGO Verification',
  users: 'User Management',
  blood: 'Blood Management',
  bloodVerification: 'Blood Donor Verification',
  books: 'Book Exchange',
  analytics: 'System Analytics',
  settings: 'Settings',
}

const PAGES = {
  overview: OverviewPage,
  ngoVerification: AdminNGOVerificationPage,
  users: UserManagementPage,
  blood: BloodManagementPage,
  bloodVerification: AdminBloodDonorVerificationPage,
  books: BookManagementPage,
  analytics: AnalyticsPage,
  settings: SettingsPage,
}

export default function AdminDashboard() {
  return (
    <DashboardLayout
      navSections={NAV_SECTIONS}
      pageTitles={PAGE_TITLES}
      pages={PAGES}
      defaultPage="overview"
    />
  )
}
