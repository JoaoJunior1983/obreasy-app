import type { Metadata } from "next"
import LegalLayout from "@/components/custom/legal-layout"

export const metadata: Metadata = {
  title: "Política de Privacidade — Obreasy",
  description: "Política de Privacidade do aplicativo Obreasy.",
}

const sectionCls = "mt-8"
const h2Cls = "text-xl font-semibold mt-8 mb-3"
const h3Cls = "text-base font-semibold mt-4 mb-2"
const pCls = "text-sm leading-relaxed text-gray-700 mb-3"
const ulCls = "list-disc pl-6 text-sm text-gray-700 space-y-1 mb-3"

export default function PrivacidadePage() {
  return (
    <LegalLayout title="Política de Privacidade" lastUpdated="29/04/2026">
      <p className={pCls}>
        A sua privacidade é importante para nós. Esta Política descreve como o Obreasy coleta,
        utiliza, armazena e compartilha informações dos usuários.
      </p>

      <section className={sectionCls}>
        <h2 className={h2Cls}>1. Dados coletados</h2>
        <p className={pCls}>Podemos coletar os seguintes dados:</p>

        <h3 className={h3Cls}>1.1 Dados de cadastro</h3>
        <ul className={ulCls}>
          <li>Nome</li>
          <li>E-mail</li>
          <li>Telefone</li>
        </ul>

        <h3 className={h3Cls}>1.2 Dados inseridos no aplicativo</h3>
        <ul className={ulCls}>
          <li>Informações de obras</li>
          <li>Despesas e pagamentos</li>
          <li>Dados de profissionais e contratos</li>
          <li>Registros financeiros relacionados à obra</li>
        </ul>

        <h3 className={h3Cls}>1.3 Dados técnicos</h3>
        <ul className={ulCls}>
          <li>Endereço IP</li>
          <li>Tipo de dispositivo</li>
          <li>Sistema operacional</li>
          <li>Informações de navegação no app</li>
        </ul>
      </section>

      <section className={sectionCls}>
        <h2 className={h2Cls}>2. Uso das informações</h2>
        <p className={pCls}>Os dados são utilizados para:</p>
        <ul className={ulCls}>
          <li>Operação e funcionamento do aplicativo</li>
          <li>Personalização da experiência do usuário</li>
          <li>Suporte e atendimento</li>
          <li>Melhoria contínua da plataforma</li>
          <li>Cumprimento de obrigações legais</li>
        </ul>
      </section>

      <section className={sectionCls}>
        <h2 className={h2Cls}>3. Compartilhamento de dados</h2>
        <p className={pCls}>O Obreasy não comercializa dados pessoais de forma indiscriminada.</p>
        <p className={pCls}>Os dados poderão ser compartilhados com:</p>
        <ul className={ulCls}>
          <li>Provedores de tecnologia (ex: Supabase)</li>
          <li>Plataformas de pagamento</li>
          <li>Autoridades legais, quando exigido</li>
        </ul>
      </section>

      <section className={sectionCls}>
        <h2 className={h2Cls}>4. Uso de dados para fins comerciais e parcerias</h2>
        <p className={pCls}>O Obreasy poderá utilizar dados para fins comerciais, respeitando a legislação aplicável.</p>

        <h3 className={h3Cls}>4.1 Dados anonimizados</h3>
        <p className={pCls}>
          Poderemos utilizar dados de forma <strong>anonimizada e agregada</strong>, sem identificação do usuário, para:
        </p>
        <ul className={ulCls}>
          <li>Estudos de mercado</li>
          <li>Análises estatísticas</li>
          <li>Parcerias comerciais</li>
        </ul>

        <h3 className={h3Cls}>4.2 Ofertas e parceiros (com consentimento)</h3>
        <p className={pCls}>
          O usuário poderá, de forma opcional, autorizar o recebimento de ofertas de parceiros do setor de construção.
        </p>
        <p className={pCls}>Somente mediante consentimento prévio, poderemos:</p>
        <ul className={ulCls}>
          <li>Enviar ofertas e promoções</li>
          <li>Compartilhar dados com parceiros comerciais</li>
        </ul>
        <p className={pCls}>O usuário poderá, a qualquer momento:</p>
        <ul className={ulCls}>
          <li>Revogar o consentimento</li>
          <li>Cancelar o recebimento de comunicações</li>
        </ul>
      </section>

      <section className={sectionCls}>
        <h2 className={h2Cls}>5. Armazenamento e segurança</h2>
        <p className={pCls}>
          Adotamos medidas de segurança para proteger os dados dos usuários.
          Ainda assim, nenhum sistema é totalmente imune a riscos.
        </p>
      </section>

      <section className={sectionCls}>
        <h2 className={h2Cls}>6. Direitos do usuário (LGPD)</h2>
        <p className={pCls}>O usuário poderá, a qualquer momento:</p>
        <ul className={ulCls}>
          <li>Solicitar acesso aos seus dados</li>
          <li>Corrigir dados incompletos ou incorretos</li>
          <li>Solicitar exclusão de dados</li>
          <li>Revogar consentimentos</li>
        </ul>
      </section>

      <section className={sectionCls}>
        <h2 className={h2Cls}>7. Retenção de dados</h2>
        <p className={pCls}>
          Os dados serão armazenados enquanto a conta estiver ativa ou conforme necessário
          para cumprimento de obrigações legais.
        </p>
      </section>

      <section className={sectionCls}>
        <h2 className={h2Cls}>8. Cookies e tecnologias</h2>
        <p className={pCls}>Podemos utilizar cookies e tecnologias similares para melhorar a experiência do usuário.</p>
      </section>

      <section className={sectionCls}>
        <h2 className={h2Cls}>9. Alterações</h2>
        <p className={pCls}>
          Esta Política poderá ser atualizada a qualquer momento.
          O uso contínuo do aplicativo indica concordância com as alterações.
        </p>
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
