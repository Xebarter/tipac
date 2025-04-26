import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function ProgramsPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="w-full py-16 bg-muted/30">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Programs</h1>
            <p className="text-lg text-muted-foreground">
              TIPAC offers a variety of theatre and arts programs designed to inspire creativity, build confidence,
              and preserve cultural heritage among children in Uganda.
            </p>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="w-full py-12">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-6 border border-border rounded-lg shadow-sm">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full mx-auto flex items-center justify-center mb-4">
                  <span className="text-2xl">🎭</span>
                </div>
                <h3 className="text-lg font-bold mb-2">5+ Programs</h3>
                <p className="text-muted-foreground">Diverse programs catering to different interests and age groups</p>
              </div>

              <div className="p-6 border border-border rounded-lg shadow-sm">
                <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-full mx-auto flex items-center justify-center mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-lg font-bold mb-2">Ages 6-18</h3>
                <p className="text-muted-foreground">Programs tailored for children and teens of all experience levels</p>
              </div>

              <div className="p-6 border border-border rounded-lg shadow-sm">
                <div className="w-16 h-16 bg-accent/10 text-accent rounded-full mx-auto flex items-center justify-center mb-4">
                  <span className="text-2xl">🏆</span>
                </div>
                <h3 className="text-lg font-bold mb-2">1000+ Participants</h3>
                <p className="text-muted-foreground">A growing community of young performers and artists</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Programs Section */}
      <section className="w-full py-16">
        <div className="container">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Core Programs</h2>

          {/* Theatre Workshops Program */}
          <div id="theatre-workshops" className="mb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <Image
                  src="/image1.jpg"
                  alt="Theatre Workshops"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="inline-block tipac-gradient px-3 py-1 rounded-full text-white text-sm font-medium mb-4">
                  Ages 6-14
                </div>
                <h3 className="text-2xl font-bold mb-4">Theatre Workshops</h3>
                <p className="text-muted-foreground mb-6">
                  Our weekly theatre workshops introduce children to the fundamentals of acting, improvisation,
                  stage presence, and character development in a fun and supportive environment.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">✓</div>
                    <p><strong>Weekly Sessions:</strong> 2-hour workshops held every Saturday morning</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">✓</div>
                    <p><strong>Small Groups:</strong> Maximum 15 children per group, grouped by age</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">✓</div>
                    <p><strong>Performance Opportunities:</strong> End-of-term showcase for friends and family</p>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg border border-border mb-6">
                  <h4 className="font-bold mb-2">Program Details:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Three 12-week terms per year</li>
                    <li>No prior experience required</li>
                    <li>All materials provided</li>
                    <li>Scholarships available for families in need</li>
                  </ul>
                </div>

                <Button className="tipac-gradient">
                  Contact us
                </Button>
              </div>
            </div>
          </div>

          {/* Musical Theatre Program */}
          <div id="musical-theatre" className="mb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="order-1 lg:order-2">
                <div className="relative aspect-video overflow-hidden rounded-lg">
                  <Image
                    src="/image2.jpg"
                    alt="Musical Theatre Program"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="order-2 lg:order-1">
                <div className="inline-block tipac-gradient-reverse px-3 py-1 rounded-full text-white text-sm font-medium mb-4">
                  Ages 8-16
                </div>
                <h3 className="text-2xl font-bold mb-4">Musical Theatre Program</h3>
                <p className="text-muted-foreground mb-6">
                  Combining acting, singing, and dancing, our musical theatre program helps children develop
                  multiple performance skills while working on exciting productions that showcase their talents.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">✓</div>
                    <p><strong>Comprehensive Training:</strong> Voice, dance, and acting instruction</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">✓</div>
                    <p><strong>Two Major Productions:</strong> Full-scale performances twice yearly</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">✓</div>
                    <p><strong>Professional Guidance:</strong> Led by experienced music and theatre professionals</p>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg border border-border mb-6">
                  <h4 className="font-bold mb-2">Program Details:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Twice-weekly rehearsals (Tuesdays and Thursdays, 4-6pm)</li>
                    <li>Additional rehearsals before performances</li>
                    <li>Basic singing or acting experience recommended</li>
                    <li>Performance opportunities at community events</li>
                  </ul>
                </div>

                <Button className="tipac-gradient-reverse">
                  Contact us
                </Button>
              </div>
            </div>
          </div>

          {/* Storytelling Program */}
          <div id="storytelling" className="mb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <Image
                  src="/image3.jpg"
                  alt="Storytelling Program"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="inline-block tipac-gradient px-3 py-1 rounded-full text-white text-sm font-medium mb-4">
                  Ages 6-18
                </div>
                <h3 className="text-2xl font-bold mb-4">Cultural Storytelling Program</h3>
                <p className="text-muted-foreground mb-6">
                  This program focuses on preserving and sharing Uganda's rich cultural heritage through
                  traditional storytelling techniques, oral history, and performance.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">✓</div>
                    <p><strong>Cultural Immersion:</strong> Learn from community elders and cultural experts</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">✓</div>
                    <p><strong>Language Preservation:</strong> Stories told in both English and local languages</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">✓</div>
                    <p><strong>Community Outreach:</strong> Performances at schools and community centers</p>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg border border-border mb-6">
                  <h4 className="font-bold mb-2">Program Details:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Monthly weekend workshops</li>
                    <li>Open to all experience levels</li>
                    <li>Includes traditional music and movement elements</li>
                    <li>Culminates in community storytelling festival</li>
                  </ul>
                </div>

                <Button className="tipac-gradient">
                  Contact Us
                </Button>
              </div>
            </div>
          </div>

          {/* Technical Theatre Program */}
          <div id="technical-theatre" className="mb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="order-1 lg:order-2">
                <div className="relative aspect-video overflow-hidden rounded-lg">
                  <Image
                    src="/image4.jpg"
                    alt="Technical Theatre Program"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="order-2 lg:order-1">
                <div className="inline-block tipac-gradient-reverse px-3 py-1 rounded-full text-white text-sm font-medium mb-4">
                  Ages 12-18
                </div>
                <h3 className="text-2xl font-bold mb-4">Technical Theatre Program</h3>
                <p className="text-muted-foreground mb-6">
                  For those interested in the behind-the-scenes magic of theatre, this program teaches
                  set design, lighting, sound, costume design, and stage management.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">✓</div>
                    <p><strong>Hands-on Experience:</strong> Work on actual productions</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">✓</div>
                    <p><strong>Skill Development:</strong> Learn technical and creative problem-solving</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">✓</div>
                    <p><strong>Career Pathways:</strong> Introduction to technical theatre careers</p>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg border border-border mb-6">
                  <h4 className="font-bold mb-2">Program Details:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Weekly workshops during school terms</li>
                    <li>Rotation through different technical areas</li>
                    <li>Mentorship from professional technicians</li>
                    <li>Opportunity to crew for TIPAC productions</li>
                  </ul>
                </div>

                <Button className="tipac-gradient-reverse">
                  Contact Us
                </Button>
              </div>
            </div>
          </div>

          {/* Theatre for Social Change */}
          <div id="social-change" className="mb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <Image
                  src="/image5.jpg"
                  alt="Theatre for Social Change"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="inline-block tipac-gradient px-3 py-1 rounded-full text-white text-sm font-medium mb-4">
                  Ages 14-18
                </div>
                <h3 className="text-2xl font-bold mb-4">Theatre for Social Change</h3>
                <p className="text-muted-foreground mb-6">
                  Our advanced program for teenagers uses theatre as a tool to address social issues,
                  promote community dialogue, and inspire positive change.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">✓</div>
                    <p><strong>Issue-Based Theatre:</strong> Create performances addressing community concerns</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">✓</div>
                    <p><strong>Community Engagement:</strong> Performances in schools and public spaces</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">✓</div>
                    <p><strong>Leadership Development:</strong> Youth-led creative process</p>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg border border-border mb-6">
                  <h4 className="font-bold mb-2">Program Details:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Intensive 8-week sessions</li>
                    <li>Application process required</li>
                    <li>Collaboration with community organizations</li>
                    <li>Previous theatre experience recommended</li>
                  </ul>
                </div>

                <Button className="tipac-gradient">
                  Contact Us
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold mb-12 text-center">What Our Participants Say</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-lg border border-border shadow-sm">
              <div className="text-4xl text-accent mb-4">"</div>
              <p className="italic mb-6">
                "TIPAC's theatre workshops helped me overcome my shyness and find my voice. Now I can speak confidently in front of others, and I've made so many friends."
              </p>
              <div>
                <p className="font-bold">Esther, 12</p>
                <p className="text-muted-foreground">Theatre Workshops Participant</p>
              </div>
            </div>

            <div className="bg-background p-6 rounded-lg border border-border shadow-sm">
              <div className="text-4xl text-accent mb-4">"</div>
              <p className="italic mb-6">
                "The musical theatre program has been amazing. I've discovered my love for singing and dancing, and performing in front of an audience has been such a thrill!"
              </p>
              <div>
                <p className="font-bold">Joshua, 14</p>
                <p className="text-muted-foreground">Musical Theatre Participant</p>
              </div>
            </div>

            <div className="bg-background p-6 rounded-lg border border-border shadow-sm">
              <div className="text-4xl text-accent mb-4">"</div>
              <p className="italic mb-6">
                "Learning about our cultural stories through TIPAC has connected me to my heritage in a way I never expected. I'm proud to share these stories with others."
              </p>
              <div>
                <p className="font-bold">Grace, 16</p>
                <p className="text-muted-foreground">Storytelling Program Participant</p>
              </div>
            </div>
          </div>
        </div>
      </section>

            {/* FAQ Section */}
      <section className="w-full py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>

            <div className="space-y-6">
              <div className="border border-border rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">How do I register my child for a program?</h3>
                <p className="text-muted-foreground">
                  Registration can be done online through our website, by phone, or in person at our office.
                  Each program has specific registration periods, so check the program details for upcoming dates.
                </p>
              </div>

              <div className="border border-border rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">Are there any scholarships or financial assistance available?</h3>
                <p className="text-muted-foreground">
                  Yes, TIPAC is committed to making our programs accessible to all children. We offer partial
                  and full scholarships based on financial need. Please contact our office for more information.
                </p>
              </div>

              <div className="border border-border rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">What if my child has never done theatre before?</h3>
                <p className="text-muted-foreground">
                  No prior experience is needed for most of our programs! Our Theatre Workshops and
                  Cultural Storytelling programs are perfect for beginners and designed to build confidence gradually.
                </p>
              </div>

              <div className="border border-border rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">Where are programs held?</h3>
                <p className="text-muted-foreground">
                  Most programs take place at our main center in Kampala, though some workshops and
                  performances happen at partner schools and community centers throughout the region.
                </p>
              </div>

              <div className="border border-border rounded-lg p-6">
                <h3 className="text-xl font-bold mb-2">Can parents observe classes?</h3>
                <p className="text-muted-foreground">
                  We have designated observation days throughout each term where parents are welcome to
                  watch. We also have end-of-term showcases and performances open to families and friends.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}