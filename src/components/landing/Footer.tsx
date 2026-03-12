import logoDark from "@/assets/logo-dark.png";

const Footer = () => {
  return (
    <footer className="bg-hero border-t border-border/20 py-6 pb-24 sm:pb-6">
      <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center gap-4 sm:justify-between">
        <img src={logoDark} alt="Oveersea" className="h-6" />
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <a href="/resources" className="text-xs text-muted-foreground hover:text-primary transition-colors">Resources</a>
          <a href="/insights" className="text-xs text-muted-foreground hover:text-primary transition-colors">Insights</a>
          <a href="/case-studies" className="text-xs text-muted-foreground hover:text-primary transition-colors">Case Studies</a>
          <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms</a>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
