"use client";

import Link from "next/link";

export function Hero() {
  return (
    <section className="relative py-24 md:py-32 bg-gradient-to-br from-red-600 via-pink-500 to-purple-700 text-white overflow-hidden">
      {/* Animated Gradient Shapes */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-400 to-pink-400 opacity-30 rounded-full blur-3xl animate-bounce-slow"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-yellow-400 to-red-400 opacity-20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-gradient-to-tr from-fuchsia-500 to-purple-600 opacity-20 rounded-full blur-2xl animate-spin-slow"></div>

      {/* Main Content */}
      <div className="relative z-10 container text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
          TIPAC MDD & Poetry Festival
        </h1>
        <p className="text-lg md:text-2xl font-medium max-w-2xl mx-auto">
          Happening <span className="text-yellow-300 font-bold">Today</span> at the{" "}
          <span className="underline underline-offset-4">National Theatre</span>!
        </p>
        <p className="text-md md:text-lg">
          Ordinary: <span className="font-bold text-yellow-200">UGX 20,000</span> | VIP:{" "}
          <span className="font-bold text-yellow-200">UGX 50,000</span><br />
          Tickets available at the entrance.
        </p>

        {/* Single Button */}
        <div className="flex justify-center mt-8">
          <Link href="/gallery">
            <button className="bg-white text-purple-700 font-bold rounded-full px-10 py-4 hover:bg-purple-200 transition">
              Have a Look
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
