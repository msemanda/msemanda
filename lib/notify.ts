import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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
