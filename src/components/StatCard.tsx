import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: LucideIcon;
  variant?: "default" | "primary";
}

export const StatCard = ({ label, value, sublabel, icon: Icon, variant = "default" }: StatCardProps) => {
  const isPrimary = variant === "primary";
  
  return (
    <Card className={isPrimary ? "bg-gradient-primary text-white" : ""}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm ${isPrimary ? "opacity-90" : "text-muted-foreground"}`}>
              {label}
            </p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {sublabel && (
              <p className={`text-xs mt-1 ${isPrimary ? "opacity-75" : "text-muted-foreground"}`}>
                {sublabel}
              </p>
            )}
          </div>
          <Icon className={`w-12 h-12 ${isPrimary ? "opacity-80" : "text-muted-foreground"}`} />
        </div>
      </CardContent>
    </Card>
  );
};
