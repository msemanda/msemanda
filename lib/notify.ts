import { addDoc, collection, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserRole } from "@/types";

interface NotifyOptions {
    targetUid?: string;
    targetRole?: UserRole;
    type: string;
    title: string;
    body: string;
    link?: string;
}

/** Fire-and-forget: creates a notification for a specific user (targetUid) or every user of a role (targetRole). */
export async function notify(opts: NotifyOptions): Promise<void> {
    try {
        await addDoc(collection(db, "notifications"), {
            targetUid:   opts.targetUid ?? null,
            targetRole:  opts.targetRole ?? null,
            type:        opts.type,
            title:       opts.title,
            body:        opts.body,
            link:        opts.link ?? null,
            read:        false,
            createdAt:   serverTimestamp(),
        });
    } catch (err) {
        console.error("[notify]", err);
    }
}

/**
 * Orders placed for an IPD patient (sourced from ipdAdmissions) don't carry a
 * patientId — only OPD orders (sourced from an appointment) do. Falls back to
 * a users lookup by email so completion notifications can still reach the
 * patient either way.
 */
export async function resolvePatientUid(patientId: string | null | undefined, patientEmail: string | null | undefined): Promise<string | null> {
    if (patientId) return patientId;
    if (!patientEmail) return null;
    try {
        const snap = await getDocs(query(collection(db, "users"), where("email", "==", patientEmail.toLowerCase().trim())));
        return snap.docs[0]?.id ?? null;
    } catch (err) {
        console.error("[resolvePatientUid]", err);
        return null;
    }
}
