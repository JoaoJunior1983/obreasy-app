"use client";

import Link from "next/link";

const footerLinks = [
  {
    title: "Produto",
    links: [
      { name: "Funcionalidades", href: "#funcionalidades" },
      { name: "Preços", href: "#precos" },
      { name: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { name: "Sobre", href: "#sobre" },
      { name: "Depoimentos", href: "#depoimentos" },
      { name: "Contato", href: "#contato" },
    ],
  },
];

export function FooterSection() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <h3 className="text-2xl font-black text-white mb-3">OBREASY</h3>
            <p className="text-[#ddd]/70 text-sm max-w-md font-light">
              Controle completo da sua obra, sem planilhas confusas. Gerencie
              orçamento, profissionais e materiais em um só lugar.
            </p>
          </div>

          {/* Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-[#ddd]/70 hover:text-white transition-colors text-sm font-light"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex justify-center items-center">
          <p className="text-[#ddd]/60 text-sm font-light">
            © {new Date().getFullYear()} OBREASY. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
