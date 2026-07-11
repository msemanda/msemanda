"use client";

import { BookAppointmentForm } from "@/components/appointments/BookAppointmentForm";

export default function AdminSchedulePatientsPage() {
    return (
        <BookAppointmentForm
            title="Schedule Appointment"
            subtitle="Assign a doctor and time slot to a patient — same booking flow used at Reception"
        />
    );
}
