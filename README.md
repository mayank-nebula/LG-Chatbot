import Link from "next/link";
import { MoveLeft, Search, Radio, Newspaper, Calendar } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-[75vh] flex items-center justify-center bg-linear-to-b from-white to-gray-200 px-4 border-t border-gray-50">
      <div className="max-w-3xl w-full text-center -mt-10">
        {/* Error Code */}
        <span className="text-[#F09033] font-bold tracking-[0.3em] uppercase text-sm mb-4 block">
          404 Error
        </span>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#221f20] mb-6 tracking-tight">
          Page Not Found
        </h1>

        {/* Description - Using the site's value proposition */}
        <p className="text-gray-600 text-lg md:text-xl mb-12 leading-relaxed max-w-2xl mx-auto">
          We couldn&apos;t find the page you were looking for. You may have
          typed the address incorrectly, or the page may have moved. Explore our
          latest industry insights, expert interviews, and trend analysis below.
        </p>

        {/* Primary Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#F09033] text-white px-8 py-4 rounded-full font-bold hover:bg-[#221f20] transition-all duration-300"
          >
            <MoveLeft size={18} />
            Back to Home
          </Link>
          <Link
            href="/podcasts"
            className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-[#221f20] text-[#221f20] px-8 py-4 rounded-full font-bold hover:bg-[#221f20] hover:text-white transition-all duration-300"
          >
            <Radio size={18} />
            View Podcasts
          </Link>
        </div>
      </div>
    </main>
  );
}
