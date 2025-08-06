import { Logo } from "@/components/ui/logo";

const Header = () => {
  return <nav className="flex justify-between items-center p-4 bg-primary">
    <div className="flex items-center gap-2">
      <Logo size="lg" color="white"/>
      <h1 className="text-white font-rubik text-2xl font-bold">Defi Hub</h1>
    </div>
  </nav>;
};

export default Header;