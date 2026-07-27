import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Politica de confidențialitate · Frizeo Oferte",
  description: "Cum prelucrăm datele personale în Frizeo Oferte, conform GDPR.",
};

export default function ConfidentialitatePage() {
  return (
    <LegalPage title="Politica de confidențialitate" eyebrow="GDPR · UE">
      <p>Ultima actualizare: 27 iulie 2026.</p>
      <p>
        Această politică explică ce date personale prelucrăm în Frizeo Oferte, în ce scop și ce drepturi ai
        conform Regulamentului (UE) 2016/679 (GDPR).
      </p>
      <h2>1. Operator</h2>
      <p>
        Operatorul datelor pentru platformă este Frizeo Oferte. Contact:{" "}
        <a href="mailto:marisvasi85@gmail.com">marisvasi85@gmail.com</a>.
      </p>
      <h2>2. Ce date colectăm</h2>
      <ul>
        <li>Date de cont: adresă de e-mail și autentificare (prin Supabase Auth).</li>
        <li>Date de firmă pe care le introduci: denumire, CUI, adresă, telefon, IBAN, logo.</li>
        <li>Date de clienți și oferte pe care le salvezi în aplicație.</li>
        <li>Date tehnice minime necesare funcționării (sesiune, jurnale de eroare).</li>
      </ul>
      <h2>3. Scopuri și temei</h2>
      <p>
        Prelucrăm datele pentru a-ți oferi serviciul (executarea contractului), pentru securitate și
        prevenirea abuzurilor (interes legitim) și, unde e cazul, pentru obligații legale.
      </p>
      <h2>4. Păstrare și locație</h2>
      <p>
        Datele sunt stocate în Supabase (bază de date și autentificare). Păstrăm datele cât timp ai un
        cont activ sau cât e necesar pentru scopurile de mai sus. Poți solicita ștergerea contului.
      </p>
      <h2>5. Partajare</h2>
      <p>
        Nu vindem date personale. Putem folosi procesatori tehnici (ex. hosting, autentificare) care
        acționează pe baza unor acorduri de prelucrare, doar pentru operarea serviciului.
      </p>
      <h2>6. Drepturile tale</h2>
      <p>
        Ai dreptul de acces, rectificare, ștergere, restricționare, portabilitate și opoziție. Poți depune
        o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP).
      </p>
      <h2>7. Cookie-uri</h2>
      <p>
        Folosim stocare locală / sesiune necesare autentificării și ciornelor de ofertă. Nu folosim
        cookie-uri de publicitate terță.
      </p>
      <h2>8. Contact DPO / confidențialitate</h2>
      <p>
        Pentru exercitarea drepturilor GDPR, scrie la{" "}
        <a href="mailto:marisvasi85@gmail.com">marisvasi85@gmail.com</a>.
      </p>
    </LegalPage>
  );
}
