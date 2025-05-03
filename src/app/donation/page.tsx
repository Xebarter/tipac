"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import Head from "next/head";
import { FaEnvelope, FaPhone, FaMoneyCheckAlt, FaHeart } from "react-icons/fa";

export default function DonationPage() {
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeInOut" } },
  };

  return (
    <>
      <Head>
        <title>Donate to TIPAC | Support Ugandan Children Through Theatre</title>
        <meta
          name="description"
          content="Support TIPAC and empower Ugandan children through theatre. Learn how to donate and contribute to our mission."
        />
        <meta name="keywords" content="TIPAC, donate, support, Uganda, children, theatre, charity" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <main className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <section className="w-full py-28 md:py-36 px-6 lg:px-10 xl:px-16 bg-white">
          <div className="container max-w-4xl mx-auto text-center space-y-16">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <FaHeart className="text-4xl text-red-500 mx-auto" />
              <h1 className="text-4xl md:text-5xl font-extrabold text-purple-900 tracking-tight">
                Support Our Mission
              </h1>
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                Every donation brings us one step closer to building a brighter future
                for Ugandan children through the power of theatre and performing arts.
              </p>
            </motion.div>

            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="bg-purple-50 border border-purple-200 rounded-xl p-8 shadow-md space-y-8 text-left"
            >
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-purple-900 flex items-center gap-2">
                  <FaMoneyCheckAlt className="text-purple-700" /> How to Donate
                </h2>
                <p className="text-gray-700 text-lg">
                  We currently accept donations through
                  mobile money. To contribute, please reach out to us using the
                  contact details below.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-medium text-purple-800">Recipient Information</h3>
                <ul className="text-gray-700 text-base space-y-1">
                <li><strong>NUMBER:</strong> +256 776 742 690</li>
                  <li><strong>Name:</strong> FRED KIZZA</li>
                  <li><strong>Channel:</strong> MTN MOBILE MONEY</li>
                  <li><strong>Reason:</strong> TIPAC</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-medium text-purple-800">Contact Us</h3>
                <p className="text-gray-700">
                  Please confirm your donation with us so we can thank you and keep you updated.
                </p>
                <ul className="space-y-2 text-gray-700 text-base">
                  <li className="flex items-center gap-2">
                    <FaEnvelope className="text-purple-700" />
                    <a href="mailto:info@tipac.org" className="underline hover:text-purple-900">
                      info@tipac.org
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaPhone className="text-purple-700" />
                    <a href="tel:+256700123456" className="underline hover:text-purple-900">
                    +256 776 742 690
                    </a>
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <p className="text-lg text-gray-700 mb-4">
                Your generosity directly supports children's theatre education, creative workshops, and performances across Uganda.
              </p>
              <span className="inline-block bg-gradient-to-r from-red-500 to-purple-600 text-white px-6 py-3 rounded-md font-semibold shadow-lg">
                Thank you for believing in our mission!
              </span>
            </motion.div>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
