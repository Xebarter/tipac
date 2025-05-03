import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CallToAction() {
  return (
    <section className="w-full py-20">
      <div className="container">
        <div className="rounded-xl tipac-gradient-reverse p-10 md:p-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Support Our Mission
          </h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Your contribution helps us continue providing theatre education and
            opportunities for children across Uganda.
          </p>
          <Link href="/donation" passHref>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90 font-medium"
            >
              Make a Donation
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
