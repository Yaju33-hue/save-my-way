import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const DraftNotice = () => (
  <p className="legal-draft-note" role="note">
    Draft for product review. This is not legal advice and has not been reviewed
    by a lawyer. Confirm the operator, contact details, jurisdiction, and final
    data practices before relying on or publishing this document.
  </p>
);

export function PrivacyPolicy() {
  useEffect(() => {
    document.title = "SaveMyWay — Privacy";
  }, []);

  return (
    <article className="legal-page">
      <header className="legal-page-header">
        <Link to="/signin" className="back-btn">Back to SaveMyWay</Link>
        <h1>Privacy Policy</h1>
        <p>How the current SaveMyWay app handles information.</p>
      </header>
      <DraftNotice />

      <section>
        <h2>Information stored on your device</h2>
        <p>
          The current version stores account details, a credential value, session
          records, finance entries, and app settings in this browser&apos;s local
          storage. Finance entries can include wallet activity, savings amounts,
            investment holdings, and related prices. This data is not synced to a
          SaveMyWay server by the app code reviewed for this draft.
        </p>
        <p>
          Sign-out ends the active session but does not erase saved account or
          finance data. Clearing this site&apos;s browser storage removes locally
          saved data and may make it unrecoverable. The app does not currently
          provide account recovery or cross-device synchronization.
        </p>
      </section>

      <section>
        <h2>Credentials and security</h2>
        <p>
          The current client attempts to derive a SHA-256 digest for passwords
          and stores it in local storage. If the browser does not support Web
          Crypto, the current fallback stores the password value directly. This
          is client-side demonstration authentication, not a secure account
          system. Anyone with access to this browser profile or its developer
          tools may be able to access stored records. Do not use this version
          for passwords or financial records that require confidentiality.
        </p>
      </section>

      <section>
        <h2>Files and external services</h2>
        <p>
          Portfolio files selected for import are parsed in your browser by the
          app. The reviewed import flow does not upload those files to a
          SaveMyWay server. If you request stock searches or quotes, the app may
          send typed US company queries to Finnhub and ticker symbols to Yahoo
          Finance. NGX aliases are matched locally; the app requests NGX stock
          lists and prices from the market-data service operated at
          KoboTerminal. Exchange-rate requests go to open.er-api.com. Those
          providers process requests under their own policies. The app also
          uses a PDF.js worker from cdnjs as a fallback in some builds.
        </p>
        <p>
          The reviewed source contains no analytics or advertising tracker.
          Provider configuration and behavior may change in later releases.
        </p>
      </section>

      <section>
        <h2>Questions and changes</h2>
        <p>
          The app operator&apos;s legal name, contact address, and jurisdiction
          have not been provided. Add a verified contact method and have this
          draft reviewed before using it as a formal privacy notice.
        </p>
      </section>

      <footer className="legal-page-footer">
        <Link to="/terms">Read the Terms of Service</Link>
      </footer>
    </article>
  );
}

export function TermsOfService() {
  useEffect(() => {
    document.title = "SaveMyWay — Terms";
  }, []);

  return (
    <article className="legal-page">
      <header className="legal-page-header">
        <Link to="/signin" className="back-btn">Back to SaveMyWay</Link>
        <h1>Terms of Service</h1>
        <p>Draft terms for using the current SaveMyWay app.</p>
      </header>
      <DraftNotice />

      <section>
        <h2>What the app does</h2>
        <p>
          SaveMyWay provides tools to record wallet activity, savings, and
          investment holdings, and to display estimates based on the information
          entered and available market or exchange-rate data. The app is not a
          bank, broker, investment adviser, or financial institution.
        </p>
      </section>

      <section>
        <h2>Financial information</h2>
        <p>
          Values, prices, exchange rates, interest calculations, and imported
          data may be delayed, incomplete, or inaccurate. They are provided for
          personal tracking only, not as financial, tax, or investment advice.
          Verify information with your financial institution or data provider
          before relying on it or making a decision.
        </p>
      </section>

      <section>
        <h2>Your records and account</h2>
        <p>
          In the current version, account and finance records are stored in the
          browser where they were created. They are not backed up or synced by a
          SaveMyWay server. You are responsible for access to your device and
          for keeping any information you need. Sign-out does not delete local
          records; clearing browser storage may permanently remove them.
        </p>
      </section>

      <section>
        <h2>Availability and third-party services</h2>
        <p>
          Stock quotes, symbol search, exchange rates, and PDF processing may
          depend on third-party services, network access, and browser support.
          These features may be unavailable or change without notice. Use of
          third-party services may also be subject to their own terms and
          privacy notices.
        </p>
      </section>

      <section>
        <h2>Operator details</h2>
        <p>
          The operator&apos;s legal name, contact details, governing law, and
          dispute process have not been provided. These terms are incomplete
          until those details are determined and reviewed by qualified counsel.
        </p>
      </section>

      <footer className="legal-page-footer">
        <Link to="/privacy">Read the Privacy Policy</Link>
      </footer>
    </article>
  );
}