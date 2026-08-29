import { connection } from "next/server";
import { LegalLayout, Callout, type LegalSection } from "@/components/legal-layout";

// Same reasoning as every other route in this app: the nonce-based CSP
// (see proxy.ts) only reaches a page's scripts if it's rendered
// per-request, so this needs to opt into dynamic rendering too.
export const dynamic = "force-dynamic";

const sections: LegalSection[] = [
  {
    title: "Agreement to These Terms",
    content: (
      <>
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) are an agreement between you and Sidewalk Strategy
          (&ldquo;Sidewalk,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) governing your access to and use of the Sidewalk
          canvassing platform, including our website, applications, and related services (collectively, the
          &ldquo;Service&rdquo;).
        </p>
        <p>
          By creating an account, joining a canvass with a share code, or otherwise using the Service, you
          agree to be bound by these Terms. If you&rsquo;re using Sidewalk on behalf of a campaign, organization,
          or other entity, you&rsquo;re confirming that you have the authority to bind that entity to these Terms,
          and &ldquo;you&rdquo; refers to both you individually and that entity.
        </p>
        <p>If you don&rsquo;t agree to these Terms, don&rsquo;t use the Service.</p>
      </>
    ),
  },
  {
    title: "Who Can Use Sidewalk",
    content: (
      <>
        <p>
          You must be at least <strong>18 years old</strong> to create a Sidewalk account. We ask for your
          date of birth at sign-up and rely on what you tell us &mdash; we don&rsquo;t independently verify age, the
          same way most services don&rsquo;t. Misrepresenting your age to get around this restriction is a breach
          of these Terms.
        </p>
        <p>
          Volunteers joining a canvass through a share code (without creating a full account) don&rsquo;t go
          through this age check directly. A campaign that shares its canvass code with volunteers is
          responsible for making sure whoever it hands that code to is old enough to use the Service under
          this Section.
        </p>
        <p>
          You also need to be legally able to enter into a binding contract in your jurisdiction, and your
          use of the Service must comply with the laws that apply to you &mdash; including election, privacy, and
          data protection laws relevant to the canvassing activity you&rsquo;re doing.
        </p>
      </>
    ),
  },
  {
    title: "Your Account",
    content: (
      <>
        <p>
          To use most of Sidewalk&rsquo;s features, you&rsquo;ll create an account with your email, a password, and
          some basic information about you and your campaign (name, phone number, organization, and role).
          You&rsquo;re responsible for keeping this information accurate and for everything that happens under
          your account, including actions taken by anyone you&rsquo;ve invited as a team member.
        </p>
        <p>
          You&rsquo;re responsible for keeping your password secure. Tell us right away if you think your account
          has been accessed without your permission &mdash; we can&rsquo;t undo actions taken by someone using your
          credentials before you let us know.
        </p>
        <p>
          Campaigns in Sidewalk have two roles: <strong>managers</strong>, who can invite team members, delete
          campaigns and canvasses, and configure sharing; and <strong>volunteers</strong>, who can log doors but
          can&rsquo;t delete canvassing data or manage the team. Managing who holds which role within your own
          campaign is your responsibility, not ours.
        </p>
      </>
    ),
  },
  {
    title: "Guest and Volunteer Access",
    content: (
      <>
        <p>
          Sidewalk lets a campaign manager generate a share code that gives someone temporary, limited
          access to a single canvass without creating a full account (&ldquo;Guest Access&rdquo;). Anyone with a valid,
          active code can join that canvass and log doors under a display name they choose.
        </p>
        <p>
          If you&rsquo;re a campaign manager, you&rsquo;re responsible for who you give a share code to and for turning
          sharing off (or generating a new code) if you no longer want a given code to work. Sidewalk isn&rsquo;t
          able to verify the identity of anyone who joins through Guest Access, and doesn&rsquo;t screen who a code
          is shared with.
        </p>
        <p>
          If you&rsquo;re using Guest Access, these Terms still apply to you for as long as you&rsquo;re using the
          Service, even though you didn&rsquo;t create a full account.
        </p>
      </>
    ),
  },
  {
    title: "What Sidewalk Is (and Isn't)",
    content: (
      <>
        <p>
          Sidewalk is a tool for organizing door-to-door canvassing: tracking streets and houses, logging
          outcomes, managing volunteers, and exporting the results. We provide the software and the
          infrastructure it runs on. We don&rsquo;t run your campaign, and we don&rsquo;t provide legal, political, or
          compliance advice about how you canvass, what you say at the door, or how you use the information
          you collect.
        </p>
        <p>
          Sidewalk is provided as a general-purpose organizing tool for campaigns anywhere it&rsquo;s used. We
          don&rsquo;t tailor the Service to the specific election law, privacy law, or campaign finance rules of
          any particular country, province, state, or municipality. Section 7 covers what that means for
          you.
        </p>
        <p>Parts of Sidewalk&rsquo;s software are built with the help of an AI coding agent, used under our team&rsquo;s direction and review.</p>
      </>
    ),
  },
  {
    title: "Your Content",
    content: (
      <>
        <p>
          &ldquo;Your Content&rdquo; means everything you or your team put into Sidewalk: campaign and canvass names,
          street and house data, voter contact status, notes, lawn sign records, imported voter lists, and
          any map boundary files (GeoJSON, KML, or Shapefile) you upload.
        </p>
        <p>
          <strong>You own Your Content.</strong> We don&rsquo;t claim any ownership over it. You&rsquo;re granting us only
          the limited right to store, process, and display it back to you (and to whoever you&rsquo;ve given
          access to) as needed to run the Service &mdash; for example, geocoding an address so it shows up
          correctly on your map, or generating a CSV when you export.
        </p>
        <p>
          You&rsquo;re responsible for Your Content &mdash; for its accuracy, for having the right to collect and store
          it, and for backing it up if that matters to you. We make reasonable efforts to keep the Service
          reliable, but we don&rsquo;t guarantee Your Content will never be lost, corrupted, or temporarily
          unavailable, and we recommend exporting your data periodically using the built-in CSV export.
        </p>
        <p>
          If you delete a campaign or canvass, its data is removed and generally can&rsquo;t be recovered &mdash;
          that&rsquo;s why deleting either requires you to re-enter your password first.
        </p>
      </>
    ),
  },
  {
    title: "Your Responsibilities as a Campaign",
    content: (
      <>
        <p>
          Canvassing means collecting information about real people &mdash; names, addresses, opinions, and
          sometimes more. That makes this section important. By using Sidewalk to canvass, you agree that:
        </p>
        <ul>
          <li>
            You&rsquo;re responsible for complying with whatever election, campaign finance, and voter-contact
            laws apply to your campaign in the jurisdiction where you&rsquo;re canvassing.
          </li>
          <li>
            You&rsquo;re responsible for complying with applicable privacy and data protection law regarding the
            people you contact &mdash; including how you collect, use, store, and eventually dispose of
            information about them.
          </li>
          <li>
            You&rsquo;ll only use Sidewalk for legitimate campaign or civic organizing purposes, and not to
            harass, stalk, or intimidate anyone you contact.
          </li>
          <li>
            Any voter or contact information you import into Sidewalk (for example, through a CSV upload)
            was obtained lawfully, and you have the right to use it the way you&rsquo;re using it.
          </li>
        </ul>
        <Callout label="Not legal advice">
          This section describes what&rsquo;s on you, not what to do about it. Election and privacy law varies
          enormously by jurisdiction and changes often &mdash; talk to a lawyer familiar with your specific
          campaign and location before you start canvassing, not after.
        </Callout>
      </>
    ),
  },
  {
    title: "Acceptable Use",
    content: (
      <>
        <p>Beyond the campaign-specific responsibilities in Section 7, you agree not to:</p>
        <ul>
          <li>
            Attempt to gain unauthorized access to any account, campaign, or canvass you weren&rsquo;t given
            access to &mdash; including by guessing or brute-forcing share codes or invite links.
          </li>
          <li>
            Interfere with or disrupt the Service, including by attempting to overload it, probing it for
            vulnerabilities without our permission, or circumventing any rate limits or access controls.
          </li>
          <li>
            Upload content that&rsquo;s unlawful, defamatory, or that infringes someone else&rsquo;s intellectual
            property or privacy rights.
          </li>
          <li>Use the Service to send unsolicited bulk communications unrelated to legitimate canvassing.</li>
          <li>Reverse-engineer, resell, or white-label the Service without our written permission.</li>
        </ul>
        <p>We may investigate and take action &mdash; including suspending or terminating access &mdash; against anyone who violates this section.</p>
      </>
    ),
  },
  {
    title: "Fees",
    content: (
      <p>
        Sidewalk is currently free to use. We may introduce paid plans or usage limits in the future. If we
        do, we&rsquo;ll give existing users reasonable advance notice before any change that affects them, and
        continuing to use the Service after a fee takes effect means you accept it.
      </p>
    ),
  },
  {
    title: "Intellectual Property",
    content: (
      <>
        <p>
          The Service itself &mdash; its design, code, branding, and the Sidewalk name and logo &mdash; belongs to
          Sidewalk Strategy. Nothing in these Terms gives you any right to use our branding except to the
          extent it&rsquo;s required to identify that you use the Service (for example, mentioning &ldquo;Sidewalk&rdquo;
          when describing your campaign&rsquo;s tools).
        </p>
        <p>
          We grant you a limited, non-exclusive, non-transferable license to access and use the Service for
          your own campaign organizing, subject to these Terms.
        </p>
      </>
    ),
  },
  {
    title: "Third-Party Services",
    content: (
      <>
        <p>Sidewalk is built on top of infrastructure and data we don&rsquo;t operate ourselves:</p>
        <ul>
          <li>
            <strong>Google Firebase / Google Cloud</strong> &mdash; hosts your account data, campaign and canvass
            records, and authentication.
          </li>
          <li>
            <strong>OpenStreetMap (via the Nominatim geocoding service)</strong> &mdash; used to turn the addresses
            you log into map coordinates, and to render the map itself.
          </li>
        </ul>
        <p>
          Your use of the Service is also subject to those providers&rsquo; own terms and availability. If one of
          them has an outage or changes how their service works, it can affect Sidewalk, and we&rsquo;re not
          responsible for their acts or omissions.
        </p>
      </>
    ),
  },
  {
    title: "Suspension and Termination",
    content: (
      <>
        <p>You can stop using Sidewalk and delete your account and campaigns at any time.</p>
        <p>
          We may suspend or terminate your access to the Service if you violate these Terms, if we
          reasonably believe your use of the Service poses a legal or security risk to us or to others, or
          if we&rsquo;re required to by law. Where practical, we&rsquo;ll try to give you notice first.
        </p>
        <p>
          Sections that by their nature should survive termination &mdash; including Your Content ownership
          (Section 6), Your Responsibilities (Section 7), Disclaimers (Section 13), Limitation of Liability
          (Section 14), Indemnification (Section 15), and Governing Law (Section 16) &mdash; continue to apply
          after your access ends.
        </p>
      </>
    ),
  },
  {
    title: "Disclaimers",
    content: (
      <>
        <p>
          The Service is provided <strong>&ldquo;as is&rdquo; and &ldquo;as available,&rdquo;</strong> without warranties of any kind,
          whether express, implied, or statutory, including implied warranties of merchantability, fitness
          for a particular purpose, and non-infringement.
        </p>
        <p>
          We don&rsquo;t guarantee that the Service will be uninterrupted, error-free, or completely secure, that
          geocoding will always resolve every address correctly, or that any particular outcome will result
          from using Sidewalk to organize your canvass.
        </p>
      </>
    ),
  },
  {
    title: "Limitation of Liability",
    content: (
      <>
        <p>
          To the maximum extent permitted by law, Sidewalk Strategy and its people won&rsquo;t be liable for any
          indirect, incidental, special, consequential, or punitive damages, or for any loss of data,
          revenue, or goodwill, arising out of or related to your use of the Service &mdash; even if we&rsquo;ve been
          advised of the possibility of those damages.
        </p>
        <p>
          To the maximum extent permitted by law, our total liability to you for any claim arising from
          these Terms or the Service is limited to the greater of (a) the amount you paid us in the 12
          months before the claim arose, or (b) CAD $100.
        </p>
        <p>Some jurisdictions don&rsquo;t allow the exclusion or limitation of certain damages, so some of these limits may not apply to you.</p>
      </>
    ),
  },
  {
    title: "Indemnification",
    content: (
      <p>
        You agree to defend, indemnify, and hold harmless Sidewalk Strategy from any claims, damages,
        losses, and expenses (including reasonable legal fees) arising from: your use of the Service; Your
        Content; your violation of these Terms; or your violation of any law or third party&rsquo;s rights,
        including in how you collect, use, or store information about people you contact through
        canvassing.
      </p>
    ),
  },
  {
    title: "Governing Law and Disputes",
    content: (
      <>
        <p>
          These Terms are governed by the laws of the Province of Ontario and the federal laws of Canada
          applicable in Ontario, without regard to conflict-of-law principles. You agree that the courts
          located in Ontario have exclusive jurisdiction over any dispute arising from these Terms or the
          Service, and you consent to that jurisdiction.
        </p>
        <p>Before filing a claim against us, we ask that you first contact us at the email in Section 18 so we can try to resolve the issue informally.</p>
      </>
    ),
  },
  {
    title: "Changes to These Terms",
    content: (
      <>
        <p>
          We may update these Terms from time to time &mdash; to reflect new features, legal requirements, or
          how the Service actually works. If we make a material change, we&rsquo;ll update the effective date at
          the top of this page and, where practical, let you know directly (for example, by email or an
          in-app notice).
        </p>
        <p>Continuing to use the Service after a change takes effect means you accept the updated Terms. If you don&rsquo;t agree with a change, you should stop using the Service.</p>
      </>
    ),
  },
  {
    title: "Contact",
    content: (
      <p>
        Questions about these Terms, or about the Service generally, can be sent to{" "}
        <a href="mailto:juliangents45@gmail.com">juliangents45@gmail.com</a>.
      </p>
    ),
  },
];

export default async function Page() {
  await connection();
  return (
    <LegalLayout
      title="Terms of Service"
      tagline="The rules for using Sidewalk to run a canvass, whether you're managing a campaign or knocking on doors for one."
      effectiveDate="August 26, 2026"
      sections={sections}
    />
  );
}
