"use client";

import { useMemo } from "react";
import { AlertTriangle, UserCheck } from "lucide-react";

/** Strips everything but digits and any leading zero, so "+256 700 123456", "0700123456" and "700123456" all normalize the same way. */
export function normalizePhone(phone: string): string {
    return phone.replace(/\D/g, "").replace(/^0+/, "");
}

interface DuplicateCandidate {
    uid: string;
    name: string;
    email: string;
    phone?: string;
}

interface PhoneDuplicateGuardProps<P extends DuplicateCandidate> {
    phone: string;
    patients: P[];
    /** Exclude a uid from matching — e.g. a patient already picked, so it doesn't warn against itself. */
    excludeUid?: string;
    onUseExisting: (patient: P) => void;
}

/**
 * Warns when a phone number being typed for a "new" patient already belongs
 * to someone in the system — matches on the last 9 digits so country-code
 * prefix or leading-zero differences (+256700123456 vs 0700123456) don't
 * cause false negatives. Requires a reasonably complete number before it
 * starts checking, to avoid flagging every partial digit typed.
 */
export function PhoneDuplicateGuard<P extends DuplicateCandidate>({
    phone, patients, excludeUid, onUseExisting,
}: PhoneDuplicateGuardProps<P>) {
    const match = useMemo(() => {
        const normalized = normalizePhone(phone);
        if (normalized.length < 7) return null;
        const tail = normalized.slice(-9);
        return patients.find(p => p.uid !== excludeUid && p.phone && normalizePhone(p.phone).endsWith(tail)) || null;
    }, [phone, patients, excludeUid]);

    if (!match) return null;

    return (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-800">A patient with this phone number already exists</p>
                <p className="text-xs text-amber-700 mt-0.5 truncate">{match.name} · {match.email}</p>
            </div>
            <button type="button" onClick={() => onUseExisting(match)}
                className="shrink-0 h-8 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors">
                <UserCheck className="h-3.5 w-3.5" /> Use This Patient
            </button>
        </div>
    );
}
