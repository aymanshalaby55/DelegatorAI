"use client";

const footerLinks = {
  Product: ["Features", "Pricing", "Integrations", "Changelog"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy Policy", "Terms of Service", "GDPR", "Security"],
  Resources: ["Documentation", "API Reference", "Status", "Community"],
};

const Footer = () => {
  return (
    <footer className="border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="font-display font-bold text-primary-foreground text-sm">
                  MD
                </span>
              </div>
              <span className="font-display font-semibold text-foreground">
                Meeting Delegator
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered meeting intelligence for teams that ship.
            </p>
          </div>
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="font-display font-semibold text-sm mb-4">
                {heading}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 Meeting Delegator. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with AI, for humans who hate meetings.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
