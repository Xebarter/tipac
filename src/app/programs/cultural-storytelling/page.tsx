import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "Cultural Storytelling Program | TIPAC",
  description: "Our storytelling program preserves Uganda's rich cultural heritage through traditional storytelling techniques, oral history, and performance."
};

export default function CulturalStorytellingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="w-full py-12 md:py-20">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-block tipac-gradient px-3 py-1 rounded-full text-white text-sm font-medium mb-4">
                Ages 6-18
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Cultural Storytelling Program</h1>
              <p className="text-lg text-muted-foreground mb-6">
                This program focuses on preserving and sharing Uganda's rich cultural heritage through
                traditional storytelling techniques, oral history, and performance. Children learn to
                appreciate and share the stories that form the heart of their cultural identity.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open-text"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/><path d="M6 8h2"/><path d="M6 12h2"/><path d="M16 8h2"/><path d="M16 12h2"/></svg>
                  Cultural Immersion
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-languages"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>
                  Multilingual
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Community Outreach
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" className="tipac-gradient">
                  <Link href="/contact">Join Program</Link>
                </Button>
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="relative aspect-video rounded-lg overflow-hidden shadow-md">
              <Image
                src="https://source.unsplash.com/random/800x600?africa,storytelling"
                alt="Cultural Storytelling"
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
              TIPAC's Cultural Storytelling Program is dedicated to preserving and celebrating Uganda's
              rich storytelling traditions. In an age of digital media and global influences, we believe
              it's vital to connect children with their cultural heritage through the timeless art of storytelling.
            </p>
            <p className="text-lg mb-12">
              Our program brings together professional storytellers, cultural elders, and teaching artists
              to share traditional tales and techniques with a new generation. Children learn not only to
              retell these stories but to understand their cultural significance and to develop their own
              storytelling voices.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-muted/30 rounded-lg p-6 border border-border">
                <h3 className="text-xl font-bold mb-4">Program Highlights</h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">✓</div>
                    <div>
                      <strong>Traditional Storytelling</strong>
                      <p className="text-muted-foreground">Learning classic Ugandan folktales, fables, and legends</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">✓</div>
                    <div>
                      <strong>Performance Techniques</strong>
                      <p className="text-muted-foreground">Voice modulation, gesture, and audience engagement</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">✓</div>
                    <div>
                      <strong>Cultural Context</strong>
                      <p className="text-muted-foreground">Understanding the historical and social significance of stories</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">✓</div>
                    <div>
                      <strong>Creative Development</strong>
                      <p className="text-muted-foreground">Creating and adapting stories for contemporary audiences</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-muted/30 rounded-lg p-6 border border-border">
                <h3 className="text-xl font-bold mb-4">Program Details</h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-days"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                    </div>
                    <div>
                      <strong>Schedule</strong>
                      <p className="text-muted-foreground">Monthly weekend workshops (Last Saturday of each month, 9am-1pm)</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div>
                      <strong>Age Groups</strong>
                      <p className="text-muted-foreground">Junior (6-10), Intermediate (11-14), and Senior (15-18)</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-clock"><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.5"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><circle cx="17" cy="17" r="4"/><path d="M17 15v3l2 1"/></svg>
                    </div>
                    <div>
                      <strong>Duration</strong>
                      <p className="text-muted-foreground">Ongoing program with annual storytelling festival in December</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wallet"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                    </div>
                    <div>
                      <strong>Cost</strong>
                      <p className="text-muted-foreground">$25 per monthly workshop or $250 for annual membership</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Cultural Significance */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Cultural Preservation & Heritage</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <Image
                    src="https://source.unsplash.com/random/600x600?elder,storytelling"
                    alt="Elder Storytelling"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-lg mb-4">
                    Stories are the vehicles through which cultures pass down wisdom, values, and history
                    from generation to generation. In Uganda, with its rich tapestry of ethnic groups and
                    languages, storytelling has been central to cultural continuity for centuries.
                  </p>
                  <p className="text-lg mb-4">
                    Our program partners with cultural elders and knowledge keepers from various Ugandan
                    communities to ensure that these stories are not just preserved but shared in authentic ways.
                  </p>
                  <p className="text-lg">
                    Children learn stories in both English and local languages, helping to preserve
                    linguistic diversity while making these cultural treasures accessible to all.
                  </p>
                </div>
              </div>
            </div>

            {/* Workshop Structure */}
            <h2 className="text-2xl font-bold mb-6">Monthly Workshop Structure</h2>
            <div className="mb-12">
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/30 px-6 py-4 border-b border-border">
                  <h3 className="font-bold">Workshop Flow</h3>
                </div>
                <div className="p-6">
                  <ol className="space-y-4">
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">1</div>
                      <div>
                        <strong>Welcome Circle (30 min)</strong>
                        <p className="text-muted-foreground">Opening rituals, community building, and introducing the day's theme</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">2</div>
                      <div>
                        <strong>Elder Storytelling (45 min)</strong>
                        <p className="text-muted-foreground">Learning from cultural elders sharing traditional tales</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">3</div>
                      <div>
                        <strong>Technique Building (45 min)</strong>
                        <p className="text-muted-foreground">Developing storytelling skills through guided exercises</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">4</div>
                      <div>
                        <strong>Break (15 min)</strong>
                        <p className="text-muted-foreground">Refreshments and informal conversation</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">5</div>
                      <div>
                        <strong>Story Development (60 min)</strong>
                        <p className="text-muted-foreground">Working in small groups to develop and practice stories</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">6</div>
                      <div>
                        <strong>Sharing Circle (45 min)</strong>
                        <p className="text-muted-foreground">Presenting stories to the full group and feedback</p>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Annual Festival */}
            <h2 className="text-2xl font-bold mb-6">Annual Storytelling Festival</h2>
            <div className="border border-border rounded-lg overflow-hidden mb-12">
              <div className="relative h-64">
                <Image
                  src="https://source.unsplash.com/random/1200x600?festival,performance,children"
                  alt="Storytelling Festival"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                  <div className="p-6 text-white max-w-3xl">
                    <h3 className="text-xl font-bold mb-2">Voices of Uganda: Annual Children's Storytelling Festival</h3>
                    <p>A celebration of stories, tradition, and young storytellers from across the country</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="mb-4">
                  The highlight of our Cultural Storytelling Program is the annual "Voices of Uganda" festival
                  held each December. This three-day event brings together children from all our storytelling
                  groups to share the stories they've learned and developed throughout the year.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="border border-border rounded p-4">
                    <h4 className="font-bold mb-2">Public Performances</h4>
                    <p className="text-sm text-muted-foreground">
                      Children perform for the community, sharing stories in multiple languages
                    </p>
                  </div>
                  <div className="border border-border rounded p-4">
                    <h4 className="font-bold mb-2">Cultural Workshops</h4>
                    <p className="text-sm text-muted-foreground">
                      Open sessions where attendees can learn basic storytelling techniques
                    </p>
                  </div>
                  <div className="border border-border rounded p-4">
                    <h4 className="font-bold mb-2">Elder Honors</h4>
                    <p className="text-sm text-muted-foreground">
                      Recognition of elders who have contributed to preserving cultural stories
                    </p>
                  </div>
                </div>
                <p className="text-primary font-medium">
                  Next Festival: December 15-17, 2025 at the TIPAC Cultural Center
                </p>
              </div>
            </div>

            {/* Testimonials */}
            <h2 className="text-2xl font-bold mb-6">Voices from the Program</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-background p-6 rounded-lg border border-border shadow-sm">
                <div className="text-4xl text-accent mb-4">"</div>
                <p className="italic mb-6">
                  "Learning about our traditional stories has connected me to my grandparents in a new way.
                  Now when I visit my village, I can understand the stories they tell and even share new ones
                  with them. It's like building a bridge between generations."
                </p>
                <div>
                  <p className="font-bold">Grace</p>
                  <p className="text-muted-foreground">Student, Age 16</p>
                </div>
              </div>

              <div className="bg-background p-6 rounded-lg border border-border shadow-sm">
                <div className="text-4xl text-accent mb-4">"</div>
                <p className="italic mb-6">
                  "As a cultural elder, sharing our stories with these children gives me hope. They are so
                  eager to learn, and they bring fresh energy to tales I've been telling for decades.
                  This program ensures our cultural wisdom will continue."
                </p>
                <div>
                  <p className="font-bold">Elder Joseph Mugisha</p>
                  <p className="text-muted-foreground">Program Mentor</p>
                </div>
              </div>
            </div>

            {/* Join the Program */}
            <div className="tipac-gradient p-8 rounded-lg border border-border mb-6 text-white">
              <h2 className="text-2xl font-bold mb-4">Join Our Cultural Storytelling Program</h2>
              <p className="mb-6">
                Registration is open year-round, with new participants welcome to join at the beginning of any month.
              </p>
              <div className="space-y-4 text-white/90">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center flex-shrink-0">1</div>
                  <div>
                    <strong>Complete registration form</strong> online or at our center
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center flex-shrink-0">2</div>
                  <div>
                    <strong>Select your membership type</strong> (monthly or annual)
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center flex-shrink-0">3</div>
                  <div>
                    <strong>Attend your first workshop</strong> to begin your storytelling journey
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90">
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
