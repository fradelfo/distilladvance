import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Distill',
  description: 'Privacy policy for Distill browser extension and web application',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="bg-background rounded-lg shadow-sm p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

          <p className="text-sm text-gray-500 mb-8">Last updated: November 28, 2024</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-600 mb-4">
                Distill (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to
                protecting your privacy. This Privacy Policy explains how we collect, use, and
                safeguard your information when you use our browser extension and web application.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Information We Collect</h2>

              <h3 className="text-lg font-medium text-gray-800 mb-2">Account Information</h3>
              <p className="text-gray-600 mb-4">
                When you create an account, we collect your email address and display name. If you
                sign in with Google, we receive your basic profile information from Google.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">Conversation Data</h3>
              <p className="text-gray-600 mb-4">
                When you use the Distill extension to capture a conversation, we process the
                conversation content you choose to share. You control what data is captured through
                our privacy modes:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>
                  <strong>Prompt-Only Mode:</strong> Only the distilled prompt template is stored.
                  The original conversation is processed but not retained.
                </li>
                <li>
                  <strong>Full Mode:</strong> The complete conversation is stored along with the
                  distilled prompt for reference.
                </li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">Usage Data</h3>
              <p className="text-gray-600 mb-4">
                We collect anonymized usage statistics to improve our service, including feature
                usage patterns and error reports. This data does not include conversation content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                How We Use Your Information
              </h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>To provide and maintain our service</li>
                <li>To process and distill your AI conversations into prompt templates</li>
                <li>To enable prompt sharing within your workspaces</li>
                <li>To improve our AI distillation and coaching features</li>
                <li>To communicate with you about service updates</li>
                <li>To respond to your support requests</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Data Storage and Security
              </h2>
              <p className="text-gray-600 mb-4">
                Your data is stored securely using industry-standard encryption. We use:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>HTTPS encryption for all data transmission</li>
                <li>Encrypted database storage</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
              <p className="text-gray-600 mb-4">
                We use the following third-party services to process your data:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>
                  <strong>OpenAI / Anthropic:</strong> For AI-powered distillation and coaching
                  features
                </li>
                <li>
                  <strong>Google OAuth:</strong> For optional sign-in authentication
                </li>
                <li>
                  <strong>Analytics providers:</strong> For anonymized usage statistics
                </li>
              </ul>
              <p className="text-gray-600 mt-4">
                Conversation data sent to AI providers is processed according to their respective
                privacy policies and is not used to train their models when using our API
                integrations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Browser Extension Permissions
              </h2>
              <p className="text-gray-600 mb-4">
                Our browser extension requires the following permissions:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>
                  <strong>storage:</strong> To save your preferences locally
                </li>
                <li>
                  <strong>activeTab:</strong> To read conversation content when you click capture
                </li>
                <li>
                  <strong>contextMenus:</strong> To provide right-click capture option
                </li>
                <li>
                  <strong>Host permissions for AI sites:</strong> To access conversations on
                  ChatGPT, Claude, Gemini, and Copilot
                </li>
              </ul>
              <p className="text-gray-600 mt-4">
                The extension only reads page content when you explicitly trigger a capture action.
                It does not continuously monitor or record your browsing activity.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Sharing</h2>
              <p className="text-gray-600 mb-4">
                We do not sell your personal information. We may share data in these circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>
                  <strong>Workspace sharing:</strong> Prompts you choose to share are visible to
                  workspace members
                </li>
                <li>
                  <strong>Public prompts:</strong> Prompts marked as public may be visible to other
                  users
                </li>
                <li>
                  <strong>Legal requirements:</strong> If required by law or to protect our rights
                </li>
                <li>
                  <strong>Service providers:</strong> With vendors who help operate our service,
                  under confidentiality agreements
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-600 mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and associated data</li>
                <li>Export your prompts and data</li>
                <li>Opt out of non-essential data collection</li>
              </ul>
              <p className="text-gray-600 mt-4">
                To exercise these rights, contact us at privacy@distill.app.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Retention</h2>
              <p className="text-gray-600 mb-4">
                We retain your data as long as your account is active. When you delete your account:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Personal information is deleted within 30 days</li>
                <li>Anonymized usage data may be retained for analytics</li>
                <li>Backup copies are purged within 90 days</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Children&apos;s Privacy</h2>
              <p className="text-gray-600">
                Our service is not intended for users under 13 years of age. We do not knowingly
                collect personal information from children under 13.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
              <p className="text-gray-600">
                We may update this Privacy Policy from time to time. We will notify you of any
                changes by posting the new policy on this page and updating the &quot;Last
                updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600">
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-gray-600 mt-2">Email: privacy@distill.app</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
