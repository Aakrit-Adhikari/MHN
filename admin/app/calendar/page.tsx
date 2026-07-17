"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { DatesSetArg, EventClickArg, EventContentArg, EventInput } from "@fullcalendar/core";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/PageHeader";
import { ErrorState, LoadingState } from "@/components/State";
import { apiFetch, getStoredToken } from "@/lib/api";
import { money } from "@/lib/format";
import type { BookingStatus, CalendarBooking, CalendarSummary, CalendarTourOption } from "@/types/api";

const statusOptions: Array<BookingStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED"
];

const calendarViews = [
  { label: "Month", value: "dayGridMonth" },
  { label: "Week", value: "timeGridWeek" },
  { label: "Day", value: "timeGridDay" },
  { label: "Scheduler", value: "resourceTimelineMonth" }
] as const;

type CalendarView = (typeof calendarViews)[number]["value"];

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function getStatusClass(status: BookingStatus) {
  if (status === "CONFIRMED") return "calendar-event-confirmed";
  if (status === "COMPLETED") return "calendar-event-completed";
  if (status === "CANCELLED") return "calendar-event-cancelled";
  return "calendar-event-pending";
}

function eventTitle(booking: CalendarBooking) {
  const pax = booking.passengerCount ? ` · ${booking.passengerCount} pax` : "";
  return `${booking.tourTitle}${pax}`;
}

function renderEventContent(eventInfo: EventContentArg) {
  return (
    <div className="fc-booking-event">
      <span>{eventInfo.event.title}</span>
    </div>
  );
}

export default function CalendarPage() {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar | null>(null);
  const [month, setMonth] = useState(() => toMonthKey(new Date()));
  const [tourId, setTourId] = useState("ALL");
  const [status, setStatus] = useState<BookingStatus | "ALL">("ALL");
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [summary, setSummary] = useState<CalendarSummary | null>(null);
  const [tours, setTours] = useState<CalendarTourOption[]>([]);
  const [calendarView, setCalendarView] = useState<CalendarView>("dayGridMonth");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const events = useMemo<EventInput[]>(() => {
    return bookings
      .filter((booking) => booking.bookingDate)
      .map((booking) => ({
        id: booking.id,
        title: eventTitle(booking),
        start: booking.bookingDate?.slice(0, 10),
        allDay: true,
        resourceId: booking.tourId ?? "charter",
        classNames: [getStatusClass(booking.status)],
        extendedProps: {
          customerName: booking.customerName,
          status: booking.status
        }
      }));
  }, [bookings]);

  const resources = useMemo(() => {
    const tourResources = tours.map((tour) => ({
      id: tour.id,
      title: tour.title
    }));

    return [
      ...tourResources,
      {
        id: "charter",
        title: "Charter / Unassigned"
      }
    ];
  }, [tours]);

  useEffect(() => {
    let isCurrent = true;

    async function loadCalendar() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({ month });
      if (tourId !== "ALL") params.set("tourId", tourId);
      if (status !== "ALL") params.set("status", status);

      try {
        const token = getStoredToken();
        const [calendarBookings, calendarSummary, tourOptions] = await Promise.all([
          apiFetch<CalendarBooking[]>(`/admin/calendar/bookings?${params.toString()}`, { token }),
          apiFetch<CalendarSummary>(`/admin/calendar/summary?${params.toString()}`, { token }),
          apiFetch<CalendarTourOption[]>("/admin/calendar/tours", { token })
        ]);

        if (!isCurrent) return;
        setBookings(calendarBookings);
        setSummary(calendarSummary);
        setTours(tourOptions);
      } catch (err) {
        if (!isCurrent) return;
        setError(err instanceof Error ? err.message : "Calendar could not be loaded.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    loadCalendar();

    return () => {
      isCurrent = false;
    };
  }, [month, tourId, status]);

  function handleDatesSet(arg: DatesSetArg) {
    setMonth(toMonthKey(arg.view.currentStart));
  }

  function handleEventClick(arg: EventClickArg) {
    router.push(`/bookings?bookingId=${arg.event.id}`);
  }

  function moveMonth(direction: -1 | 1) {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;

    if (direction === -1) {
      calendarApi.prev();
      return;
    }

    calendarApi.next();
  }

  function goToday() {
    calendarRef.current?.getApi().today();
  }

  function changeView(nextView: CalendarView) {
    setCalendarView(nextView);
    calendarRef.current?.getApi().changeView(nextView);
  }

  return (
    <>
      <PageHeader
        title="Calendar"
        actions={<Link className="btn btn-gold" href="/bookings"><Plus className="h-4 w-4" /> New Booking</Link>}
      />

      <div className="calendar-summary-grid">
        <div className="calendar-summary-card">
          <span>Total Bookings</span>
          <strong>{summary?.totalBookings ?? 0}</strong>
        </div>
        <div className="calendar-summary-card">
          <span>Confirmed</span>
          <strong>{summary?.confirmed ?? 0}</strong>
        </div>
        <div className="calendar-summary-card">
          <span>Passengers</span>
          <strong>{summary?.totalPassengers ?? 0}</strong>
        </div>
        <div className="calendar-summary-card">
          <span>Revenue</span>
          <strong>{money(summary?.totalAmount ?? 0)}</strong>
        </div>
      </div>

      <div className="calendar-toolbar">
        <div>
          <h2>{monthLabel(month)}</h2>
        </div>
        <div className="calendar-controls">
          <select value={tourId} onChange={(event) => setTourId(event.target.value)}>
            <option value="ALL">All Tours</option>
            {tours.map((tour) => (
              <option key={tour.id} value={tour.id}>{tour.title}</option>
            ))}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value as BookingStatus | "ALL")}>
            {statusOptions.map((option) => (
              <option key={option} value={option}>{option === "ALL" ? "All Statuses" : option}</option>
            ))}
          </select>
          <div className="calendar-view-switch" role="group" aria-label="Calendar view">
            {calendarViews.map((view) => (
              <button
                className={`calendar-view-button ${calendarView === view.value ? "is-active" : ""}`}
                key={view.value}
                onClick={() => changeView(view.value)}
                type="button"
              >
                {view.label}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary" onClick={() => moveMonth(-1)} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="btn btn-secondary" onClick={goToday}>Today</button>
          <button className="btn btn-secondary" onClick={() => moveMonth(1)} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState title="Calendar could not be loaded" /> : null}

      <div className="fullcalendar-card">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin, resourceTimelinePlugin, timeGridPlugin]}
          initialView={calendarView}
          initialDate={`${month}-01`}
          schedulerLicenseKey={process.env.NEXT_PUBLIC_FULLCALENDAR_LICENSE_KEY ?? "GPL-My-Project-Is-Open-Source"}
          headerToolbar={false}
          height="auto"
          dayMaxEvents={3}
          fixedWeekCount={false}
          resources={resources}
          resourceAreaHeaderContent="Tours"
          events={events}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
        />
      </div>
    </>
  );
}
