import { Logo } from "@/components/ui/logo";

const Header = () => {
  return <nav className="flex justify-between items-center p-4 px-8 sm:px-20 bg-primary">
    <div className="flex items-center gap-2">
      <Logo size="lg" color="white" className=""/>
      <h1 className="text-white font-rubik text-2xl font-semibold ml-14 hidden sm:block">Defi Hub</h1>
    </div>
  </nav>;
};

export default Header;