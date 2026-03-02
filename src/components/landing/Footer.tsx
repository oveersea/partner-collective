import logoDark from "@/assets/logo-dark.png";

const Footer = () => {
  return (
    <footer className="bg-hero border-t border-border/20 py-6">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <img src={logoDark} alt="Oveersea" className="h-6" />
        <div className="flex items-center gap-6">
          <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">About Us</a>
          <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms & Conditions</a>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
