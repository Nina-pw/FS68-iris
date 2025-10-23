// src/pages/Privacy.tsx
import React from "react";

export default function Privacy() {
  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", lineHeight: 1.6 }}>
      <h1>Privacy Policy</h1>
      <p>
        At IRIS, we value your privacy. This Privacy Policy explains how we
        collect, use, and protect your information.
      </p>

      <h2>Information We Collect</h2>
      <ul>
        <li>Email address, name, and account information when you register.</li>
        <li>Usage data such as login activity and preferences.</li>
      </ul>

      <h2>How We Use Information</h2>
      <ul>
        <li>To provide and improve our services.</li>
        <li>
          To send verification emails, order confirmations, or service updates.
        </li>
        <li>To ensure account security and prevent fraud.</li>
      </ul>

      <h2>Data Protection</h2>
      <p>
        We use reasonable technical and organizational measures to protect your
        information. Your data is never sold to third parties.
      </p>

      <h2>Contact</h2>
      <p>
        If you have questions, please contact us at{" "}
        <a href="mailto:support@iris.com">support@iris.com</a>.
      </p>
    </div>
  );
}
