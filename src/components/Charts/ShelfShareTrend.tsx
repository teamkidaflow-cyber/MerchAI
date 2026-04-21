import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mar 15', share: 18 },
  { name: 'Mar 20', share: 22 },
  { name: 'Mar 25', share: 21 },
  { name: 'Mar 30', share: 25 },
  { name: 'Apr 5', share: 24 },
  { name: 'Apr 10', share: 28 },
];

const ShelfShareTrend: React.FC = () => {
  return (
    <div className="h-[300px] w-full bg-white p-6 rounded-[32px] border border-[#e5e5e5] shadow-sm">
      <h3 className="text-xl font-bold mb-6">Shelf Share Trend (30 days)</h3>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontWeight: 800, color: '#FDB913' }}
            />
            <Line 
              type="monotone" 
              dataKey="share" 
              stroke="#FDB913" 
              strokeWidth={4} 
              dot={{ r: 6, fill: '#FDB913', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 8, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ShelfShareTrend;
