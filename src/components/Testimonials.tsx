import Image from "next/image";
import Link from "next/link";

export function Testimonials() {
  const teamMembers = [
    {
      name: "Mr. Mugwanya Christopher",
      role: "Founder & Director",
      image: "/team/Christopher.jpg",
      bio: "With over 15 years of experience in arts education, Christopher founded TIPAC to bring theatrical arts to children across Uganda.",
      email: "christopher@tipac.co.ug",
      phone: "+256 772470972",
    },
    {
      name: "Mr. Abraham Sekasi",
      role: "International Coordinator",
      image: "/team/Abraham.jpg",
      bio: "Fred oversees all TIPAC programs and workshops, ensuring they meet educational standards while remaining engaging and accessible.",
      email: "sekasiabraham@tipac.co.ug",
      phone: "+256 705943474",
    },
    {
      name: "Mr. Kizza Fred",
      role: "Creative Director",
      image: "/team/Fred.jpg",
      bio: "Abraham brings productions to life through innovative direction and choreography, specializing in blending traditional and contemporary arts.",
      email: "fredkizza@tipac.co.ug",
      phone: "+256 702932010",
    },
  ];

  return (
    <section className="w-full py-16 bg-slate-50">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-4">Our Team</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Meet the passionate individuals behind TIPAC who are dedicated to transforming children's lives through theatrical arts
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className="bg-background rounded-lg border border-border p-6 shadow-sm flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg"
            >
              <div className="relative w-48 h-48 rounded-full overflow-hidden mb-6 border-4 border-accent">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-1">{member.name}</h3>
              <p className="text-accent font-medium mb-4">{member.role}</p>
              <p className="text-muted-foreground mb-6">{member.bio}</p>

              <div className="mt-auto w-full">
                <div className="flex flex-col space-y-4">
                  <Link
                    href={`mailto:${member.email}`}
                    className="flex items-center justify-center text-sm hover:text-primary transition-colors"
                  >
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
                      className="mr-2"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    {member.email}
                  </Link>

                  <Link
                    href={`tel:${member.phone.replace(/\s+/g, '')}`}
                    className="flex items-center justify-center text-sm hover:text-primary transition-colors"
                  >
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
                      className="mr-2"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    {member.phone}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}