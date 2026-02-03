// app/linkedin-updates/page.tsx
import Script from "next/script";
import Image from "next/image";

import { env } from "@/lib/env";

export default function LinkedInUpdatesPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className=" w-full aspect-16/6 md:aspect-16/5 lg:aspect-1920/600 max-h-[650px] relative text-white">
        <Image
          fill
          className="object-cover"
          src={`/images/supply-chain-hub/linkedin-banner.png`}
          alt={""}
        />
      </section>
      <section className="max-w-[1216px] mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-semibold text-[#4d4d4d] mb-16 text-center">
          Let's Talk Supply Chain™ LinkedIn Updates
        </h2>

        <div
          className={`elfsight-app-${env.ELFSIGHT_LINKEDIN_ID}`}
          data-elfsight-app-lazy
        />
        <Script
          src="https://elfsightcdn.com/platform.js"
          strategy="afterInteractive"
        />
      </section>
    </main>
  );
}
