import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-4xl space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <MapPin className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">TawafMap</h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            Navigate Makkah & Madinah with confidence
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <MapPin className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Gate Navigation</CardTitle>
              <CardDescription>Find the nearest Haram gate with walking directions</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Navigation className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Real-time Location</CardTitle>
              <CardDescription>GPS tracking with accuracy indicator</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Nearby Amenities</CardTitle>
              <CardDescription>Find restaurants, hotels, and services nearby</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <Link href="/map">
            <Button size="lg" className="gap-2">
              <MapPin className="w-5 h-5" />
              Open Map
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
