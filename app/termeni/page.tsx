import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Termeni și condiții · Frizeo Oferte",
  description: "Termenii de utilizare ai platformei Frizeo Oferte.",
};

export default function TermeniPage() {
  return (
    <LegalPage title="Termeni și condiții" eyebrow="DOCUMENTE LEGALE">
      <p>Ultima actualizare: 27 iulie 2026.</p>
      <p>
        Frizeo Oferte este o aplicație web pentru crearea, gestionarea și exportul de oferte comerciale.
        Prin crearea unui cont și utilizarea serviciului, confirmi că ai citit și acceptat acești termeni.
      </p>
      <h2>1. Contul și responsabilitățile tale</h2>
      <p>
        Ești responsabil pentru păstrarea confidențialității datelor de autentificare și pentru toate
        acțiunile efectuate din contul tău. Datele firmelor, clienților și ofertelor pe care le introduci
        trebuie să fie corecte și să îți aparțină în mod legal.
      </p>
      <h2>2. Date pe firmă</h2>
      <p>
        Platforma este pregătită pentru spații multi-firmă: fiecare firmă are catalog, clienți și oferte
        separate. Nu partaja accesul la un spațiu de firmă cu persoane neautorizate.
      </p>
      <h2>3. Disponibilitate</h2>
      <p>
        Serviciul este oferit „ca atare”, în versiune beta. Ne rezervăm dreptul de a actualiza funcționalități,
        de a întrerupe temporar accesul pentru mentenanță sau de a introduce planuri plătite ulterior,
        cu notificare prealabilă rezonabilă.
      </p>
      <h2>4. Proprietate intelectuală</h2>
      <p>
        Interfața, marca Frizeo Oferte și componentele software aparțin operatorului. Conținutul pe care îl
        încarci (oferte, cataloage, logo-uri) rămâne al tău.
      </p>
      <h2>5. Limitarea răspunderii</h2>
      <p>
        Frizeo Oferte nu înlocuiește consultanța fiscală sau juridică. Verifică întotdeauna ofertele generate
        înainte de a le trimite clienților. Nu răspundem pentru pierderi rezultate din utilizarea greșită
        a aplicației sau din indisponibilitate temporară.
      </p>
      <h2>6. Contact</h2>
      <p>
        Pentru întrebări legate de termeni, scrie la{" "}
        <a href="mailto:marisvasi85@gmail.com">marisvasi85@gmail.com</a>.
      </p>
    </LegalPage>
  );
}
