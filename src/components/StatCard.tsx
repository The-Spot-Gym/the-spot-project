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
      <CardContent className="p-3 sm:p-6">
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div>
            <p className={`text-xs sm:text-sm ${isPrimary ? "opacity-90" : "text-muted-foreground"}`}>
              {label}
            </p>
            <p className="text-xl sm:text-3xl font-bold mt-0.5 sm:mt-1">{value}</p>
            {sublabel && (
              <p className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 ${isPrimary ? "opacity-75" : "text-muted-foreground"}`}>
                {sublabel}
              </p>
            )}
          </div>
          <Icon className={`hidden sm:block w-12 h-12 ${isPrimary ? "opacity-80" : "text-muted-foreground"}`} />
        </div>
      </CardContent>
    </Card>
  );
};
