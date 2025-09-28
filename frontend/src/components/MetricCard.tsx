import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend: {
    direction: "up" | "down" | "neutral";
    value: string;
  };
  status?: "success" | "danger" | "warning" | "neutral";
}

export const MetricCard = ({ title, value, trend, status = "neutral" }: MetricCardProps) => {
  const getTrendIcon = () => {
    switch (trend.direction) {
      case "up":
        return <TrendingUp className="w-4 h-4" />;
      case "down":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    if (status === "success") return "status-success";
    if (status === "danger") return "status-danger";
    if (status === "warning") return "status-warning";
    return "text-muted-foreground";
  };

  return (
    <div className="metric-card group">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
        <div className={`flex items-center space-x-1 text-xs font-medium ${getTrendColor()}`}>
          {getTrendIcon()}
          <span>{trend.value}</span>
        </div>
      </div>
      <div className="text-3xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
        {value}
      </div>
    </div>
  );
};