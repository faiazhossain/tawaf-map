/**
 * গেট PMTiles প্রোটোকল (ক্লায়েন্ট-শুধু)
 *
 * maplibre-এ একটি `pmtiles://` প্রোটোকল রেজিস্টার করে যাতে গেট টাইল
 * (`public/tiles/gates.pmtiles`) ভেক্টর-সোর্স হিসেবে পড়া যায়।
 *
 * Next.js স্ট্যাটিক সার্ভিং-এ Byte Range সমর্থন অনিশ্চিত (FetchSource
 * `Range:` + ব্যবহার্য `Content-Length` চায়, নাহলে হেলায় ফেলে)। তাই এখানে
 * সার্ভারকে পুরো ফাইল একবারই ফেচ করে মেমরিতে ক্যাশ করা একটি কাস্টম `Source`
 * ব্যবহার করা হয় — pmtiles ৪.৫.০-এর `FileSource`-পর্যবেক্ষণ অনুসরণ করে
 * `getBytes(offset, length)` থেকে `blob.slice` দিয়ে পরিসীমা কাটা হয়।
 *
 * SSR-নিরাপদ: `typeof window === "undefined"` হলে নো-অপ; `window` ব্যবহার
 * তাই ক্লায়েন্ট-রান-টাইমেই সীমাবদ্ধ।
 */
import maplibregl from "maplibre-gl";
import { PMTiles, Protocol } from "pmtiles";
import type { Source } from "pmtiles";

/** PMTiles ফাইলের পাবলিক পথ (অ্যাপ রুটের আপেক্ষিক)। */
export const GATES_PMTILES_PATH = "/tiles/gates.pmtiles";

/** একটি ফোন-নেস্ট কাস্টম `Source` — পুরো ফাইল একবার ফেচ করে মেমরিতে ক্যাশ। */
class CachedBufferSource {
  private readonly url: string;
  private bufferPromise: Promise<ArrayBuffer> | null = null;

  constructor(url: string) {
    this.url = url;
  }

  /** pmtiles.protocol-এর `pmtiles://`-পূর্ববর্তী হোস্ট হিসেবে ব্যবহৃত কী। */
  getKey(): string {
    return this.url;
  }

  /** পরিসীমা নিয়ন্ত্রণ — মেমরিতে-ক্যাশ হওয়া পুরো বাফার থেকে `blob.slice`। */
  async getBytes(offset: number, length: number) {
    const buffer = await this._fetchBuffer();
    const quantized = buffer.slice(offset, offset + length);
    return { data: quantized };
  }

  private async _fetchBuffer(): Promise<ArrayBuffer> {
    if (this.bufferPromise) return this.bufferPromise;
    this.bufferPromise = (async () => {
      const res = await fetch(this.url);
      if (!res.ok) {
        throw new Error(
          `গেট টাইল ফেচ ব্যর্থ (${res.status}): ${this.url} — ` +
            `Byte Serving-নিরপেক্ষ সার্ভার জন্য কাস্টম বাফার সোর্স ব্যবহৃত।`
        );
      }
      return await res.arrayBuffer();
    })();
    return this.bufferPromise;
  }
}

/** মেমরিতে-ক্যাশ হওয়া কাস্টম সোর্স তৈরি করে (টেস্টেবল, ক্লায়েন্ট-নিরাপদ)। */
export function createCachedBufferSource(url: string): Source {
  return new CachedBufferSource(url);
}

/** PMTiles প্রোটোকল-রেজিস্ট্রার। ক্লিনআপ ফাংশন ফেরত দেয়। */
export function registerGatesPmtilesProtocol(): () => void {
  if (typeof window === "undefined") return () => {};
  const url = `${window.location.origin}${GATES_PMTILES_PATH}`;
  const protocol = new Protocol();
  protocol.add(new PMTiles(createCachedBufferSource(url)));
  maplibregl.addProtocol("pmtiles", protocol.tile);
  return () => {
    maplibregl.removeProtocol("pmtiles");
  };
}

/** গেট ভেক্টর-সোর্সের জন্য `pmtiles://` URL গঠন করে (ক্লায়েন্ট-বেসে)। */
export function gatesPmtilesUrl(): string {
  if (typeof window === "undefined") return GATES_PMTILES_PATH;
  return `pmtiles://${window.location.origin}${GATES_PMTILES_PATH}`;
}
