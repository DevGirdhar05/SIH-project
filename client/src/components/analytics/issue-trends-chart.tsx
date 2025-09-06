import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TrendData {
  date: string;
  total: number;
  resolved: number;
  pending: number;
}

interface IssueTrendsChartProps {
  data: TrendData[];
}

export function IssueTrendsChart({ data }: IssueTrendsChartProps) {
  return (
    <Card data-testid="issue-trends-chart">
      <CardHeader>
        <CardTitle>Issue Trends Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString();
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#2563eb" 
                strokeWidth={2}
                name="Total Issues"
                dot={{ fill: '#2563eb' }}
              />
              <Line 
                type="monotone" 
                dataKey="resolved" 
                stroke="#16a34a" 
                strokeWidth={2}
                name="Resolved Issues"
                dot={{ fill: '#16a34a' }}
              />
              <Line 
                type="monotone" 
                dataKey="pending" 
                stroke="#ea580c" 
                strokeWidth={2}
                name="Pending Issues"
                dot={{ fill: '#ea580c' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}