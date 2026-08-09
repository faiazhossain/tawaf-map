import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
// jest-dom ম্যাচার রানটাইমে যোগ করে এবং vitest-এর Assertion টাইপ সম্প্রসারণ করে
// (toBeVisible, toHaveAttribute ইত্যাদি)।
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
});
