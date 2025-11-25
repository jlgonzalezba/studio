import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Clock } from 'lucide-react';
import React from 'react';

interface AppCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  description: string;
  color?: 'green' | 'blue' | 'red' | 'yellow' | 'purple' | 'pink';
  status?: 'coming-soon';
}

const colorClasses = {
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  purple: 'bg-purple-100 text-purple-800',
  pink: 'bg-pink-100 text-pink-800',
  default: 'bg-primary/10 text-primary',
}

export function AppCard({ icon: Icon, title, subtitle, description, color, status }: AppCardProps) {
  const colorClass = color ? colorClasses[color] : colorClasses.default;
  return (
    <Card className={cn(
      "bg-card shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-emphasized flex flex-col border min-h-[250px] relative",
      status === 'coming-soon' && "opacity-50 grayscale hover:shadow-lg hover:-translate-y-0 cursor-not-allowed"
    )}>
      <CardHeader className="p-7 pb-4">
        <div className={cn("w-14 h-14 flex items-center justify-center rounded-2xl mb-4 shrink-0", colorClass)}>
          <Icon className="w-8 h-8" />
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </CardHeader>
      <CardContent className="p-7 pt-0 flex-grow">
        <CardDescription className="text-base text-muted-foreground leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
      {status === 'coming-soon' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90 backdrop-blur-none rounded-lg">
          <Clock className="w-16 h-16 text-foreground mb-2" />
          <span className="text-xl font-bold text-foreground">Coming Soon</span>
        </div>
      )}
    </Card>
  );
}

