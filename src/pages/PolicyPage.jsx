import { useParams } from "react-router-dom";
import PolicyNavigation from "../components/policy/PolicyNavigation";

/* ===============================
   POLICY CONTENT (TEMP / SAFE)
================================ */
const POLICY_CONTENT = {
    shipping: {
        title: "Shipping Policy",
        body: `
We process all orders within 1–3 business days.
Delivery time depends on your location.
Once shipped, tracking details will be shared.
        `,
    },

    refund: {
        title: "Refund Policy",
        body: `
Refunds are accepted within 7 days of delivery.
Items must be unused and in original packaging.
Shipping fees are non-refundable.
        `,
    },

    privacy: {
        title: "Privacy Policy",
        body: `
We respect your privacy.
Your data is never sold or shared with third parties.
We only collect what is necessary to process orders.
        `,
    },

    terms: {
        title: "Terms & Conditions",
        body: `
By using our website, you agree to our terms.
We reserve the right to update these terms at any time.
        `,
    },
};

export default function PolicyPage() {
    const { policyKey } = useParams();
    const policy = POLICY_CONTENT[policyKey];

    if (!policy) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                Policy not found
            </div>
        );
    }

    return (
        <section className="min-h-screen bg-black text-white exr-section">
            <div className="exr-container max-w-3xl">

                {/* TITLE */}
                <h1 className="exr-title mb-10">
                    {policy.title}
                </h1>

                {/* BODY */}
                <div className="exr-text whitespace-pre-line mb-16">
                    {policy.body}
                </div>

                {/* PREV / NEXT NAVIGATION */}
                <PolicyNavigation currentKey={policyKey} />
            </div>
        </section>
    );
}