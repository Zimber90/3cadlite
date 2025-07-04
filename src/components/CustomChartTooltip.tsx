import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Card className="p-2 shadow-lg border-border bg-card text-card-foreground">
        <CardContent className="p-0">
          <p className="text-sm font-semibold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="text-sm text-muted-foreground">
              {entry.name}: <span className="font-bold text-primary">{entry.value}</span>
            </p>
          ))}
        </CardContent>
      </Card>
    );
  }
  return null;
};

export default CustomChartTooltip;