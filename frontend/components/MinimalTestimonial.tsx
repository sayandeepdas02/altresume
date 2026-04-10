"use client";
import { Panel, PanelHeader, PanelTitle, PanelTitleSup, PanelContent } from "@/components/ui/panel";
import { Testimonial, TestimonialsColumn } from "@/components/ui/testimonial-v2";

export function MinimalTestimonial() {
    const testimonials: Testimonial[] = [
      {
        text: "AltResume revolutionized our operations, tailoring resumes perfectly. The cloud-based platform keeps us productive.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Briana Patton",
        role: "Operations Manager",
      },
      {
        text: "Implementing this ATS-optimized engine was smooth and quick. The customizable, user-friendly interface made applying effortless.",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Bilal Ahmed",
        role: "Software Engineer",
      },
      {
        text: "The resume builder is exceptional, guiding us through setup and providing ongoing optimization immediately.",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Saman Malik",
        role: "Data Scientist",
      },
      {
        text: "AltResume's seamless keyword integration enhanced my application pipeline. Highly recommend for its intuitive interface.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Omar Raza",
        role: "CEO",
      },
      {
        text: "Its robust features and quick support have transformed our workflow, helping us land multiple offers faster.",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Zainab Hussain",
        role: "Project Manager",
      },
      {
        text: "The smooth implementation exceeded expectations. It streamlined job hunting, improving my callback rates astronomically.",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Aliza Khan",
        role: "Business Analyst",
      },
      {
        text: "Our applications improved with a user-friendly design and immediate positive recruiter feedback.",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Farhan Siddiqui",
        role: "Marketing Director",
      },
      {
        text: "They delivered a solution that exceeded expectations, understanding modern hiring needs and enhancing resumes dynamically.",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Sana Sheikh",
        role: "Sales Manager",
      },
      {
        text: "Using AltResume, our online presence and conversions significantly improved. Pure magic behind the scenes.",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Hassan Ali",
        role: "E-commerce Manager",
      },
    ];

    const firstColumn = testimonials.slice(0, 3);
    const secondColumn = testimonials.slice(3, 6);
    const thirdColumn = testimonials.slice(6, 9);

    return (
        <Panel id="testimonial">
            <PanelHeader>
                <PanelTitle>Testimonials <PanelTitleSup>({testimonials.length})</PanelTitleSup></PanelTitle>
            </PanelHeader>
            <PanelContent className="pt-12 px-0 overflow-hidden">
                <div 
                  className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[600px]"
                  role="region"
                  aria-label="Scrolling Testimonials"
                >
                    <TestimonialsColumn testimonials={firstColumn} duration={15} />
                    <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
                    <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
                </div>
            </PanelContent>
        </Panel>
    )
}
