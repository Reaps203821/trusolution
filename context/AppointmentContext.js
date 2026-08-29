import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import {
  scheduleAppointmentReminders,
  cancelAppointmentReminders,
} from "../lib/notifications";

const AppointmentContext = createContext(null);

const buildBookingId = () =>
  `BK-${Math.floor(100000 + Math.random() * 900000).toString()}`;

const shiftIsoDate = (isoDate, days) => {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const rowToAppointment = (row) => ({
  id: row.id,
  bookingId: row.booking_id,
  therapist: row.therapist,
  date: row.date,
  time: row.time,
  sessionType: row.session_type,
  status: row.status,
  createdAt: row.created_at,
  reminder: {
    dayBefore: row.reminder_day_before,
    oneHourBefore: row.reminder_one_hour_before,
  },
});

export function AppointmentProvider({ children }) {
  const { currentUser, isHydrated: isAuthHydrated } = useAuth();
  const currentUserId = currentUser?.id;

  const [appointments, setAppointments] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isActive = true;

    const restore = async () => {
      setIsHydrated(false);
      setAppointments([]);

      if (!isAuthHydrated) {
        return;
      }

      if (!currentUserId) {
        if (isActive) setIsHydrated(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("appointments")
          .select("*")
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false });

        if (!isActive) return;

        if (error) {
          console.warn("Unable to restore appointments", error.message);
        } else if (data) {
          setAppointments(data.map(rowToAppointment));
        }
      } catch (error) {
        console.warn("Unable to restore appointments", error);
      } finally {
        if (isActive) setIsHydrated(true);
      }
    };

    restore();
    return () => {
      isActive = false;
    };
  }, [currentUserId, isAuthHydrated]);

  const addAppointment = async ({ therapist, date, time, sessionType }) => {
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        user_id: currentUserId,
        booking_id: buildBookingId(),
        therapist,
        date,
        time,
        session_type: sessionType,
        status: "Confirmed",
        reminder_day_before: true,
        reminder_one_hour_before: true,
      })
      .select()
      .single();

    if (error) {
      console.warn("Unable to create appointment", error.message);
      return null;
    }

    const newAppointment = rowToAppointment(data);
    setAppointments((prev) => [newAppointment, ...prev]);
    scheduleAppointmentReminders(newAppointment);
    return newAppointment;
  };

  const cancelAppointment = async (appointmentId) => {
    setAppointments((prev) =>
      prev.map((item) =>
        item.id === appointmentId ? { ...item, status: "Canceled" } : item,
      ),
    );

    cancelAppointmentReminders(appointmentId);

    const { error } = await supabase
      .from("appointments")
      .update({ status: "Canceled" })
      .eq("id", appointmentId)
      .eq("user_id", currentUserId);

    if (error) {
      console.warn("Unable to cancel appointment", error.message);
    }
  };

  const rescheduleAppointment = async (appointmentId, nextDate) => {
    const current = appointments.find((item) => item.id === appointmentId);
    const resolvedDate =
      nextDate || (current ? shiftIsoDate(current.date, 1) : nextDate);

    setAppointments((prev) =>
      prev.map((item) =>
        item.id === appointmentId ? { ...item, date: resolvedDate } : item,
      ),
    );

    cancelAppointmentReminders(appointmentId);
    if (current) {
      scheduleAppointmentReminders({ ...current, date: resolvedDate });
    }

    const { error } = await supabase
      .from("appointments")
      .update({ date: resolvedDate })
      .eq("id", appointmentId)
      .eq("user_id", currentUserId);

    if (error) {
      console.warn("Unable to reschedule appointment", error.message);
    }
  };

  const getAppointmentById = (appointmentId) =>
    appointments.find((item) => item.id === appointmentId) || null;

  const upcomingAppointment =
    appointments.find((item) => item.status === "Confirmed") || null;

  const value = useMemo(
    () => ({
      appointments,
      upcomingAppointment,
      isHydrated,
      addAppointment,
      cancelAppointment,
      rescheduleAppointment,
      getAppointmentById,
    }),
    [appointments, upcomingAppointment, isHydrated, currentUserId],
  );

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointments() {
  const value = useContext(AppointmentContext);
  if (!value) {
    throw new Error("useAppointments must be used within AppointmentProvider");
  }
  return value;
}
