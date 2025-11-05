"use client";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import Head from "next/head";
import { FaLightbulb, FaEye, FaHistory, FaHeart } from "react-icons/fa";
import Link from "next/link"; // Import the Link component

export default function AboutPage() {
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeInOut" },
    },
  };

  return (
    <>
      <Head>
        <title>About TIPAC | Empowering Ugandan Children Through Theatre</title>
        <meta
          name="description"
          content="Learn about TIPAC, a non-profit dedicated to empowering Ugandan children through theatre and performing arts."
        />
        <meta
          name="keywords"
          content="TIPAC, Uganda, theatre, children, non-profit, arts education"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <main className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <section className="w-full py-28 md:py-36 px-6 lg:px-10 xl:px-16 bg-white">
          <div className="container max-w-6xl mx-auto space-y-24">
            {/* Page Title */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-extrabold text-purple-900 tracking-tight mb-8">
                About TIPAC
              </h1>
              <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                Theatre Initiative for The Pearl of Africa Children (TIPAC) is a
                non-profit organization dedicated to empowering Ugandan children
                through the transformative power of theatre and performing arts.
              </p>
            </motion.div>

            {/* TIPAC in the News */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="rounded-xl overflow-hidden border border-purple-200 shadow-lg bg-gradient-to-r from-red-500 to-purple-600 text-white"
            >
              <div className="md:flex">
                <img
                  src="/gallery/20250426_181314(0).jpg"
                  alt="TIPAC Children's Festival"
                  className="md:w-1/2 w-full h-64 md:h-96 object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
                <div className="p-8 flex flex-col justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Latest News</h2>
                    <h3 className="text-xl font-medium mb-2">
                      TIPAC Children's Festival Debuts with Strong Message
                      Against Drug Abuse
                    </h3>
                    <p className="text-base text-purple-100 mb-6 leading-relaxed">
                      Discover how TIPAC’s recent children’s festival is making
                      a difference by addressing critical social issues through
                      engaging performances.
                    </p>
                  </div>
                  <a
                    href="https://dailyexpress.co.ug/2025/04/30/tipac-childrens-festival-debuts-with-strong-message-against-drug-abuse/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Read the full article about TIPAC's children's festival"
                    className="inline-block bg-white text-purple-900 px-6 py-3 rounded-md font-medium shadow-md hover:bg-purple-100 transition duration-300"
                  >
                    Read Full Article
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Mission */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 text-red-600 mb-2">
                <FaLightbulb className="text-xl" />
                <h2 className="text-2xl font-semibold">Our Mission</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                To inspire, educate, and transform the lives of Ugandan children
                by providing access to quality theatre education, performance
                opportunities, and a creative community where they can develop
                their talents and build confidence.
              </p>
            </motion.div>

            {/* Vision */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 text-purple-900 mb-2">
                <FaEye className="text-xl" />
                <h2 className="text-2xl font-semibold">Our Vision</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                A Uganda where every child has the opportunity to express
                themselves creatively, where traditional stories and cultural
                heritage are preserved through theatre, and where communities
                are strengthened through shared artistic experiences.
              </p>
            </motion.div>

            {/* Story */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.8 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 text-red-600 mb-2">
                <FaHistory className="text-xl" />
                <h2 className="text-2xl font-semibold">Our Story</h2>
              </div>
              <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                Founded in 2021 by a group of passionate theatre artists, TIPAC
                recognized the urgent need for accessible arts education for
                children across Uganda. What started as small, impactful drama
                workshops in a handful of schools has blossomed into a
                nationwide initiative.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Today, our proud alumni are emerging as influential leaders,
                sharing their passion for theatre and driving community impact.
              </p>
            </motion.div>

            {/* Call to Action Section */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 1 }}
              className="bg-purple-50 rounded-xl p-12 border border-purple-200 shadow-md hover:shadow-lg transition-shadow duration-300 text-center"
            >
              <div className="flex items-center justify-center gap-3 text-purple-900 mb-4">
                <FaHeart className="text-xl" />
                <h3 className="text-xl font-semibold">Join Our Mission</h3>
              </div>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Your support can make a real difference in the lives of Ugandan
                children. To donate, please use the link below.
              </p>
              <div className="flex justify-center gap-4">
                <a
                  href="mailto:info@tipac.org"
                  className="text-purple-600 hover:text-purple-800 underline font-medium transition duration-300"
                  aria-label="Email TIPAC at info@tipac.org"
                >
                  info@tipac.org
                </a>
                <Link
                  href="/donation"
                  className="inline-block bg-gradient-to-r from-red-500 to-purple-600 text-white px-8 py-3 rounded-md font-semibold hover:from-red-600 hover:to-purple-700 transition duration-300 shadow-md"
                  aria-label="Donate to TIPAC via Pesapal"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Donate Now
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
        <Footer />
      </main>
    </>
  );
}
