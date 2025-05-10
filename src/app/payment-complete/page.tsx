import { Suspense } from "react";
import { motion } from "framer-motion";
import PaymentCompleteContent from "./PaymentCompleteContent";

export default function PaymentComplete() {
  return (
    <section className="py-16 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
      
      <motion.div
        className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

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
