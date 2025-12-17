"use client";

import Image from "next/image";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import Head from "next/head";
import { FaLightbulb, FaEye, FaHistory, FaHeart } from "react-icons/fa";
import Link from "next/link";

export default function AboutPage() {
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeInOut" }
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
        <meta name="keywords" content="TIPAC, Uganda, theatre, children, non-profit, arts education" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <main className="min-h-screen flex flex-col font-sans selection:bg-purple-100">
        <Navbar />

        <section className="flex-1 relative py-20 md:py-32 px-4 overflow-hidden bg-gradient-to-br from-purple-50 via-white to-red-50">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(126,34,206,0.05)_0%,transparent_75%)] pointer-events-none" />
          <div className="absolute top-0 left-0 w-72 h-72 md:w-96 md:h-96 bg-purple-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-96 h-96 md:w-[32rem] md:h-[32rem] bg-red-200/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

          <div className="container max-w-6xl mx-auto space-y-16 md:space-y-24 relative z-10">

            {/* Page Title - Original Wording */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center bg-white/60 backdrop-blur-md rounded-[2rem] px-6 py-12 md:py-16 shadow-xl border border-white/40"
            >
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-6">
                About <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-red-600">TIPAC</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                Theatre Initiative for The Pearl of Africa Children (TIPAC) is a
                non-profit organization dedicated to empowering Ugandan children
                through the transformative power of theatre and performing arts.
              </p>
            </motion.div>

            {/* TIPAC in the News - Optimized for Speed & Mobile */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="rounded-[2.5rem] overflow-hidden border border-purple-100 shadow-2xl bg-white"
            >
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-1/2 h-64 md:h-96 lg:h-auto relative">
                  <Image
                    src="/gallery/20250426_181314(0).jpg"
                    alt="TIPAC Children's Festival"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    priority
                  />
                </div>
                <div className="lg:w-1/2 p-8 md:p-12 bg-gradient-to-br from-purple-700 to-red-600 text-white flex flex-col justify-center">
                  <h2 className="text-sm font-bold tracking-[0.2em] uppercase mb-4 opacity-90">
                    Latest News
                  </h2>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
                    TIPAC Children's Festival Debuts with Strong Message
                    Against Drug Abuse
                  </h3>
                  <p className="text-lg text-purple-50 mb-8 leading-relaxed">
                    Discover how TIPAC’s recent children’s festival is making a
                    difference by addressing critical social issues through
                    engaging performances.
                  </p>
                  <div>
                    <a
                      href="https://dailyexpress.co.ug/2025/04/30/tipac-childrens-festival-debuts-with-strong-message-against-drug-abuse/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-white text-purple-900 px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-purple-50 transition-all active:scale-95 w-full md:w-auto text-center"
                    >
                      Read Full Article
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Mission & Vision Grid */}
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {/* Mission */}
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-6 bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 md:p-10 shadow-lg border border-white/40"
              >
                <div className="flex items-center gap-4 text-red-600">
                  <FaLightbulb className="text-2xl" />
                  <h2 className="text-2xl font-bold text-gray-800">Our Mission</h2>
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
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-6 bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 md:p-10 shadow-lg border border-white/40"
              >
                <div className="flex items-center gap-4 text-purple-700">
                  <FaEye className="text-2xl" />
                  <h2 className="text-2xl font-bold text-gray-800">Our Vision</h2>
                </div>
                <p className="text-lg text-gray-700 leading-relaxed">
                  A Uganda where every child has the opportunity to express
                  themselves creatively, where traditional stories and cultural
                  heritage are preserved through theatre, and where communities are
                  strengthened through shared artistic experiences.
                </p>
              </motion.div>
            </div>

            {/* Story */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-6 bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 md:p-12 shadow-lg border border-white/40"
            >
              <div className="flex items-center gap-4 text-red-600 mb-2">
                <FaHistory className="text-2xl" />
                <h2 className="text-2xl font-bold text-gray-800">Our Story</h2>
              </div>
              <div className="space-y-4">
                <p className="text-lg text-gray-700 leading-relaxed">
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
              </div>
            </motion.div>

            {/* Call to Action Section - Original Buttons */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-white/90 backdrop-blur-md rounded-[2rem] p-10 md:p-16 border border-white/40 shadow-xl text-center"
            >
              <div className="flex items-center justify-center gap-3 text-purple-900 mb-4">
                <FaHeart className="text-xl" />
                <h3 className="text-xl font-bold">Join Our Mission</h3>
              </div>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed max-w-2xl mx-auto">
                Your support can make a real difference in the lives of Ugandan
                children. To donate, please use the link below.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                <a
                  href="mailto:info@tipac.org"
                  className="text-purple-600 hover:text-purple-800 underline font-bold transition duration-300"
                  aria-label="Email TIPAC at info@tipac.org"
                >
                  info@tipac.org
                </a>
                <Link
                  href="/donation"
                  className="inline-block bg-gradient-to-r from-red-500 to-purple-600 text-white px-10 py-4 rounded-xl font-bold hover:from-red-600 hover:to-purple-700 transition duration-300 shadow-lg active:scale-95 w-full sm:w-auto"
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