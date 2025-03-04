import {ClassValue, clsx} from "clsx";
import {CheckCircle2, Clock} from "lucide-react";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case "published":
      return "bg-green-50 text-green-600 border-green-200";
    case "unpublished":
      return "bg-amber-50 text-amber-600 border-amber-200";
    case "inactive":
      return "bg-gray-50 text-gray-600 border-gray-200";
    default:
      return "bg-blue-50 text-blue-600 border-blue-200";
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case "published":
      return <CheckCircle2 className="h-4 w-4 mr-1" />;
    case "unpublished":
      return <Clock className="h-4 w-4 mr-1" />;
    default:
      return null;
  }
};
