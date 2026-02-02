import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: February 2, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground">
              Welcome to The Spot ("we," "our," or "us"). We are committed to protecting your privacy 
              and ensuring the security of your personal information. This Privacy Policy explains how 
              we collect, use, disclose, and safeguard your information when you use our mobile application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
            <p className="text-muted-foreground mb-2">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Account information (email, username, display name)</li>
              <li>Profile information (avatar, bio)</li>
              <li>Workout data (exercises, sets, reps, weights)</li>
              <li>Location data (to find nearby gyms, with your permission)</li>
              <li>Messages and communications with other users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-2">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Provide, maintain, and improve our services</li>
              <li>Connect you with nearby gyms and other users</li>
              <li>Track and display your workout progress</li>
              <li>Send you notifications about your account and activities</li>
              <li>Respond to your comments, questions, and requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Information Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell, trade, or rent your personal information to third parties. We may share 
              your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
              <li>With your consent or at your direction</li>
              <li>With other users (profile information, gym memberships) based on your privacy settings</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights, privacy, safety, or property</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction. Your data 
              is encrypted in transit and at rest using industry-standard protocols.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Your Rights and Choices</h2>
            <p className="text-muted-foreground mb-2">You have the right to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Access, update, or delete your personal information</li>
              <li>Control your privacy settings and visibility on leaderboards</li>
              <li>Opt out of push notifications</li>
              <li>Request a copy of your data</li>
              <li>Delete your account at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Location Data</h2>
            <p className="text-muted-foreground">
              We collect location data only when you grant permission, and only to show you nearby gyms 
              and connect you with users at your gym. You can revoke location permissions at any time 
              through your device settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Third-Party Services</h2>
            <p className="text-muted-foreground">
              Our app integrates with third-party services including Google Maps (for gym locations) 
              and authentication providers (Apple, Google). These services have their own privacy policies 
              that govern their use of your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our service is not intended for users under the age of 13. We do not knowingly collect 
              personal information from children under 13. If we learn that we have collected such 
              information, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy or our practices, please contact us 
              at support@thespotapp.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
