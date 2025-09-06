import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KPICards } from '../analytics/kpi-cards';
import { IssueTrendsChart } from '../analytics/issue-trends-chart';
import { CategoryDistribution } from '../analytics/category-distribution';
import { ResolutionTimeChart } from '../analytics/resolution-time-chart';
import { Download, RefreshCw } from 'lucide-react';

export default function AnalyticsDashboard() {
  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['/api/analytics'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleExport = () => {
    if (!analytics) return;
    
    const csvData = [
      ['Metric', 'Value'],
      ['Total Issues', analytics.kpis.totalIssues],
      ['Resolved Issues', analytics.kpis.resolvedIssues],
      ['Pending Issues', analytics.kpis.pendingIssues],
      ['Resolution Rate', `${analytics.kpis.resolutionRate.toFixed(1)}%`],
      ['Average Resolution Time (hours)', analytics.kpis.avgResolutionTime],
      ['Active Users', analytics.kpis.activeUsers],
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `civic-connect-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" disabled>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                  <div className="space-y-2">
                    <div className="h-2 bg-muted rounded"></div>
                    <div className="h-2 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load analytics data</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh-analytics">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} data-testid="button-export-analytics">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards data={analytics.kpis} />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IssueTrendsChart data={analytics.trendData} />
        <CategoryDistribution data={analytics.categoryDistribution} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ResolutionTimeChart data={analytics.resolutionTimeByCategory} />
      </div>
    </div>
  );
}
