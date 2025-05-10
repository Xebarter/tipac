"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";

export function CallToAction() {
  // Animation variants for entrance
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section className="w-full py-20 relative bg-gradient-to-b from-gray-900 to-black">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl z-0"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-15%] right-[-15%] w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl z-0"
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container relative z-10">
        <motion.div
          className="rounded-xl backdrop-blur-md bg-black/30 p-10 md:p-16 text-center border border-gray-500/20 shadow-lg relative overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 border border-transparent rounded-xl bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-pulse" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Support Our Mission
          </h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-gray-300">
            Your contribution helps us continue providing theatre education and
            opportunities for children across Uganda.
          </p>

          {/* Redirect to Donation Page */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Link href="/donation">
              <Button
                size="lg"
                className="relative bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:from-red-600 hover:via-purple-600 hover:to-blue-600 transition-all duration-300 overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                Make a Donation
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}