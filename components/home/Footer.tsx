import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-muted/50">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <Image src="/icons/Tawafmap.webp" alt="" width={28} height={28} className="rounded-lg" />
          <div className="text-sm">
            <span className="font-semibold text-foreground">TawafMap</span>
            <span className="ml-2 text-muted-foreground">প্রতিটি হাজির জন্য শান্ত এক সঙ্গী</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <a href="#how" className="text-sm text-muted-foreground hover:text-foreground">
            যেভাবে চলে
          </a>
          <a href="#landmarks" className="text-sm text-muted-foreground hover:text-foreground">
            চিহ্নিত স্থান
          </a>
          <Link href="/map">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
              ম্যাপ খুলুন
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
      <div className="border-t border-border/60">
        <p className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
          হাজিদের ভালোবাসায় তৈরি। স্থানাঙ্ক আনুমানিক, শুধু নকশামাত্র।
        </p>
      </div>
    </footer>
  );
}
