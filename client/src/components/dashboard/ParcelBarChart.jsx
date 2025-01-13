import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function ParcelBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
        barGap={0}
        barCategoryGap="20%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
        <XAxis
          dataKey="week"
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
          tickFormatter={(value) => `S${value}`}
        />
        <YAxis
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
          tickFormatter={(value) => `${value}€`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '0.375rem',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
          }}
          formatter={(value) => [`${value}€`]}
          labelFormatter={(label) => `Semaine ${label}`}
        />
        <Bar
          dataKey="income"
          name="Revenus"
          fill="#10B981"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="spend"
          name="Dépenses"
          fill="#F97316"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
