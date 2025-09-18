import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import React from 'react';

interface AppCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color?: 'green' | 'blue' | 'red' | 'yellow';
}

const colorClasses = {
  green: 'bg-green-100 text-green-600',
  blue: 'bg-blue-100 text-blue-600',
  red: 'bg-red-100 text-red-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  default: 'bg-primary/10 text-primary',
}

export function AppCard({ icon: Icon, title, description, color }: AppCardProps) {
  const colorClass = color ? colorClasses[color] : colorClasses.default;
  return (
    <Card className="bg-card shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-emphasized flex flex-col border min-h-[250px]">
      <CardHeader className="p-7 pb-4">
        <div className={cn("w-14 h-14 flex items-center justify-center rounded-2xl mb-4 shrink-0", colorClass)}>
          <Icon className="w-8 h-8" />
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-7 pt-0 flex-grow">
        <CardDescription className="text-base text-muted-foreground leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

