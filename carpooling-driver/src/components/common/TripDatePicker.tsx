import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { TRIP_STATUS } from "@/constants";

interface Trip {
  departureTime: string;
  endTime: string;
  status: string;
}

interface TripDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  existingTrips?: Trip[];
  placeholder?: string;
  minDate?: Date;
}

const getExcludedTimes = (selectedDate: Date | null, trips: Trip[]) => {
  if (!selectedDate) return [];
  const excludedTimes: Date[] = [];

  const dayStart = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    0,
    0,
    0,
    0
  );
  const dayEnd = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    23,
    59,
    59,
    999
  );

  trips.forEach((trip) => {
    if (
      trip.status === TRIP_STATUS.cancelled ||
      trip.status === TRIP_STATUS.completed
    ) {
      return;
    }

    const start = new Date(trip.departureTime);
    const end = new Date(trip.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    if (start.getTime() > dayEnd.getTime() || end.getTime() < dayStart.getTime()) {
      return;
    }

    const windowStartMs = Math.max(start.getTime(), dayStart.getTime());
    const windowEndMs = Math.min(end.getTime(), dayEnd.getTime());

    const current = new Date(windowStartMs);
    current.setSeconds(0, 0);

    const minutes = current.getMinutes();
    if (minutes > 0 && minutes < 30) {
      current.setMinutes(0);
    } else if (minutes > 30) {
      current.setMinutes(30);
    }

    while (current.getTime() <= windowEndMs) {
      if (current.toDateString() === selectedDate.toDateString()) {
        const excluded = new Date(selectedDate);
        excluded.setHours(current.getHours(), current.getMinutes(), 0, 0);
        excludedTimes.push(excluded);
      }
      current.setMinutes(current.getMinutes() + 30);
    }
  });

  return excludedTimes;
};

export default function TripDatePicker({
  selected,
  onChange,
  existingTrips = [],
  placeholder,
  minDate,
}: TripDatePickerProps) {
  const now = new Date();

  // Use selected date, or minDate, or today for exclusion calculation
  const dateForExclusion = selected ?? minDate ?? new Date();
  const excludedTimes = getExcludedTimes(dateForExclusion, existingTrips);

  const computedMinTime = (() => {
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const dateToCheck = selected || minDate;

    if (!dateToCheck) return now; // default to now if nothing selected

    const isToday = dateToCheck.toDateString() === now.toDateString();
    const isSameAsMinDate =
      minDate && dateToCheck.toDateString() === minDate.toDateString();

    if (isSameAsMinDate && minDate) {
      // End time — grey out before departure + 30 mins
      return new Date(minDate.getTime() + 30 * 60 * 1000);
    }

    if (isToday) {
      // Today — grey out past times
      return now;
    }

    return startOfDay;
  })();

  const maxTime = new Date(new Date().setHours(23, 30, 0, 0));

  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      showTimeSelect
      timeIntervals={30}
      dateFormat="dd/MM/yyyy HH:mm"
      timeFormat="HH:mm"
      minDate={minDate || now}
      minTime={computedMinTime}
      maxTime={maxTime}
      excludeTimes={excludedTimes}
      placeholderText={placeholder}
      className="h-9.5 w-full rounded-xl border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-xs outline-none transition focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
      wrapperClassName="w-full"
    />
  );
}
