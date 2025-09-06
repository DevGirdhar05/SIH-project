import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';

interface KPICardsProps {
  data: {
    totalIssues: number;
    resolvedIssues: number;
    pendingIssues: number;
    avgResolutionTime: number;
    activeUsers: number;
    highPriorityIssues: number;
    resolutionRate: number;
    trends: {
      totalIssues: number;
      resolvedIssues: number;
      avgResolutionTime: number;
      activeUsers: number;
    };
  };
}

export function KPICards({ data }: KPICardsProps) {
  const kpis = [
    {
      title: 'Total Issues',
      value: data.totalIssues,
      trend: data.trends.totalIssues,
      icon: AlertTriangle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Resolved Issues',
      value: data.resolvedIssues,
      trend: data.trends.resolvedIssues,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Pending Issues',
      value: data.pendingIssues,
      trend: data.totalIssues - data.resolvedIssues - data.pendingIssues,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Avg Resolution Time',
      value: `${data.avgResolutionTime}h`,
      trend: data.trends.avgResolutionTime,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      isTime: true,
    },
    {
      title: 'Active Users',
      value: data.activeUsers,
      trend: data.trends.activeUsers,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Resolution Rate',
      value: `${data.resolutionRate.toFixed(1)}%`,
      trend: data.trends.resolvedIssues - data.trends.totalIssues,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      isPercentage: true,
    },
  ];

  const getTrendIcon = (trend: number, isTime = false) => {
    if (trend > 0) {
      return isTime ? TrendingUp : TrendingUp; // For time, up is bad
    } else if (trend < 0) {
      return isTime ? TrendingDown : TrendingDown; // For time, down is good
    }
    return Minus;
  };

  const getTrendColor = (trend: number, isTime = false) => {
    if (trend > 0) {
      return isTime ? 'text-red-500' : 'text-green-500';
    } else if (trend < 0) {
      return isTime ? 'text-green-500' : 'text-red-500';
    }
    return 'text-gray-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {kpis.map((kpi, index) => {
        const IconComponent = kpi.icon;
        const TrendIcon = getTrendIcon(kpi.trend, kpi.isTime);
        const trendColor = getTrendColor(kpi.trend, kpi.isTime);

        return (
          <Card key={index} data-testid={`kpi-card-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <IconComponent className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`kpi-value-${index}`}>
                {kpi.value}
              </div>
              {kpi.trend !== 0 && (
                <div className="flex items-center mt-2">
                  <TrendIcon className={`h-3 w-3 mr-1 ${trendColor}`} />
                  <span className={`text-xs ${trendColor}`}>
                    {Math.abs(kpi.trend)}{kpi.isPercentage ? '%' : ''}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    vs last period
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}