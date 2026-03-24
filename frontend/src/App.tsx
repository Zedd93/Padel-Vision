import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy-loaded pages
const FeedPage = lazy(() => import('@/pages/FeedPage'));
const BrowsePage = lazy(() => import('@/pages/BrowsePage'));
const LivePage = lazy(() => import('@/pages/LivePage'));
const VodPage = lazy(() => import('@/pages/VodPage'));
const ClipsPage = lazy(() => import('@/pages/ClipsPage'));
const ClipDetailPage = lazy(() => import('@/pages/ClipDetailPage'));
const TournamentPage = lazy(() => import('@/pages/TournamentPage'));
const ClubProfilePage = lazy(() => import('@/pages/ClubProfilePage'));
const PlayerProfilePage = lazy(() => import('@/pages/PlayerProfilePage'));
const RankingsPage = lazy(() => import('@/pages/RankingsPage'));
const MapPage = lazy(() => import('@/pages/MapPage'));
const JudgePage = lazy(() => import('@/pages/JudgePage'));
const MultiviewPage = lazy(() => import('@/pages/MultiviewPage'));
const PricingPage = lazy(() => import('@/pages/PricingPage'));
const ForClubsPage = lazy(() => import('@/pages/ForClubsPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const CheckoutSuccessPage = lazy(() => import('@/pages/CheckoutSuccessPage'));
const RecordPage = lazy(() => import('@/pages/RecordPage'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const AccountPage = lazy(() => import('@/pages/AccountPage'));
const SubscriptionsPage = lazy(() => import('@/pages/SubscriptionsPage'));
const WalletPage = lazy(() => import('@/pages/WalletPage'));
const StudioPage = lazy(() => import('@/pages/StudioPage'));
const TournamentsManagePage = lazy(() => import('@/pages/TournamentsManagePage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const EarningsPage = lazy(() => import('@/pages/EarningsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-pv-obsidian">
      <div className="w-8 h-8 border-2 border-pv-lime border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<FeedPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/stream/:id" element={<LivePage />} />
        <Route path="/vods/:id" element={<VodPage />} />
        <Route path="/clips" element={<ClipsPage />} />
        <Route path="/clips/:id" element={<ClipDetailPage />} />
        <Route path="/tournament/:id" element={<TournamentPage />} />
        <Route path="/club/:slug" element={<ClubProfilePage />} />
        <Route path="/player/:slug" element={<PlayerProfilePage />} />
        <Route path="/rankings" element={<RankingsPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/judge" element={<JudgePage />} />
        <Route path="/multiview" element={<MultiviewPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/for-clubs" element={<ForClubsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="/record" element={<RecordPage />} />

        {/* Auth */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />

        {/* Dashboard (protected) */}
        <Route path="/account" element={<AccountPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/wallet" element={<WalletPage />} />

        {/* Club (protected, CLUB role) */}
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/tournaments" element={<TournamentsManagePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/earnings" element={<EarningsPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
