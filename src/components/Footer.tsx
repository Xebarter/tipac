import Link from "next/link";
import {
  FaXTwitter,
  FaTiktok,
  FaInstagram,
  FaYoutube,
  FaWhatsapp,
} from "react-icons/fa6";

export function Footer() {
  return (
    <footer className="w-full py-8 mt-12 border-t border-border">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">TIPAC</h3>
            <p className="text-muted-foreground">
              Theatre Initiative for The Pearl of Africa Children. Empowering
              children through the art of theatre in Uganda.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-primary transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/programs"
                  className="hover:text-primary transition-colors"
                >
                  Programs
                </Link>
              </li>
              <li>
                <Link
                  href="/gallery"
                  className="hover:text-primary transition-colors"
                >
                  Gallery
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-primary transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <address className="not-italic text-muted-foreground">
              <p>National Theatre</p>
              <p>Kampala, Uganda</p>
              <p className="mt-2">
                Email:{" "}
                <Link
                  href="mailto:info@tipac.org"
                  className="hover:text-primary transition-colors"
                >
                  info@tipac.org
                </Link>
              </p>
              <p>
                Phone:{" "}
                <Link
                  href="tel:+256772470972"
                  className="hover:text-primary transition-colors"
                >
                  +256 772 470 972
                </Link>
              </p>
            </address>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} TIPAC. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link
              href={`https://x.com/Tipac199427`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <FaXTwitter size={20} />
            </Link>
            <Link
              href={`https://www.tiktok.com/@tipac10`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <FaTiktok size={20} />
            </Link>
            <Link
              href={`https://www.instagram.com/tipac101/`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <FaInstagram size={20} />
            </Link>
            <Link
              href={`https://www.youtube.com/@TIPAC-UG`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <FaYoutube size={20} />
            </Link>
            <Link
              href={`https://whatsapp.com/channel/0029Vb658OhC1Fu6Q7XAzK2i`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <FaWhatsapp size={20} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
