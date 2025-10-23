import { Link } from "react-router-dom";
import {
  FaInstagram, FaFacebookF, FaTwitter, FaYoutube, FaPinterest,
} from "react-icons/fa";
import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="ft">
      <div className="ft__container">
        {/* LEFT: Newsletter */}
        <section className="ft__newsletter">
          <h3 className="ft__eyebrow">
            SIGN UP FOR EMAIL AND/OR TEXTS FOR<br />
            THE LATEST UPDATES, SPECIAL OFFERS,<br />
            AND MORE.
          </h3>

          <p className="ft__disclaimer">
            By entering your email address and clicking “Join Us” you agree to
            receive marketing email messages from IRIS at the email address provided.
            Unsubscribe at any time. View our <a href="#">Privacy Policy</a> &nbsp;and&nbsp;
            <a href="#">Terms of Service</a>.
          </p>

          <form className="ft__form" onSubmit={(e)=>e.preventDefault()}>
            <label className="ft__field">
              <input type="email" placeholder="Your Email" aria-label="Your Email"/>
              <button className="ft__inlineBtn" aria-label="Join email list">
                JOIN US <span aria-hidden>›</span>
              </button>
            </label>
          </form>

          <p className="ft__disclaimer">
            By clicking “join us”, you agree to receive recurring automated
            marketing text messages (e.g. AI content, cart reminders) from IRIS
            at the number you provide. Consent not a condition of purchase.
            Reply HELP for help &amp; STOP to cancel. Msg frequency varies.
            Msg &amp; data rates may apply. By clicking this button, you also
            agree to our <a href="#">Terms</a> (incl. arbitration) &amp;&nbsp;
            <a href="#">Privacy Policy</a>.
          </p>

          <form className="ft__form" onSubmit={(e)=>e.preventDefault()}>
            <label className="ft__field">
              <input type="tel" placeholder="Your Mobile #" aria-label="Your Mobile number"/>
              <button className="ft__inlineBtn" aria-label="Join SMS list">
                JOIN US <span aria-hidden>›</span>
              </button>
            </label>
          </form>

          <div className="ft__social">
            <a href="#" aria-label="Instagram"><FaInstagram/></a>
            <a href="#" aria-label="Facebook"><FaFacebookF/></a>
            <a href="#" aria-label="Twitter / X"><FaTwitter/></a>
            <a href="#" aria-label="YouTube"><FaYoutube/></a>
            <a href="#" aria-label="Pinterest"><FaPinterest/></a>
          </div>
        </section>

        {/* RIGHT: Link columns */}
        <section className="ft__links">
          <div className="ft__col">
            <div className="ft__colTitle">SHOP</div>
            <Link to="/categories/face">Face</Link>
            <Link to="/categories/eyes">Eye</Link>
            <Link to="/categories/lips">Lip</Link>
            <Link to="/categories/tools">Tools</Link>
            <Link to="/categories/online-only">Online Only</Link>
          </div>

          <div className="ft__col">
            <div className="ft__colTitle">CUSTOMER SERVICE</div>
            <Link to="/contact">Contact Us</Link>
            <Link to="/shipping-returns">Shipping &amp; Returns</Link>
            <Link to="/returns/start">Start a Return</Link>
            <Link to="/faqs">FAQs</Link>
            <Link to="/giftcard-balance">Gift Card Balance</Link>
            <Link to="/shade-match">Shade Match Live Chat</Link>
            <Link to="/accessibility">Accessibility</Link>
          </div>

          <div className="ft__col">
            <div className="ft__colTitle">COMPANY</div>
            <Link to="/about">About Us</Link>
            <Link to="/impact">Rare Impact</Link>
            <Link to="/accessible">Made Accessible</Link>
            <Link to="/sustainability">Sustainability</Link>
            <Link to="/stores">Store Locator</Link>
          </div>
        </section>
      </div>

      {/* bottom legal bar */}
      <div className="ft__bottom">
        <div className="ft__legal">
          © {year} IRIS Beauty all rights reserved
        </div>
        <nav className="ft__legalLinks">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="#">UGC Terms of Service</a>
          <a href="#">Your Privacy Choices</a>
          <a href="#">Notice at Collection</a>
        </nav>
      </div>
    </footer>
  );
}
