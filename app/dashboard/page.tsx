"use client";

import FinancialDashboard from '../../components/FinancialDashboard';
import versionData from '@/app/version.json'; // Import version data
export const dynamic = "force-dynamic"; // これを追加

const DashboardPage = () => {
  return <FinancialDashboard version={versionData.apps.dashboard} />;
};

export default DashboardPage;