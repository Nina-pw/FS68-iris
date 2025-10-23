// src/pages/Terms.tsx
import React from "react";

export default function Terms() {
  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", lineHeight: 1.6 }}>
      <h1>Terms of Service</h1>
      <p>
        These Terms of Service (“Terms”) govern your use of the IRIS platform.
        By creating an account or using our services, you agree to these Terms.
      </p>

      <h2>Accounts</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account
        and password. You agree to provide accurate and complete information.
      </p>

      <h2>Acceptable Use</h2>
      <ul>
        <li>You will not use the service for unlawful activities.</li>
        <li>
          You will not attempt to disrupt or gain unauthorized access to our
          systems.
        </li>
      </ul>

      <h2>Termination</h2>
      <p>
        We may suspend or terminate your account if you violate these Terms.
      </p>

      <h2>Limitation of Liability</h2>
      <p>
        We provide the service “as is” and are not liable for any indirect or
        incidental damages.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about these Terms, contact us at{" "}
        <a href="mailto:support@iris.com">support@iris.com</a>.
      </p>
    </div>
  );
}
