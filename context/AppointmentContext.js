import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "@trusolution/appointments-v1";
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

export function AppointmentProvider({ children }) {
  const [appointments, setAppointments] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setAppointments(parsed);
          }
        }
      } catch (error) {
        console.warn("Unable to restore appointments", error);
      } finally {
        setIsHydrated(true);
      }
    };
    restore();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(appointments)).catch((e) =>
      console.warn("Unable to save appointments", e),
    );
  }, [isHydrated, appointments]);

  const addAppointment = ({ therapist, date, time, sessionType }) => {
    const newAppointment = {
      id: `appointment-${Date.now()}`,
      bookingId: buildBookingId(),
      therapist,
      date,
      time,
      sessionType,
      status: "Confirmed",
      createdAt: new Date().toISOString(),
      reminder: {
        dayBefore: true,
        oneHourBefore: true,
      },
    };

    setAppointments((prev) => [newAppointment, ...prev]);
    return newAppointment;
  };

  const cancelAppointment = (appointmentId) => {
    setAppointments((prev) =>
      prev.map((item) =>
        item.id === appointmentId ? { ...item, status: "Canceled" } : item,
      ),
    );
  };

  const rescheduleAppointment = (appointmentId, nextDate) => {
    setAppointments((prev) =>
      prev.map((item) =>
        item.id === appointmentId
          ? { ...item, date: nextDate || shiftIsoDate(item.date, 1) }
          : item,
      ),
    );
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
    [appointments, upcomingAppointment, isHydrated],
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
