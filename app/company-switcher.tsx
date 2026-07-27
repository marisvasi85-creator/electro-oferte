"use client";

import type { UserCompanySummary } from "../lib/oferte-data";

type CompanySwitcherProps = {
  companies: UserCompanySummary[];
  activeCompanyId: string;
  onSwitch: (companyId: string) => void;
  onAdd: () => void;
  disabled?: boolean;
};

export function CompanySwitcher({
  companies,
  activeCompanyId,
  onSwitch,
  onAdd,
  disabled,
}: CompanySwitcherProps) {
  return (
    <div className="company-switcher">
      <label>
        <span>Firma activă</span>
        <select
          value={activeCompanyId}
          disabled={disabled || companies.length === 0}
          onChange={(event) => onSwitch(event.target.value)}
          aria-label="Selectează firma activă"
        >
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="add-company-button" onClick={onAdd} disabled={disabled}>
        ＋ Adaugă firmă
      </button>
    </div>
  );
}
