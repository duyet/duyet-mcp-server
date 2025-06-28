export type ContactPurpose = "collaboration" | "job_opportunity" | "consulting" | "general_inquiry";

export interface Contact {
	id: number;
	referenceId: string;
	message: string;
	contactEmail: string | null;
	purpose: ContactPurpose;
	ipAddress: string | null;
	userAgent: string | null;
	createdAt: Date | null;
	updatedAt: Date | null;
}

export interface CreateContactInput {
	message: string;
	contactEmail?: string;
	purpose: ContactPurpose;
	ipAddress?: string;
	userAgent?: string;
}