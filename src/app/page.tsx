import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingBook } from "@/components/layout/FloatingBook";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { Services } from "@/components/sections/Services";
import { GalleryStrip } from "@/components/sections/GalleryStrip";
import { Reasons } from "@/components/sections/Reasons";
import { BarberTeam } from "@/components/sections/BarberTeam";
import { Testimonials } from "@/components/sections/Testimonials";
import { Discount } from "@/components/sections/Discount";
import { Certificates } from "@/components/sections/Certificates";
import { BookingSteps } from "@/components/sections/BookingSteps";
import { Blog } from "@/components/sections/Blog";
import { Faq } from "@/components/sections/Faq";
import { BookingCTA } from "@/components/sections/BookingCTA";
export default function Home() {
  return <><Header/><main id="main"><Hero/><Marquee/><Services/><GalleryStrip/><Reasons/><BarberTeam/><Testimonials/><Discount/><Certificates/><BookingSteps/><Blog/><Faq/><BookingCTA/></main><Footer/><FloatingBook/></>;
}
