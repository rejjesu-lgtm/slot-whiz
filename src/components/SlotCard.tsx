import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Check, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlotCardProps {
  slotKey: string;
  time: string;
  label: string;
  status: string;
  onClick: () => void;
  loading?: boolean;
  delay?: number;
}

export const SlotCard = ({
  time,
  label,
  status,
  onClick,
  loading,
  delay = 0,
}: SlotCardProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "available":
        return {
          icon: Clock,
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-950/30",
          borderColor: "border-green-200 dark:border-green-800",
          text: "Available",
          buttonVariant: "default" as const,
          disabled: false,
        };
      case "pending":
        return {
          icon: AlertCircle,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
          borderColor: "border-yellow-200 dark:border-yellow-800",
          text: "Pending Confirmation",
          buttonVariant: "secondary" as const,
          disabled: true,
        };
      case "booked":
        return {
          icon: Check,
          color: "text-red-600",
          bgColor: "bg-red-50 dark:bg-red-950/30",
          borderColor: "border-red-200 dark:border-red-800",
          text: "Booked",
          buttonVariant: "secondary" as const,
          disabled: true,
        };
      default:
        return {
          icon: Clock,
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-950/30",
          borderColor: "border-green-200 dark:border-green-800",
          text: "Available",
          buttonVariant: "default" as const,
          disabled: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "p-6 transition-all duration-300 hover:shadow-[var(--shadow-soft)] border-2 animate-in fade-in slide-in-from-bottom",
        config.borderColor,
        config.bgColor,
        !config.disabled && "hover:scale-105 cursor-pointer"
      )}
      style={{ animationDelay: `${delay}ms` }}
      onClick={!config.disabled ? onClick : undefined}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center",
            config.bgColor,
            "ring-2 ring-offset-2",
            config.borderColor
          )}
        >
          {loading ? (
            <Loader2 className={cn("w-8 h-8 animate-spin", config.color)} />
          ) : (
            <Icon className={cn("w-8 h-8", config.color)} />
          )}
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-1 text-foreground">{label}</h3>
          <p className="text-sm text-muted-foreground font-medium">{time}</p>
        </div>

        <div
          className={cn(
            "px-3 py-1 rounded-full text-sm font-medium",
            config.color,
            config.bgColor
          )}
        >
          {config.text}
        </div>

        <Button
          variant={config.buttonVariant}
          disabled={config.disabled || loading}
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            if (!config.disabled) onClick();
          }}
        >
          {config.disabled ? config.text : "Book Now"}
        </Button>
      </div>
    </Card>
  );
};
