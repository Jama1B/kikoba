import { addMonths, format, differenceInDays, startOfToday } from "date-fns";
import { CalendarDaysIcon, TrendingUpIcon } from "lucide-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
// Make sure to install dependencies: npm install date-fns lucide-react

export function NextMeetingCard() {
  const today = startOfToday();
  const nextMeetingDate = addMonths(today, 1);
  const daysRemaining = differenceInDays(nextMeetingDate, today);
  const formattedDate = format(nextMeetingDate, "MMM d, yyyy");

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardDescription>Next Meeting</CardDescription>
        <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
          {formattedDate}
        </CardTitle>
        <div className="absolute right-4 top-4">
          <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
            <CalendarDaysIcon className="size-3" />
            {daysRemaining === 1 ? "1 day left" : `${daysRemaining} days left`}
          </Badge>
        </div>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          Monthly recurrence <TrendingUpIcon className="size-4" />
        </div>
        <div className="text-muted-foreground">
          Automatically scheduled meeting
        </div>
      </CardFooter>
    </Card>
  );
}
