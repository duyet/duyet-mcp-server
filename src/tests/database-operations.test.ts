/**
 * Database operations unit tests
 */
import { describe, expect, test } from "bun:test";
import { getDb } from "../database";
import { contacts } from "../database/schema";

const mockD1Database = {} as D1Database;

describe("Database Operations", () => {
	test("should initialize database with schema", () => {
		const db = getDb(mockD1Database);
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
