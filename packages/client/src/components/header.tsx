import { Logo } from "@/components/ui/logo";

const Header = () => {
  return <nav className="flex justify-between items-center p-4">
    <div className="flex items-center gap-2">
      <Logo size="lg" />
    </div>
  </nav>;
};

export default Header;