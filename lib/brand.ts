/** Names and links that tie this app to the NomadWealth family. */
export const APP_NAME = "Nomad Expenses";
export const FAMILY_NAME = "NomadWealth";
export const FULL_NAME = `${APP_NAME} by ${FAMILY_NAME}`;

/** The page on the NomadWealth site that describes this app. */
export const FAMILY_URL = "https://www.nomadwealth.app/expenses";

/** The NomadWealth net-worth cockpit, offered to travellers who also track investments or property. */
export const NOMADWEALTH_URL = "https://nomadwealth.app";

/** One click deploy of this app to the visitor's own Vercel, with a Neon database added. */
export const DEPLOY_URL =
  "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcostibotez%2Fnomad-expense-tracker" +
  "&project-name=nomad-expenses&repository-name=nomad-expenses&env=APP_PASSWORD" +
  "&envDescription=The%20password%20you%20type%20to%20open%20the%20app.%20Choose%20a%20long%20one." +
  "&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%7D%5D";
