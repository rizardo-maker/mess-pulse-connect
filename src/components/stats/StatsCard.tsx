
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass?: string;
}

const StatsCard = ({ title, value, icon, colorClass = "bg-blue-50" }: StatsCardProps) => {
  return (
    <Card className={colorClass}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-600">{title}</h3>
            <p className="text-3xl font-bold text-rgukt-blue">{value}</p>
          </div>
          <div className={`${colorClass.replace('bg-', 'bg-').replace('50', '100')} p-3 rounded-full`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
