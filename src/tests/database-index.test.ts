import { describe, expect, test } from "bun:test";
import { getDb } from "../database/index";

describe("Database Index Tests", () => {
	test("should create database connection", () => {
		const mockD1 = {} as D1Database;
		const db = getDb(mockD1);
		expect(db).toBeDefined();
	});
});
