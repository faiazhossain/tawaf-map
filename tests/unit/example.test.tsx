import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";
import { ThemeProvider } from "@/components/theme/theme-provider";

// হোমপেজ এখন HomeHeader → ThemeToggle রেন্ডার করে, যার জন্য ThemeProvider প্রয়োজন।
function renderHome() {
  return render(
    <ThemeProvider>
      <HomePage />
    </ThemeProvider>
  );
}

// হোমপেজ পুনঃনকশার পরে এই পরীক্ষাগুলো বর্তমান কপি ও কাঠামোর সাথে মিলিয়ে আপডেট করা হয়েছে।
describe("HomePage", () => {
  it("renders the hero heading", () => {
    renderHome();
    // হিরো শিরোনাম: "উমরাহ করুন নিশ্চিন্তে,"
    const heading = screen.getByText(/উমরাহ করুন নিশ্চিন্তে/);
    expect(heading).toBeDefined();
  });

  it("renders the brand name in the header", () => {
    renderHome();
    // হেডারে লোগো + "TawafMap" (Tawaf + Map দুটি টেক্সট নোড)।
    const brand = screen.getByRole("link", { name: /TawafMap home/i });
    expect(brand).toBeDefined();
  });
});
