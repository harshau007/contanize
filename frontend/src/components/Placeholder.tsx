import React from "react";
import { cn } from "@/lib/utils";

interface PlaceholderProps {
  width?: string;
  height?: string;
  text?: string;
  className?: string;
}

const Placeholder: React.FC<PlaceholderProps> = ({
  width = "w-full",
  height = "h-full",
  text = "Placeholder",
  className = "",
}) => {
  const baseClasses = cn(
    "flex items-center justify-center text-xl rounded-md pointer-events-none",
    width,
    height,
    className
  );

  return (
    <div className={baseClasses}>
      <span className="text-gray-400 dark:text-gray-500 opacity-50">
        {text}
      </span>
    </div>
  );
};

export default Placeholder;
