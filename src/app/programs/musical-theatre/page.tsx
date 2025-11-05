import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "Musical Theatre Program | TIPAC",
  description:
    "Comprehensive musical theatre training for children ages 8-16, combining acting, singing, and dancing with performance opportunities.",
};

export default function MusicalTheatrePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="w-full py-12 md:py-20">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-block tipac-gradient-reverse px-3 py-1 rounded-full text-white text-sm font-medium mb-4">
                Ages 8-16
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Musical Theatre Program
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Combining acting, singing, and dancing, our comprehensive
                musical theatre program helps children develop multiple
                performance skills while working on exciting productions that
                showcase their talents.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">
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
                    className="lucide lucide-music"
                  >
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                  Voice Training
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">
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
                    className="lucide lucide-footprints"
                  >
                    <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.74 2 11 3.2 11 5c0 4-1 6-1 6h1c0-4 1-6 1-6 0-1.8 1.26-3 3.5-3 3.01 0 4.47 3.28 4.5 6 .03 2.5-1 3.5-1 5.62V16" />
                    <path d="M10 20c.6.5 1.313 1 2.5 1 1.164 0 1.922-.5 2.5-1" />
                  </svg>
                  Dance
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">
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
                    className="lucide lucide-theater"
                  >
                    <path d="M2 10s3-3 3-8" />
                    <path d="M22 10s-3-3-3-8" />
                    <path d="M10 2c0 4.4-3.6 8-8 8" />
                    <path d="M14 2c0 4.4 3.6 8 8 8" />
                    <path d="M2 10s2 2 2 5" />
                    <path d="M22 10s-2 2-2 5" />
                    <path d="M8 15h8" />
                    <path d="M9 19l3-4 3 4" />
                  </svg>
                  Acting
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">
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
                    className="lucide lucide-microphone-2"
                  >
                    <path d="m12 8-9.04 9.06a2.82 2.82 0 1 0 3.98 3.98L16 12" />
                    <circle cx="17" cy="7" r="5" />
                  </svg>
                  Performances
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" className="tipac-gradient-reverse">
                  <Link href="/contact">Apply Now</Link>
                </Button>
                <Button size="lg" variant="outline">
                  View Upcoming Shows
                </Button>
              </div>
            </div>
            <div className="order-1 lg:order-2 relative aspect-video rounded-lg overflow-hidden shadow-md">
              <Image
                src="https://source.unsplash.com/random/800x600?musical,children,performance"
                alt="Musical Theatre Program"
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
              TIPAC's Musical Theatre Program offers comprehensive training in
              all aspects of musical theatre performance. This program brings
              together singing, dancing, and acting to create well-rounded young
              performers capable of tackling the demands of musical productions.
            </p>
            <p className="text-lg mb-12">
              Students work with a team of professional instructors specializing
              in voice, movement, and drama to develop their skills while
              preparing for two major productions per year. The program focuses
              not only on performance techniques but also on building
              confidence, teamwork, and creative expression.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-muted/30 rounded-lg p-6 border border-border">
                <h3 className="text-xl font-bold mb-4">
                  Three-Part Curriculum
                </h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong>Vocal Training</strong>
                      <p className="text-muted-foreground">
                        Breathing techniques, pitch, tone, and ensemble singing
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong>Dance & Movement</strong>
                      <p className="text-muted-foreground">
                        Basic choreography, rhythm, and stage movement
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong>Acting for Musical Theatre</strong>
                      <p className="text-muted-foreground">
                        Character development and storytelling through song
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong>Production Experience</strong>
                      <p className="text-muted-foreground">
                        Applying skills in fully realized musical performances
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
                        Tuesdays and Thursdays, 4:00-6:00pm
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
                        Year-round program with two production cycles
                        (additional rehearsals before performances)
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
                        TIPAC Main Center and Performance Hall
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
                        $350 per semester (scholarships available)
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Productions Section */}
            <h2 className="text-2xl font-bold mb-6">Upcoming Productions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="relative h-48">
                  <Image
                    src="https://source.unsplash.com/random/600x400?musical,stage"
                    alt="Lion King Jr"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <div className="p-4 text-white">
                      <h3 className="text-xl font-bold">The Lion King Jr.</h3>
                      <p>June 2025</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-muted-foreground mb-4">
                    Our spring production brings the African savannah to life
                    with stunning costumes, original choreography, and the
                    unforgettable music of Elton John and Tim Rice.
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                      Rehearsals start March
                    </span>
                    <Button variant="outline" size="sm">
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="relative h-48">
                  <Image
                    src="https://source.unsplash.com/random/600x400?wizard,fantasy"
                    alt="The Wizard of Oz"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <div className="p-4 text-white">
                      <h3 className="text-xl font-bold">The Wizard of Oz</h3>
                      <p>December 2025</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-muted-foreground mb-4">
                    Follow the yellow brick road in our holiday production
                    featuring magical sets, special effects, and all the beloved
                    songs from this timeless classic.
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                      Auditions in September
                    </span>
                    <Button variant="outline" size="sm">
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Teaching Artists */}
            <h2 className="text-2xl font-bold mb-6">Our Teaching Artists</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                  <Image
                    src="https://source.unsplash.com/random/200x200?woman,singer"
                    alt="Voice Instructor"
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-lg font-bold">Grace Namuli</h3>
                <p className="text-secondary font-medium mb-2">
                  Voice Director
                </p>
                <p className="text-muted-foreground text-sm">
                  Graduate of the Royal Academy of Music with 15 years of
                  experience teaching vocal techniques.
                </p>
              </div>

              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                  <Image
                    src="https://source.unsplash.com/random/200x200?man,dancer"
                    alt="Dance Instructor"
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-lg font-bold">David Okello</h3>
                <p className="text-secondary font-medium mb-2">Choreographer</p>
                <p className="text-muted-foreground text-sm">
                  Former professional dancer with the Kampala Contemporary Dance
                  Company and expert in various dance styles.
                </p>
              </div>

              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                  <Image
                    src="https://source.unsplash.com/random/200x200?woman,director"
                    alt="Director"
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-lg font-bold">Maria Kiwanuka</h3>
                <p className="text-secondary font-medium mb-2">Director</p>
                <p className="text-muted-foreground text-sm">
                  Theatre director with international experience staging
                  musicals across East Africa and Europe.
                </p>
              </div>
            </div>

            {/* Testimonials */}
            <h2 className="text-2xl font-bold mb-6">Student Success Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-background p-6 rounded-lg border border-border shadow-sm">
                <div className="text-4xl text-accent mb-4">"</div>
                <p className="italic mb-6">
                  "The musical theatre program at TIPAC has been life-changing
                  for me. I've discovered my passion for performing and gained
                  so much confidence. Our production of 'Annie' was one of the
                  proudest moments of my life!"
                </p>
                <div>
                  <p className="font-bold">Lily Achieng</p>
                  <p className="text-muted-foreground">Student, Age 14</p>
                </div>
              </div>

              <div className="bg-background p-6 rounded-lg border border-border shadow-sm">
                <div className="text-4xl text-accent mb-4">"</div>
                <p className="italic mb-6">
                  "My son has always been musical, but the comprehensive
                  training at TIPAC has taken his abilities to a new level. The
                  instructors are exceptional, and the community atmosphere is
                  so supportive."
                </p>
                <div>
                  <p className="font-bold">Robert Kato</p>
                  <p className="text-muted-foreground">Parent</p>
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
                  What level of experience is required?
                </h3>
                <p className="text-muted-foreground">
                  While some basic singing or acting experience is helpful, we
                  welcome students of all levels. During auditions, we look for
                  enthusiasm, willingness to learn, and basic musical aptitude
                  rather than polished skills.
                </p>
              </div>

              <div className="border border-border rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">
                  Is there an audition process?
                </h3>
                <p className="text-muted-foreground">
                  Yes, there is a simple audition process to help us place
                  students in appropriate roles and understand their current
                  skill level. Auditions involve singing a short prepared piece,
                  basic movement exercises, and a brief acting improv.
                </p>
              </div>

              <div className="border border-border rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">
                  What is the time commitment?
                </h3>
                <p className="text-muted-foreground">
                  Regular classes are twice weekly for 2 hours each. As
                  productions approach, additional rehearsals are scheduled on
                  weekends. Students must be able to commit to all performance
                  dates.
                </p>
              </div>
            </div>

            {/* Application Info */}
            <div className="tipac-gradient-reverse p-8 rounded-lg border border-border mb-6 text-white">
              <h2 className="text-2xl font-bold mb-4">
                Join Our Musical Theatre Program
              </h2>
              <p className="mb-6">
                Applications for our next session are now open. To apply, follow
                these steps:
              </p>
              <div className="space-y-4 text-white/90">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <div>
                    <strong>Complete the online application form</strong>{" "}
                    including your performance experience and interests
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <div>
                    <strong>Schedule an audition date</strong> from our
                    available options
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center flex-shrink-0">
                    3
                  </div>
                  <div>
                    <strong>Prepare a short song</strong> (1-2 minutes) of your
                    choice for the audition
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Button
                  size="lg"
                  className="bg-white text-secondary hover:bg-white/90"
                >
                  <Link href="/contact">Apply Now</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
