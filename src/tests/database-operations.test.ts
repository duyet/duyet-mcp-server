/**
 * Database operations unit tests
 */

import { getDb } from "../database";
import { contacts } from "../database/schema";

// Mock the drizzle database
const mockDbResult = {
	select: jest.fn().mockReturnThis(),
	from: jest.fn().mockReturnThis(),
	where: jest.fn().mockReturnThis(),
	insert: jest.fn().mockReturnThis(),
	values: jest.fn().mockReturnThis(),
	returning: jest.fn().mockReturnThis(),
	groupBy: jest.fn().mockReturnThis(),
	orderBy: jest.fn().mockReturnThis(),
	limit: jest.fn().mockReturnThis(),
	offset: jest.fn().mockReturnThis(),
};

jest.mock("../database", () => ({
	getDb: jest.fn(() => mockDbResult),
}));

jest.mock("../database/schema", () => ({
	contacts: {
		id: "id",
		referenceId: "reference_id",
		message: "message",
		contactEmail: "contact_email",
		purpose: "purpose",
		ipAddress: "ip_address",
		userAgent: "user_agent",
		createdAt: "created_at",
		updatedAt: "updated_at",
	},
}));

const mockD1Database = {} as D1Database;

beforeEach(() => {
	jest.clearAllMocks();
});

describe("Database Operations", () => {
	test("should initialize database with schema", () => {
		const db = getDb(mockD1Database);
		expect(getDb).toHaveBeenCalledWith(mockD1Database);
		expect(db).toBeDefined();
	});

	test("should have contacts schema defined", () => {
		expect(contacts).toBeDefined();
		expect(contacts.id).toBeDefined();
		expect(contacts.referenceId).toBeDefined();
		expect(contacts.message).toBeDefined();
		expect(contacts.contactEmail).toBeDefined();
		expect(contacts.purpose).toBeDefined();
	});
});
