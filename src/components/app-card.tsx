import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import React from 'react';

interface AppCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function AppCard({ icon: Icon, title, description }: AppCardProps) {
  return (
    <Card className="bg-card shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 ease-emphasized border-0 flex flex-col">
      <CardHeader className="p-7 pb-4">
        <div className="bg-primary/10 text-primary w-14 h-14 flex items-center justify-center rounded-2xl mb-4 shrink-0">
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
