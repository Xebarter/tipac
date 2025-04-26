import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export default function ContactPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <section className="w-full py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
            <p className="text-lg text-muted-foreground mb-8">
              We'd love to hear from you! Please use the form below to get in touch with our team.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div>
                <h2 className="text-2xl font-bold mb-4">Get In Touch</h2>
                <form
                  method="POST"
                  action="/api/contact"
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full p-2 border border-border rounded-md"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full p-2 border border-border rounded-md"
                      placeholder="Your email"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      className="w-full p-2 border border-border rounded-md"
                      placeholder="Subject"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-1">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      className="w-full p-2 border border-border rounded-md"
                      placeholder="Your message"
                    />
                  </div>
                  <Button type="submit" className="w-full tipac-gradient">
                    Send Message
                  </Button>
                </form>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
                <div className="bg-muted/30 p-6 rounded-lg border border-border">
                  <div className="mb-6">
                    <h3 className="font-bold mb-2">Address</h3>
                    <p className="text-muted-foreground">
                      National Theatre
                      <br />
                      Kampala, Uganda
                    </p>
                  </div>
                  <div className="mb-6">
                    <h3 className="font-bold mb-2">Email</h3>
                    <p className="text-primary">info@tipac.org</p>
                  </div>
                  <div className="mb-6">
                    <h3 className="font-bold mb-2">Phone</h3>
                    <p className="text-muted-foreground">+256 772 470 972</p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Hours</h3>
                    <p className="text-muted-foreground">
                      Monday - Friday: 9am - 5pm
                      <br />
                      Saturday: 10am - 2pm
                      <br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
