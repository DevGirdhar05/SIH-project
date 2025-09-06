import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ResolutionTimeData {
  category: string;
  avgTime: number;
  target: number;
}

interface ResolutionTimeChartProps {
  data: ResolutionTimeData[];
}

export function ResolutionTimeChart({ data }: ResolutionTimeChartProps) {
  return (
    <Card data-testid="resolution-time-chart">
      <CardHeader>
        <CardTitle>Average Resolution Time by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="category" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)} hours`, 
                  name === 'avgTime' ? 'Actual Time' : 'Target Time'
                ]}
              />
              <Bar 
                dataKey="avgTime" 
                fill="#2563eb" 
                name="Actual Time"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="target" 
                fill="#16a34a" 
                name="Target Time"
                radius={[4, 4, 0, 0]}
                opacity={0.7}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}