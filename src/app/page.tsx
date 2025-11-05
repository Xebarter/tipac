import { CallToAction } from "@/components/CallToAction";
import { Events } from "@/components/Events";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { Testimonials } from "@/components/Testimonials";
import { YouTubeVideos } from "@/components/YouTubeVideos";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <Hero />
      <Events />
      <YouTubeVideos />
      <Features />
      <Testimonials />
      <CallToAction />
      <Footer />
    </main>
  );
}
