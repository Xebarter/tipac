import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";

export default function ProgramsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      {/* Program breadcrumbs and navigation */}
      <div className="bg-muted/30 border-b border-border">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Link href="/" className="hover:text-primary">Home</Link>
                <span className="mx-2">/</span>
                <Link href="/programs" className="hover:text-primary">Programs</Link>
                <span className="mx-2">/</span>
                <span className="text-foreground">Program Details</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link
                href="/programs/theatre-workshops"
                className="px-3 py-1 rounded-full border border-border hover:bg-primary/10 hover:border-primary/30"
              >
                Theatre Workshops
              </Link>
              <Link
                href="/programs/musical-theatre"
                className="px-3 py-1 rounded-full border border-border hover:bg-primary/10 hover:border-primary/30"
              >
                Musical Theatre
              </Link>
              <Link
                href="/programs/cultural-storytelling"
                className="px-3 py-1 rounded-full border border-border hover:bg-primary/10 hover:border-primary/30"
              >
                Cultural Storytelling
              </Link>
              <Link
                href="/programs/technical-theatre"
                className="px-3 py-1 rounded-full border border-border hover:bg-primary/10 hover:border-primary/30"
              >
                Technical Theatre
              </Link>
              <Link
                href="/programs/social-change"
                className="px-3 py-1 rounded-full border border-border hover:bg-primary/10 hover:border-primary/30"
              >
                Social Change
              </Link>
            </div>
          </div>
        </div>
      </div>

      {children}

      {/* Common CTA section */}
      <section className="w-full py-16 bg-muted/30">
        <div className="container">
          <div className="tipac-gradient rounded-xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">Ready to Enroll?</h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              Secure your child's spot in one of our transformative theatre programs. Registration is quick and easy!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex h-10 px-4 py-2 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-primary hover:bg-white/90"
              >
                Register Now
              </Link>
              <Link
                href="/programs"
                className="inline-flex h-10 px-4 py-2 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-white text-white hover:bg-white/10"
              >
                View All Programs
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
