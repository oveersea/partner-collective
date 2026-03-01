import logoDark from "@/assets/logo-dark.png";

const Footer = () => {
  return (
    <footer className="bg-hero border-t border-border/20 py-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logoDark} alt="Oveersea" className="h-7" />
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "hsl(0 0% 50%)" }}>
              Platform matchmaking untuk menemukan partner dan tim berkualitas tinggi yang terverifikasi.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm" style={{ color: "hsl(0 0% 85%)" }}>Untuk Client</h4>
            <ul className="space-y-2">
              {["Hiring Request", "Project Request", "Cari Partner", "Cari Tim"].map((item) => (
                <li key={item}><a href="#" className="text-sm hover:text-primary transition-colors" style={{ color: "hsl(0 0% 50%)" }}>{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm" style={{ color: "hsl(0 0% 85%)" }}>Untuk Partner</h4>
            <ul className="space-y-2">
              {["Daftar Partner", "Bentuk Tim", "Vendor Account", "Verifikasi KYC"].map((item) => (
                <li key={item}><a href="#" className="text-sm hover:text-primary transition-colors" style={{ color: "hsl(0 0% 50%)" }}>{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm" style={{ color: "hsl(0 0% 85%)" }}>Perusahaan</h4>
            <ul className="space-y-2">
              {["Tentang Kami", "Blog", "Karir", "Hubungi Kami"].map((item) => (
                <li key={item}><a href="#" className="text-sm hover:text-primary transition-colors" style={{ color: "hsl(0 0% 50%)" }}>{item}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border/20 pt-8 text-center">
          <p className="text-sm" style={{ color: "hsl(0 0% 40%)" }}>
            © 2026 Oveersea. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
