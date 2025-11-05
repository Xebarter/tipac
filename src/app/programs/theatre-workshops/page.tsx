import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "Theatre Workshops | TIPAC",
  description:
    "Weekly theatre workshops for children ages 6-14 introducing the fundamentals of acting and stage performance in a fun, supportive environment.",
};

export default function TheatreWorkshopsPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="w-full py-12 md:py-20">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-block tipac-gradient px-3 py-1 rounded-full text-white text-sm font-medium mb-4">
                Ages 6-14
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Theatre Workshops
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Our weekly theatre workshops introduce children to the
                fundamentals of acting, improvisation, stage presence, and
                character development in a fun and supportive environment.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-calendar"
                  >
                    <path d="M8 2v4" />
                    <path d="M16 2v4" />
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <path d="M3 10h18" />
                  </svg>
                  Weekly Sessions
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-users"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Small Groups
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-sparkles"
                  >
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    <path d="M5 3v4" />
                    <path d="M19 17v4" />
                    <path d="M3 5h4" />
                    <path d="M17 19h4" />
                  </svg>
                  Beginner Friendly
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" className="tipac-gradient">
                  <Link href="/contact">Register Now</Link>
                </Button>
                <Button size="lg" variant="outline">
                  Download Schedule
                </Button>
              </div>
            </div>
            <div className="relative aspect-video rounded-lg overflow-hidden shadow-md">
              <Image
                src="https://source.unsplash.com/random/800x600?theatre,children,acting"
                alt="Theatre Workshops"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Program Details */}
      <section className="w-full py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Program Overview</h2>
            <p className="text-lg mb-6">
              TIPAC's Theatre Workshops provide a foundation in theatre arts,
              encouraging children to express themselves creatively in a safe,
              supportive environment. Our curriculum combines fun drama games,
              basic acting techniques, voice and movement exercises, and guided
              improvisation.
            </p>
            <p className="text-lg mb-12">
              Children work in small, age-appropriate groups led by experienced
              teaching artists who nurture their creative abilities while
              building essential life skills like teamwork, public speaking, and
              self-confidence.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-muted/30 rounded-lg p-6 border border-border">
                <h3 className="text-xl font-bold mb-4">What Children Learn</h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong>Basic Acting Techniques</strong>
                      <p className="text-muted-foreground">
                        Learning to inhabit characters and express emotions
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong>Voice & Movement</strong>
                      <p className="text-muted-foreground">
                        Using the body and voice as expressive tools
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong>Improvisation</strong>
                      <p className="text-muted-foreground">
                        Building confidence through spontaneous creativity
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong>Storytelling</strong>
                      <p className="text-muted-foreground">
                        Crafting and sharing compelling narratives
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-muted/30 rounded-lg p-6 border border-border">
                <h3 className="text-xl font-bold mb-4">Program Details</h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-calendar-days"
                      >
                        <path d="M8 2v4" />
                        <path d="M16 2v4" />
                        <rect width="18" height="18" x="3" y="4" rx="2" />
                        <path d="M3 10h18" />
                        <path d="M8 14h.01" />
                        <path d="M12 14h.01" />
                        <path d="M16 14h.01" />
                        <path d="M8 18h.01" />
                        <path d="M12 18h.01" />
                        <path d="M16 18h.01" />
                      </svg>
                    </div>
                    <div>
                      <strong>Schedule</strong>
                      <p className="text-muted-foreground">
                        Saturdays, 10am-12pm (Ages 6-9) and 1pm-3pm (Ages 10-14)
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-hourglass"
                      >
                        <path d="M5 22h14" />
                        <path d="M5 2h14" />
                        <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                        <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                      </svg>
                    </div>
                    <div>
                      <strong>Duration</strong>
                      <p className="text-muted-foreground">
                        Three 12-week terms (January-March, May-July,
                        September-November)
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-map-pin"
                      >
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div>
                      <strong>Location</strong>
                      <p className="text-muted-foreground">
                        TIPAC Main Center, 123 Theatre Lane, Kampala
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-wallet"
                      >
                        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                      </svg>
                    </div>
                    <div>
                      <strong>Cost</strong>
                      <p className="text-muted-foreground">
                        $150 per term (scholarships available)
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Curriculum */}
            <h2 className="text-2xl font-bold mb-6">Curriculum & Activities</h2>
            <div className="mb-12">
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/30 px-6 py-4 border-b border-border">
                  <h3 className="font-bold">Typical Workshop Structure</h3>
                </div>
                <div className="p-6">
                  <ol className="space-y-4">
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        1
                      </div>
                      <div>
                        <strong>Warm-up Games (20 min)</strong>
                        <p className="text-muted-foreground">
                          Physical and vocal exercises to energize the body and
                          voice
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        2
                      </div>
                      <div>
                        <strong>Skill Building (30 min)</strong>
                        <p className="text-muted-foreground">
                          Focused exercises on specific acting techniques
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        3
                      </div>
                      <div>
                        <strong>Creative Development (40 min)</strong>
                        <p className="text-muted-foreground">
                          Group improvisation or script work, building toward
                          the final showcase
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        4
                      </div>
                      <div>
                        <strong>Reflection Circle (15 min)</strong>
                        <p className="text-muted-foreground">
                          Group discussion on learnings and achievements
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        5
                      </div>
                      <div>
                        <strong>Cool Down (15 min)</strong>
                        <p className="text-muted-foreground">
                          Relaxation exercises and preparation for next session
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Special Features */}
            <h2 className="text-2xl font-bold mb-6">Special Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              <div className="border border-border rounded-lg p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-spotlight"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v4" />
                    <path d="M12 18v4" />
                    <path d="m4.9 4.9 2.8 2.8" />
                    <path d="m16.3 16.3 2.8 2.8" />
                    <path d="M2 12h4" />
                    <path d="M18 12h4" />
                    <path d="m4.9 19.1 2.8-2.8" />
                    <path d="m16.3 7.7 2.8-2.8" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">End-of-Term Showcase</h3>
                <p className="text-muted-foreground">
                  Each term culminates in a performance showcase for family and
                  friends, where children demonstrate their new skills.
                </p>
              </div>

              <div className="border border-border rounded-lg p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-user-check"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <polyline points="16 11 18 13 22 9" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">
                  Professional Teaching Artists
                </h3>
                <p className="text-muted-foreground">
                  All workshops are led by experienced theatre professionals
                  with backgrounds in education and child development.
                </p>
              </div>

              <div className="border border-border rounded-lg p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-clipboard-signature"
                  >
                    <path d="M8 7H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3" />
                    <path d="M8 7V3.5a2.5 2.5 0 0 1 5 0V7" />
                    <path d="M8 7h8" />
                    <path d="M8 16h4" />
                    <path d="m17 15-.998 1.999A1 1 0 0 1 15 18h-1" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Progress Reports</h3>
                <p className="text-muted-foreground">
                  Regular updates on your child's development, celebrating their
                  achievements and identifying areas for growth.
                </p>
              </div>
            </div>

            {/* Testimonials */}
            <h2 className="text-2xl font-bold mb-6">
              What Parents & Children Say
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-background p-6 rounded-lg border border-border shadow-sm">
                <div className="text-4xl text-accent mb-4">"</div>
                <p className="italic mb-6">
                  "My daughter was so shy before joining the theatre workshops.
                  After just one term, she's more confident speaking up in class
                  and making new friends. The transformation has been incredible
                  to watch."
                </p>
                <div>
                  <p className="font-bold">Sarah Johnson</p>
                  <p className="text-muted-foreground">Parent of Amelia, 8</p>
                </div>
              </div>

              <div className="bg-background p-6 rounded-lg border border-border shadow-sm">
                <div className="text-4xl text-accent mb-4">"</div>
                <p className="italic mb-6">
                  "I used to be scared to talk in front of people, but now I
                  love it! The games we play are so fun, and I've made lots of
                  new friends. I can't wait for the showcase!"
                </p>
                <div>
                  <p className="font-bold">Michael</p>
                  <p className="text-muted-foreground">
                    Workshop Participant, Age 7
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <h2 className="text-2xl font-bold mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4 mb-12">
              <div className="border border-border rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">
                  Does my child need previous experience?
                </h3>
                <p className="text-muted-foreground">
                  Not at all! Our Theatre Workshops are designed for children of
                  all experience levels, including complete beginners. Our
                  supportive environment helps everyone feel comfortable.
                </p>
              </div>

              <div className="border border-border rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">
                  What should my child wear to workshops?
                </h3>
                <p className="text-muted-foreground">
                  Children should wear comfortable clothes they can move in
                  easily and closed-toe shoes. No special costumes or equipment
                  are needed.
                </p>
              </div>

              <div className="border border-border rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">
                  Can parents observe the workshops?
                </h3>
                <p className="text-muted-foreground">
                  We have designated observation days twice per term where
                  parents are welcome to watch. This helps children build
                  independence while still sharing their progress with you.
                </p>
              </div>
            </div>

            {/* Registration Info */}
            <div className="bg-muted/30 p-8 rounded-lg border border-border mb-6">
              <h2 className="text-2xl font-bold mb-4">How to Register</h2>
              <p className="mb-6">
                Registration for our next term of Theatre Workshops is now open!
                Spaces fill quickly, so we recommend registering early to secure
                your child's spot.
              </p>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <div>
                    <strong>Complete the registration form</strong> by visiting
                    our Contact page or calling our office
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <div>
                    <strong>Pay the term fee</strong> (payment plans and
                    scholarships available)
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    3
                  </div>
                  <div>
                    <strong>Receive confirmation</strong> with all necessary
                    information about the workshops
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Button size="lg" className="tipac-gradient">
                  <Link href="/contact">Register Now</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
