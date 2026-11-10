import "server-only";
import { CURRENCIES } from "./constants";

// ISO 3166 country codes. Names come from the runtime, so nothing here needs translating.
const COUNTRY_CODES = (
  "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY " +
  "BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ " +
  "FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR " +
  "IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH " +
  "MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK " +
  "PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC " +
  "TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW"
).split(" ");

// The usual currency for countries a long trip through Asia might add. Others default to euro.
const COUNTRY_CURRENCY: Record<string, string> = {
  TH: "THB", VN: "VND", JP: "JPY", CN: "CNY", UZ: "UZS", TJ: "TJS", KG: "KGS", KZ: "KZT", RO: "RON",
  MY: "MYR", ID: "IDR", PH: "PHP", KH: "USD", LA: "LAK", MM: "MMK", SG: "SGD", KR: "KRW", TW: "TWD",
  HK: "HKD", MO: "MOP", IN: "INR", NP: "NPR", LK: "LKR", BD: "BDT", BT: "BTN", MV: "MVR", PK: "PKR",
  MN: "MNT", TM: "TMT", AF: "AFN", TR: "TRY", GE: "GEL", AM: "AMD", AZ: "AZN", AE: "AED", OM: "OMR",
  QA: "QAR", SA: "SAR", JO: "JOD", IL: "ILS", EG: "EGP", US: "USD", GB: "GBP", CH: "CHF", AU: "AUD",
  NZ: "NZD", CA: "CAD", MD: "MDL", BG: "BGN", HU: "HUF", PL: "PLN", CZ: "CZK", RS: "RSD", UA: "UAH",
};

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const currencyNames = new Intl.DisplayNames(["en"], { type: "currency" });
const supportedCurrencies = new Set(Intl.supportedValuesOf("currency"));

export function flagOf(code: string) {
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export type CountryOption = { code: string; name: string; flag: string; currency: string };

export const COUNTRY_OPTIONS: CountryOption[] = COUNTRY_CODES.map((code) => ({
  code,
  name: regionNames.of(code) ?? code,
  flag: flagOf(code),
  currency: COUNTRY_CURRENCY[code] ?? "EUR",
})).sort((a, b) => a.name.localeCompare(b.name, "en"));

export function countryByCode(code: string) {
  return COUNTRY_OPTIONS.find((c) => c.code === code);
}

export function isCurrencyCode(code: string) {
  return /^[A-Z]{3}$/.test(code) && supportedCurrencies.has(code);
}

export function currencyName(code: string) {
  return CURRENCIES.find((c) => c.code === code)?.name ?? currencyNames.of(code) ?? code;
}

export type CurrencyOption = { code: string; name: string };

/** The trip currencies first, then every other currency. */
export const CURRENCY_OPTIONS: { main: CurrencyOption[]; other: CurrencyOption[] } = {
  main: CURRENCIES.map((c) => ({ code: c.code, name: c.name })),
  other: [...supportedCurrencies]
    .filter((code) => !CURRENCIES.some((c) => c.code === code))
    .map((code) => ({ code, name: currencyNames.of(code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name, "en")),
};
