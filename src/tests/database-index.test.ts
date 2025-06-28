import { getDb } from "../database/index";
import { drizzle } from "drizzle-orm/d1";

// Mock drizzle
jest.mock("drizzle-orm/d1", () => ({
	drizzle: jest.fn(),
}));

describe("Database Index Tests", () => {
	test("should create database connection", () => {
		const mockD1 = {} as D1Database;
		const mockDrizzleInstance = {};

		(drizzle as jest.Mock).mockReturnValue(mockDrizzleInstance);

		const db = getDb(mockD1);

		expect(drizzle).toHaveBeenCalledWith(
			mockD1,
			expect.objectContaining({ schema: expect.any(Object) }),
		);
		expect(db).toBe(mockDrizzleInstance);
	});
});
