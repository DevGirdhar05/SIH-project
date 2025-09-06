import { useAuth } from "../hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, AlertTriangle, TrendingUp, Plus, Search } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user } = useAuth();
  
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/analytics/overview'],
    queryFn: () => apiClient.getAnalytics(),
    enabled: user?.role !== 'CITIZEN',
  });

  const statsCards = [
    {
      title: "Issues Resolved",
      value: stats?.byStatus?.RESOLVED || 0,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "In Progress",
      value: stats?.byStatus?.IN_PROGRESS || 0,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Pending Review",
      value: stats?.byStatus?.SUBMITTED || 0,
      icon: AlertTriangle,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Issues",
      value: stats?.total || 0,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center py-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Report. Track. Resolve.
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Your voice matters. Help improve our city by reporting civic issues and tracking their resolution in real-time.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/report">
            <Button size="lg" className="btn-primary" data-testid="button-report-issue">
              <Plus className="mr-2 h-5 w-5" />
              Report an Issue
            </Button>
          </Link>
          <Link href="/track">
            <Button size="lg" variant="outline" data-testid="button-track-issues">
              <Search className="mr-2 h-5 w-5" />
              Track My Issues
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats - Show for all users but different data for different roles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Issues Map Preview */}
      <Card className="border border-border">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Issues Near You</h2>
          {/* Mock map container */}
          <div className="w-full h-64 bg-muted rounded-lg relative overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
              alt="City map view showing issue locations" 
              className="w-full h-full object-cover" 
            />
            
            {/* Mock issue markers */}
            <div className="absolute top-12 left-16 w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
            <div className="absolute top-20 right-20 w-3 h-3 bg-warning rounded-full animate-pulse"></div>
            <div className="absolute bottom-16 left-1/3 w-3 h-3 bg-success rounded-full"></div>
            <div className="absolute bottom-20 right-1/4 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-card/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">Interactive map will load here</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
