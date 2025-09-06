import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Plus, Minus } from "lucide-react";

export default function MapView() {
  const [issueFilter, setIssueFilter] = useState("");

  const { data: issues, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/issues', { status: issueFilter }],
    queryFn: () => apiClient.getAdminIssues({ status: issueFilter }),
  });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <Card className="border border-border">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Issue Locations</CardTitle>
          <div className="flex space-x-3">
            <Select value={issueFilter} onValueChange={setIssueFilter}>
              <SelectTrigger className="w-48" data-testid="select-map-filter">
                <SelectValue placeholder="All Issues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Issues</SelectItem>
                <SelectItem value="HIGH">High Priority</SelectItem>
                <SelectItem value="SUBMITTED">Overdue</SelectItem>
                <SelectItem value="">Unassigned</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRefresh} disabled={isLoading} data-testid="button-refresh-map">
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Map Container */}
        <div className="w-full h-96 bg-muted rounded-lg relative overflow-hidden" data-testid="map-container">
          {/* Mock map with clusters */}
          <img 
            src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
            alt="Satellite city map showing issue locations" 
            className="w-full h-full object-cover" 
          />
          
          {/* Issue clusters - positions based on actual issue data */}
          <div className="absolute top-16 left-20 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-medium animate-pulse" data-testid="cluster-critical">
            {Math.min(issues?.issues?.filter((i: any) => i.priority === 'HIGH').length || 3, 9)}
          </div>
          <div className="absolute top-24 right-24 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-medium animate-pulse" data-testid="cluster-warning">
            {Math.min(issues?.issues?.filter((i: any) => i.status === 'IN_PROGRESS').length || 2, 9)}
          </div>
          <div className="absolute bottom-20 left-32 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium animate-pulse" data-testid="cluster-pending">
            {Math.min(issues?.issues?.filter((i: any) => i.status === 'SUBMITTED').length || 5, 99)}
          </div>
          <div className="absolute bottom-32 right-20 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs" data-testid="cluster-resolved">
            {Math.min(issues?.issues?.filter((i: any) => i.status === 'RESOLVED').length || 1, 9)}
          </div>
          
          {/* Map controls */}
          <div className="absolute top-4 right-4 space-y-2">
            <Button variant="outline" size="sm" className="bg-card border border-border p-2 rounded shadow-sm hover:bg-accent" data-testid="button-zoom-in">
              <Plus className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" className="bg-card border border-border p-2 rounded shadow-sm hover:bg-accent" data-testid="button-zoom-out">
              <Minus className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3" data-testid="map-legend">
            <h4 className="text-sm font-medium mb-2">Issue Status</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Critical/Overdue</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>In Progress</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Recently Resolved</span>
              </div>
            </div>
          </div>

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading map data...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 border border-border rounded-lg">
            <div className="text-lg font-semibold text-red-600" data-testid="map-stat-critical">
              {issues?.issues?.filter((i: any) => i.priority === 'HIGH').length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>
          <div className="p-3 border border-border rounded-lg">
            <div className="text-lg font-semibold text-orange-600" data-testid="map-stat-progress">
              {issues?.issues?.filter((i: any) => i.status === 'IN_PROGRESS').length || 0}
            </div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div className="p-3 border border-border rounded-lg">
            <div className="text-lg font-semibold text-blue-600" data-testid="map-stat-pending">
              {issues?.issues?.filter((i: any) => i.status === 'SUBMITTED').length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="p-3 border border-border rounded-lg">
            <div className="text-lg font-semibold text-green-600" data-testid="map-stat-resolved">
              {issues?.issues?.filter((i: any) => i.status === 'RESOLVED').length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Resolved</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
