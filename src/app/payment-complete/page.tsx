// src/app/payment-complete/page.tsx
import { Suspense } from "react";
import PaymentCompleteContent from "./PaymentCompleteContent";

// The main page component, which can be prerendered (server component)
export default function PaymentComplete() {
  return (
    <section className="py-16 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
      {/* Remove the motion.div elements from here */}
      <div className="container mx-auto px-4 relative z-10">
        <Suspense
          fallback={
            <div className="max-w-md mx-auto backdrop-blur-md bg-black/30 rounded-xl shadow-lg border border-gray-500/20 p-8 text-center">
              <h2 className="text-4xl font-extrabold text-white mb-4 bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
                Loading...
              </h2>
              <p className="text-lg text-gray-300 mb-6">
                Please wait while we process your payment.
              </p>
            </div>
          }
        >
          <PaymentCompleteContent />
        </Suspense>
      </div>
    </section>
  );
}
