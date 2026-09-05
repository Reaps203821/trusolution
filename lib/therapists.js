import { supabase } from "./supabase";

export async function fetchTherapists() {
  const { data, error } = await supabase
    .from("therapist_profiles")
    .select("*")
    .eq("is_accepting_clients", true)
    .order("full_name", { ascending: true });

  if (error) {
    console.warn("Unable to fetch therapists", error.message);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.full_name || "Therapist",
    photoUrl: row.photo_url || "",
    specialty: row.specialty || "General Counseling",
    bio: row.bio || "",
    credentials: row.credentials || "",
    yearsExperience: row.years_experience,
    sessionTypes: row.session_types || ["Chat", "Call"],
    rating: row.rating ?? 5.0,
  }));
}

const DAY_TO_INDEX = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const to12Hour = (hh, mm) => {
  let hour = hh % 12;
  if (hour === 0) hour = 12;
  const meridiem = hh >= 12 ? "PM" : "AM";
  return `${hour}:${String(mm).padStart(2, "0")} ${meridiem}`;
};

// Returns an array of "9:00 AM" style time-slot strings for the given
// therapist and calendar date (YYYY-MM-DD), based on their weekly
// availability windows, minus times already booked (pending or confirmed).
export async function fetchAvailableSlots(therapistId, isoDate) {
  const dayOfWeek = new Date(`${isoDate}T00:00:00`).getDay();

  const [availabilityResult, bookedResult] = await Promise.all([
    supabase
      .from("therapist_availability")
      .select("*")
      .eq("therapist_id", therapistId)
      .eq("day_of_week", dayOfWeek),
    supabase
      .from("appointments")
      .select("time")
      .eq("therapist_id", therapistId)
      .eq("date", isoDate)
      .in("status", ["Pending", "Confirmed"]),
  ]);

  if (availabilityResult.error) {
    console.warn(
      "Unable to fetch therapist availability",
      availabilityResult.error.message,
    );
    return [];
  }
  const windows = availabilityResult.data || [];
  if (windows.length === 0) return [];

  const bookedTimes = new Set(
    (bookedResult.data || []).map((row) => row.time),
  );

  const slots = [];
  windows.forEach((window) => {
    const [startH, startM] = window.start_time.split(":").map(Number);
    const [endH, endM] = window.end_time.split(":").map(Number);
    const stepMinutes = window.slot_minutes || 60;

    let cursorMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (cursorMinutes + stepMinutes <= endMinutes) {
      const hh = Math.floor(cursorMinutes / 60);
      const mm = cursorMinutes % 60;
      const label = to12Hour(hh, mm);
      if (!bookedTimes.has(label)) {
        slots.push(label);
      }
      cursorMinutes += stepMinutes;
    }
  });

  return slots;
}

export { DAY_TO_INDEX };
