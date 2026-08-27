import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-3 px-6 text-center bg-background">
      <p className="text-lg font-semibold text-foreground">পাতাটি খুঁজে পাওয়া যায়নি</p>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        আপনি যে ঠিকানাটি খুঁজছেন সেটি এই অ্যাপে নেই।
      </p>
      <div className="mt-2 flex items-center gap-4">
        <Link
          href="/map"
          className="rounded-xl px-5 py-2.5 text-sm bg-primary hover:bg-primary-hover text-primary-foreground"
        >
          মানচিত্র খুলুন
        </Link>
        <Link href="/" className="text-sm text-primary underline-offset-4 hover:underline">
          প্রথম পাতা
        </Link>
      </div>
    </main>
  );
}
