import type { Metadata } from "next"
import LegalLayout from "@/components/custom/legal-layout"

export const metadata: Metadata = {
  title: "Termos de Uso — Obreasy",
  description: "Termos de Uso do aplicativo Obreasy.",
}

const sectionCls = "mt-8"
const h2Cls = "text-xl font-semibold mt-8 mb-3"
const pCls = "text-sm leading-relaxed text-gray-700 mb-3"
const ulCls = "list-disc pl-6 text-sm text-gray-700 space-y-1 mb-3"

export default function TermosPage() {
  return (
    <LegalLayout title="Termos de Uso" lastUpdated="29/04/2026">
      <section className={sectionCls}>
        <h2 className={h2Cls}>1. Sobre o serviço</h2>
        <p className={pCls}>
          O Obreasy é um aplicativo de gestão de obras que permite controle financeiro,
          cadastro de profissionais, contratos e acompanhamento de despesas.
        </p>
      </section>

      <section className={sectionCls}>
        <h2 className={h2Cls}>2. Cadastro e responsabilidade</h2>
        <p className={pCls}>O usuário se compromete a:</p>
        <ul className={ulCls}>
          <li>Fornecer informações verdadeiras</li>
          <li>Manter seus dados atualizados</li>
          <li>Proteger seu login e senha</li>
        </ul>
        <p className={pCls}>O usuário é responsável por todas as atividades realizadas em sua conta.</p>
      </section>

      <section className={sectionCls}>
        <h2 className={h2Cls}>3. Planos e pagamentos</h2>
        <p className={pCls}>O aplicativo poderá oferecer planos gratuitos e pagos.</p>
        <ul className={ulCls}>
          <li>Pode haver período de teste gratuito</li>
          <li>Após o teste, funcionalidades poderão ser limitadas</li>
          <li>Assinaturas podem ser renovadas automaticamente</li>
        </ul>
        <p className={pCls}>Pagamentos realizados via App Store seguem as regras da Apple.</p>
      </section>

      <section className={sectionCls}>
        <h2 className={h2Cls}>4. Uso permitido</h2>
        <p className={pCls}>É proibido:</p>
        <ul className={ulCls}>
          <li>Inserir dados falsos</li>
          <li>Utilizar o app para fins ilícitos</li>
          <li>Tentar acessar dados de terceiros</li>
        </ul>
      </section>

      <section className={sectionCls}>
        <h2 className={h2Cls}>5. Comunicações e ofertas</h2>
        <p className={pCls}>O usuário poderá receber comunicações relacionadas ao uso do aplicativo.</p>
        <p className={pCls}>
          Comunicações comerciais e ofertas de parceiros só serão enviadas mediante consentimento do usuário.
        </p>
      </section>

      <section className={sectionCls}>
        <h2 className={h2Cls}>6. Responsabilidade</h2>
        <p className={pCls}>O Obreasy não se responsabiliza por:</p>
        <ul className={ulCls}>
          <li>Decisões financeiras tomadas pelo usuário</li>
          <li>Informações inseridas incorretamente</li>
          <li>Perdas decorrentes do uso indevido do aplicativo</li>
        </ul>
      </section>

      <section className={sectionCls}>
        <h2 className={h2Cls}>7. Disponibilidade</h2>
        <p className={pCls}>O aplicativo pode sofrer interrupções temporárias para manutenção ou melhorias.</p>
      </section>

      <section className={sectionCls}>
        <h2 className={h2Cls}>8. Cancelamento e exclusão</h2>
        <p className={pCls}>O usuário poderá:</p>
        <ul className={ulCls}>
          <li>Cancelar sua assinatura a qualquer momento</li>
          <li>Solicitar a exclusão da conta diretamente pelo aplicativo, em "Minha Conta"</li>
        </ul>
      </section>

      <section className={sectionCls}>
        <h2 className={h2Cls}>9. Alterações</h2>
        <p className={pCls}>Os Termos podem ser atualizados a qualquer momento.</p>
      </section>

      <section className={sectionCls}>
        <h2 className={h2Cls}>10. Contato</h2>
        <p className={pCls}>
          E-mail: <a href="mailto:suporte@obreasy.com.br" className="text-[#0B3064] underline">suporte@obreasy.com.br</a>
        </p>
      </section>
    </LegalLayout>
  )
}
