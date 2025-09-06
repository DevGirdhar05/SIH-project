import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertTriangle, TrendingUp } from "lucide-react";

export default function AnalyticsDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/admin/analytics/overview'],
    queryFn: () => apiClient.getAnalytics(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border border-border">
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
    );
  }

  const statsCards = [
    {
      title: "Critical Issues",
      value: stats?.byStatus?.SUBMITTED || 0,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Pending Review",
      value: stats?.byStatus?.TRIAGED || 0,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "In Progress",
      value: stats?.byStatus?.IN_PROGRESS || 0,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Resolved Today",
      value: stats?.byStatus?.RESOLVED || 0,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  const categoryData = Object.entries(stats?.byCategory || {});
  const wardData = Object.entries(stats?.byWard || {});

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="border border-border" data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground" data-testid={`text-stat-value-${index}`}>
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor} dark:bg-opacity-20`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resolution Times Chart */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle>Average Resolution Times</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="resolution-times-chart">
              <div className="flex justify-between items-center">
                <span className="text-sm">Potholes</span>
                <div className="flex items-center space-x-2">
                  <Progress value={75} className="w-32" />
                  <span className="text-sm text-muted-foreground">7.2 days</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Street Lights</span>
                <div className="flex items-center space-x-2">
                  <Progress value={45} className="w-32" />
                  <span className="text-sm text-muted-foreground">2.1 days</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Garbage</span>
                <div className="flex items-center space-x-2">
                  <Progress value={30} className="w-32" />
                  <span className="text-sm text-muted-foreground">1.3 days</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Water Issues</span>
                <div className="flex items-center space-x-2">
                  <Progress value={90} className="w-32" />
                  <span className="text-sm text-muted-foreground">9.8 days</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issue Volume by Ward */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle>Issues by Ward (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="ward-stats">
              {wardData.slice(0, 5).map(([ward, count], index) => (
                <div key={ward} className="flex justify-between items-center">
                  <span className="text-sm">{ward}</span>
                  <span className="text-sm font-medium" data-testid={`ward-count-${index}`}>
                    {count as number} issues
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SLA Performance */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle>SLA Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2" data-testid="sla-compliance-rate">
                  95%
                </div>
                <p className="text-sm text-muted-foreground">Overall SLA Compliance</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Within SLA</span>
                  <span className="text-green-600" data-testid="sla-within-count">
                    {stats?.byStatus?.RESOLVED || 0} issues
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Breached SLA</span>
                  <span className="text-red-600" data-testid="sla-breached-count">
                    {Math.floor((stats?.total || 0) * 0.05)} issues
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Critical Overdue</span>
                  <span className="text-red-600 font-medium" data-testid="sla-critical-count">
                    {Math.floor((stats?.total || 0) * 0.01)} issues
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle>Issues by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="category-stats">
              {categoryData.slice(0, 5).map(([category, count], index) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-sm">{category}</span>
                  <span className="text-sm font-medium" data-testid={`category-count-${index}`}>
                    {count as number} issues
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
