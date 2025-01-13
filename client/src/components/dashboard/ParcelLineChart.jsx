import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = {
  received: '#3B82F6',   // blue
  shipped: '#8B5CF6',    // purple
  completed: '#10B981',  // green
  disputed: '#F59E0B'    // yellow
};

export function ParcelLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis 
          dataKey="month" 
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis 
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '0.375rem',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
          }}
        />
        <Legend 
          verticalAlign="top"
          height={36}
          iconType="circle"
          formatter={(value) => {
            const labels = {
              received: 'Reçus',
              shipped: 'Expédiés',
              completed: 'Terminés',
              disputed: 'En litige'
            };
            return labels[value] || value;
          }}
        />
        <Line 
          type="monotone" 
          dataKey="received" 
          stroke={COLORS.received} 
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="shipped" 
          stroke={COLORS.shipped} 
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="completed" 
          stroke={COLORS.completed} 
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="disputed" 
          stroke={COLORS.disputed} 
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
