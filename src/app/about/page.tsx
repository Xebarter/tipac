import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <section className="w-full py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">About TIPAC</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Theatre Initiative for The Pearl of Africa Children (TIPAC) is a non-profit organization dedicated to empowering children in Uganda through the transformative power of theatre and performing arts.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-4">Our Mission</h2>
            <p className="text-lg mb-6">
              To inspire, educate, and transform the lives of Ugandan children by providing access to quality theatre education, performance opportunities, and a creative community where they can develop their talents and build confidence.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-4">Our Vision</h2>
            <p className="text-lg mb-6">
              A Uganda where every child has the opportunity to express themselves creatively, where traditional stories and cultural heritage are preserved through theatre, and where communities are strengthened through shared artistic experiences.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-4">Our Story</h2>
            <p className="text-lg mb-6">
              TIPAC was founded in 2021 by a group of passionate theatre artists who recognized the lack of arts education opportunities for children in Uganda. What began as small drama workshops in a few schools has grown into a comprehensive program that reaches thousands of children across the country.
            </p>
            <p className="text-lg mb-12">
              Through partnerships with schools, community centers, and international organizations, we've been able to expand our reach and impact. Today, TIPAC alumni are pursuing careers in the arts, becoming leaders in their communities, and passing on their love of theatre to the next generation.
            </p>

            <div className="bg-muted/30 rounded-lg p-8 border border-border">
              <h3 className="text-xl font-bold mb-4">Join Our Mission</h3>
              <p className="mb-6">
                Whether you're interested in volunteering, donating, or partnering with us, there are many ways to support TIPAC's work.
              </p>
              <p className="font-medium">
                Contact us at <span className="text-primary">info@tipac.org</span> to learn more.
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
