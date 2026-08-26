import { connection } from "next/server";
import Link from "next/link";
import { LegalLayout, type LegalSection } from "@/components/legal-layout";

export const dynamic = "force-dynamic";

const sections: LegalSection[] = [
  {
    title: "Scope of This Policy",
    content: (
      <>
        <p>
          This Privacy Policy explains what personal information Sidewalk Strategy (&ldquo;Sidewalk,&rdquo; &ldquo;we,&rdquo;
          &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects when you use the Sidewalk canvassing platform (the &ldquo;Service&rdquo;), why we
          collect it, who we share it with, and the choices you have about it.
        </p>
        <p>This Policy covers two different groups of people, and it&rsquo;s worth being upfront about the difference:</p>
        <ul>
          <li>
            <strong>Account holders and volunteers</strong> &mdash; people who create a Sidewalk account, or who
            join a canvass as a guest using a share code. This Policy describes what we, Sidewalk, do with
            your information directly.
          </li>
          <li>
            <strong>People being canvassed</strong> &mdash; the residents a campaign logs information about while
            using Sidewalk (names, addresses, notes, support status). We host that data on behalf of the
            campaign using it, but the campaign &mdash; not Sidewalk &mdash; decides what&rsquo;s collected about these
            individuals and why. Section 5 explains this in more detail.
          </li>
        </ul>
        <p>
          This Policy should be read alongside our <Link href="/terms">Terms of Service</Link>, which
          governs your use of the Service more broadly.
        </p>
      </>
    ),
  },
  {
    title: "Information We Collect",
    content: (
      <>
        <p>
          <strong>Account information.</strong> When you sign up, we collect your first and last name, email
          address, password, phone number, birthday, organization or campaign name, and your role (e.g.
          candidate, campaign manager, volunteer coordinator). We ask for your birthday specifically to
          confirm you&rsquo;re 18 or older, as required by our Terms.
        </p>
        <p>
          <strong>Guest access.</strong> If you join a canvass through a share code instead of creating a
          full account, we only collect the display name you choose to use for that session &mdash; no email or
          phone number is required.
        </p>
        <p>
          <strong>Canvassing data you create.</strong> Campaign names, canvass names, streets, and any
          boundary files (GeoJSON, KML, or Shapefile) a campaign manager uploads to show ward or riding
          lines on the map.
        </p>
        <p>
          <strong>Technical information.</strong> Like most web services, our infrastructure providers
          (Section 4) automatically log some technical data needed to operate the Service &mdash; for example,
          timestamps on when data was created or changed. Sidewalk does not run its own analytics or
          advertising tracking, and we don&rsquo;t use tracking cookies (see Section 6).
        </p>
      </>
    ),
  },
  {
    title: "How We Use Information",
    content: (
      <>
        <p>We use the information above to:</p>
        <ul>
          <li>Create and secure your account, and verify you meet the age requirement in our Terms.</li>
          <li>Operate the Service &mdash; showing your campaigns, syncing changes in real time across your team, and generating your CSV exports.</li>
          <li>Convert the addresses you log into map coordinates, using the third-party geocoding service described in Section 4.</li>
          <li>Communicate with you about your account &mdash; for example, email verification, or a reply if you contact us with a question.</li>
          <li>Detect and prevent abuse of the Service, such as automated attempts to guess canvass share codes.</li>
          <li>Meet legal obligations we&rsquo;re subject to.</li>
        </ul>
        <p>We don&rsquo;t sell your personal information, and we don&rsquo;t use it for advertising.</p>
      </>
    ),
  },
  {
    title: "How We Share Information",
    content: (
      <>
        <p>We don&rsquo;t sell or rent your information. We share it in these limited situations:</p>
        <ul>
          <li>
            <strong>With your own campaign team.</strong> Canvassing data you or your volunteers log is
            visible to other members of the same campaign, according to their role &mdash; that&rsquo;s the point of
            the Service.
          </li>
          <li>
            <strong>Google Firebase / Google Cloud.</strong> Our infrastructure provider. Firebase hosts your
            account data and campaign records, and handles authentication (sign-in). Google processes this
            data on our behalf, under its own data processing terms.
          </li>
          <li>
            <strong>OpenStreetMap (Nominatim geocoding service).</strong> When you or a teammate logs a house,
            its address is sent to OpenStreetMap&rsquo;s public Nominatim service to look up map coordinates.
            Only the address text is sent &mdash; not your name, account, or any other information about you.
          </li>
          <li>
            <strong>Legal reasons.</strong> If we&rsquo;re required to by law, subpoena, or other legal process, or
            if we reasonably believe disclosure is necessary to protect the rights, safety, or property of
            Sidewalk, our users, or the public.
          </li>
          <li>
            <strong>A business transfer.</strong> If Sidewalk Strategy is ever involved in a merger,
            acquisition, or sale of assets, your information may be transferred as part of that transaction
            &mdash; we&rsquo;d let you know if this happens.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Data From People You Canvass",
    content: (
      <>
        <p>
          Canvassing inherently involves collecting information about people who aren&rsquo;t Sidewalk users &mdash;
          the residents a campaign contacts at the door. This might include names, addresses, phone numbers
          pulled from a voter list, notes about a conversation, or a recorded support level.
        </p>
        <p>
          For this data, <strong>Sidewalk acts as a processor, not the decision-maker.</strong> The campaign
          using our Service decides what to collect about the people it contacts, and is responsible for
          having a lawful basis to do so, telling those individuals what&rsquo;s expected under applicable law,
          and honoring any request from them (for example, to be removed from a canvassing list). Our Terms
          of Service go into more detail on this responsibility.
        </p>
        <p>
          If you&rsquo;re a resident who was canvassed by a campaign using Sidewalk and want to know what&rsquo;s been
          recorded about you, or want it removed, please contact that campaign directly &mdash; Sidewalk doesn&rsquo;t
          have a relationship with you and generally can&rsquo;t identify which of the many campaigns on our
          platform holds a record matching you.
        </p>
      </>
    ),
  },
  {
    title: "Cookies and Local Storage",
    content: (
      <p>
        Sidewalk doesn&rsquo;t use tracking or advertising cookies. To keep you signed in, we rely on your
        browser&rsquo;s local storage &mdash; a standard mechanism used to remember your session so you don&rsquo;t have to
        log in every time you open the app. This data stays on your device and is used only to operate the
        Service, not to track you across other websites.
      </p>
    ),
  },
  {
    title: "Data Retention",
    content: (
      <>
        <p>We keep your account and campaign data for as long as your account is active, so the Service keeps working the way you expect.</p>
        <p>Deleting a campaign or canvass in the app permanently removes its data from our systems &mdash; that&rsquo;s why we require you to re-enter your password before either action goes through.</p>
        <p>We don&rsquo;t currently have a fully self-service &ldquo;delete my account&rdquo; option in the app. If you&rsquo;d like your account and its data deleted, contact us at the email in Section 13 and we&rsquo;ll process that request.</p>
      </>
    ),
  },
  {
    title: "Data Security",
    content: (
      <>
        <p>We take reasonable technical measures to protect your information, including:</p>
        <ul>
          <li>Access-control rules that restrict every piece of campaign data to members of that specific campaign &mdash; a volunteer with a share code only ever sees the one canvass they joined, never the rest of the campaign.</li>
          <li>Rate limiting on sensitive actions, like guessing a canvass share code, to slow down automated abuse.</li>
          <li>Requiring you to re-enter your password before permanently deleting a campaign or canvass, so a hijacked, still-logged-in session can&rsquo;t do it silently.</li>
          <li>Encryption in transit between your browser and our servers.</li>
        </ul>
        <p>No system is perfectly secure, and we can&rsquo;t guarantee absolute security. If we become aware of a breach affecting your personal information, we&rsquo;ll notify you as required by applicable law.</p>
      </>
    ),
  },
  {
    title: "Your Rights and Choices",
    content: (
      <>
        <p>Depending on where you live, you may have rights to access, correct, or delete the personal information we hold about you, or to receive a copy of it in a portable format. Here&rsquo;s how those work in Sidewalk today:</p>
        <ul>
          <li><strong>Access and correction</strong> &mdash; you can review and update your name, phone number, organization, and role at any time from your account.</li>
          <li><strong>Export</strong> &mdash; the Service has a built-in CSV export for your campaign and canvassing data, which you can use at any time.</li>
          <li><strong>Deletion</strong> &mdash; you can delete individual campaigns and canvasses yourself; for full account deletion, contact us (Section 7).</li>
          <li><strong>Withdrawing consent</strong> &mdash; you can stop using the Service and request deletion of your account at any time.</li>
        </ul>
        <p>To exercise any of these rights, contact us using the details in Section 13. We&rsquo;ll respond within a reasonable time and may need to verify your identity first.</p>
      </>
    ),
  },
  {
    title: "Children's Privacy",
    content: (
      <p>
        Sidewalk requires account holders to be 18 or older, and we don&rsquo;t knowingly collect personal
        information from children through account sign-up. If we learn that someone under 18 has created an
        account, we&rsquo;ll take steps to delete it.
      </p>
    ),
  },
  {
    title: "International Data Transfers",
    content: (
      <p>
        Sidewalk is operated from Canada, and our infrastructure provider (Google Cloud) operates data
        centers in multiple countries. Depending on how our infrastructure is configured, your information
        may be processed or stored outside of the country you&rsquo;re located in, including in the United
        States. By using the Service, you understand that your information may be transferred to and
        processed in countries with data protection laws that may differ from those of your own.
      </p>
    ),
  },
  {
    title: "Changes to This Policy",
    content: (
      <p>
        We may update this Privacy Policy as the Service changes or as legal requirements evolve. If we make
        a material change, we&rsquo;ll update the effective date at the top of this page and, where practical,
        let you know directly. Continuing to use the Service after a change takes effect means you accept
        the updated Policy.
      </p>
    ),
  },
  {
    title: "Contact Us",
    content: (
      <p>
        Questions about this Privacy Policy, or requests about your personal information, can be sent to{" "}
        <a href="mailto:juliangents45@gmail.com">juliangents45@gmail.com</a>.
      </p>
    ),
  },
];

export default async function Page() {
  await connection();
  return (
    <LegalLayout
      title="Privacy Policy"
      tagline="What Sidewalk collects, why, and the choices you have about it — whether you're running a campaign or being canvassed by one."
      effectiveDate="August 26, 2026"
      sections={sections}
    />
  );
}
