import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	return (
		<div className="w-full h-full">
			<div className="h-screen rounded-md bg-neutral-900 flex flex-col items-center justify-center relative w-full">
			<h2 className="relative flex-col md:flex-row z-10 text-3xl md:text-5xl md:leading-tight max-w-5xl mx-auto text-center tracking-tight font-medium bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white flex items-center gap-2 md:gap-8">
				<span>Découvrez</span>
				<span className="font-bold">Ecole Tres Directe</span>
			</h2>
			<Link to="/login">
			<HoverBorderGradient
				containerClassName="rounded-full mt-14 w-fit"
				as="button"
				className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2"
			>
				<span>Tester</span>
				<img src="/etd.svg" alt="Ecole Tres Directe" width={20} height={20} />
			</HoverBorderGradient>
			</Link>
			<ShootingStars />
			<StarsBackground />
			</div>
		</div>
	);
}
