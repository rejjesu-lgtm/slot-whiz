import { Clock, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SlotCardProps {
  slotKey: string;
  time: string;
  label: string;
  status: string;
  onClick: () => void;
  loading?: boolean;
}

export const SlotCard = ({
  time,
  label,
  status,
  onClick,
  loading,
}: SlotCardProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "booked":
      case "confirmed":
        return {
          icon: XCircle,
          text: "Booked",
          bgColor: "bg-destructive/5 border-destructive/20 hover:border-destructive/30",
          textColor: "text-destructive",
          iconColor: "text-destructive",
          badgeBg: "bg-destructive/10",
          disabled: true,
        };
      case "pending":
        return {
          icon: Clock,
          text: "Pending",
          bgColor: "bg-warning/5 border-warning/20 hover:border-warning/30",
          textColor: "text-warning",
          iconColor: "text-warning",
          badgeBg: "bg-warning/10",
          disabled: true,
        };
      case "expired":
      case "cancelled":
        return {
          icon: Clock,
          text: "Expired",
          bgColor: "bg-muted/50 border-muted hover:border-muted",
          textColor: "text-muted-foreground",
          iconColor: "text-muted-foreground",
          badgeBg: "bg-muted",
          disabled: true,
        };
      default:
        return {
          icon: Sparkles,
          text: "Available",
          bgColor: "bg-card border-border hover:border-primary/50 hover:shadow-[var(--shadow-soft)]",
          textColor: "text-success",
          iconColor: "text-primary",
          badgeBg: "bg-success/10",
          disabled: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const StatusIcon = status === "available" ? CheckCircle2 : config.icon;

  return (
    <Card
      className={cn(
        config.bgColor,
        "transition-all duration-200 cursor-pointer border-2",
        config.disabled
          ? "opacity-60 cursor-not-allowed"
          : "hover:scale-[1.02] active:scale-[0.98]"
      )}
      onClick={config.disabled ? undefined : onClick}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn("p-2 rounded-lg bg-primary/10", config.iconColor)}>
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-foreground text-base">{time}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </div>
        </div>
        <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full", config.textColor, config.badgeBg)}>
          <StatusIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{config.text}</span>
        </div>
      </div>
    </Card>
  );
};
