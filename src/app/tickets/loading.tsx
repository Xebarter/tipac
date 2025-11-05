import { Button } from "@/components/ui/button";

export default function TicketsLoading() {
  return (
    <section className="py-16 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Loading Events...
          </h2>
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Please wait while we load the available events and ticket
            information.
          </p>
        </div>
      </div>
    </section>
  );
}
