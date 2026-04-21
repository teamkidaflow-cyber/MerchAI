import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const data = [
  { name: 'Melvins Tea', value: 28, color: '#FDB913' },
  { name: 'Ketepa', value: 35, color: '#4CAF50' },
  { name: 'Brookside', value: 22, color: '#2196F3' },
  { name: 'Others', value: 15, color: '#9E9E9E' },
];

const CompetitorPie: React.FC = () => {
  return (
    <div className="h-[300px] w-full bg-white p-6 rounded-[32px] border border-[#e5e5e5] shadow-sm">
      <h3 className="text-xl font-bold mb-6">Market Share (Facings)</h3>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={8}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Legend 
              verticalAlign="middle" 
              align="right" 
              layout="vertical"
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingLeft: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CompetitorPie;
