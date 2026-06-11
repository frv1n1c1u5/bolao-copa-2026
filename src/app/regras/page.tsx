export default function RegrasPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-black mb-6">📋 Regras do Bolão da Copa</h1>
      <div className="rounded-xl bg-white p-6 shadow space-y-5 text-sm leading-relaxed">
        <section>
          <h2 className="font-black text-base mb-1">1. Palpites</h2>
          <p>
            Os palpites devem ser enviados <b>antes do início de cada partida</b>. Após o
            apito inicial, não serão aceitos nem alterados.
          </p>
        </section>

        <section>
          <h2 className="font-black text-base mb-1">2. Pontuação</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <b>3 pontos</b>: acertar o placar exato. 🎯
            </li>
            <li>
              <b>1 ponto</b>: acertar apenas o vencedor ou o empate. ✓
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-black text-base mb-1">3. Jogos do mata-mata</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              O palpite considera o resultado ao fim dos <b>90 minutos + acréscimos</b>.
              Prorrogação e pênaltis não contam para a pontuação dos jogos.
            </li>
            <li>
              Antes do início das oitavas, cada participante deverá indicar o{" "}
              <b>campeão da Copa</b> na página <b>Extras</b>. Quem acertar recebe{" "}
              <b>5 pontos extras</b>. 🏆
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-black text-base mb-1">4. Desempate</h2>
          <p>Em caso de empate na pontuação final, os critérios serão, nesta ordem:</p>
          <ol className="list-decimal pl-5 space-y-1 mt-1">
            <li>Maior número de placares exatos;</li>
            <li>Maior número de resultados corretos;</li>
            <li>Acerto do campeão;</li>
            <li>
              Persistindo o empate, divisão do prêmio ou sorteio, conforme decisão do
              grupo.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-black text-base mb-1">5. Zoeira</h2>
          <p>
            A classificação será atualizada periodicamente e a tradicional zoeira é
            liberada, desde que com respeito aos demais participantes. 😜
          </p>
        </section>

        <section>
          <h2 className="font-black text-base mb-1">6. Vencedor</h2>
          <p>
            O vencedor do bolão será aquele que obtiver a maior pontuação ao término da
            Copa do Mundo. Boa sorte e que os palpites estejam inspirados! ⚽🏆🍀
          </p>
        </section>

        <section className="border-t border-foreground/10 pt-4">
          <h2 className="font-black text-base mb-1">⭐ Bolões extras</h2>
          <p>
            Além do campeão, há palpites extras (artilheiro, craque da Copa, zebra) na
            página <b>Extras</b>, com pontos bônus definidos pelo grupo e lançados pelo
            administrador ao fim da Copa.
          </p>
        </section>
      </div>
    </div>
  );
}
