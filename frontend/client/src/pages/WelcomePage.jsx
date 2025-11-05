import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  AlertTriangle,
  Users,
  Briefcase,
  Search,
  CheckCircle,
  XCircle,
  Heart,
  DollarSign,
  Clock,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const WelcomePage = () => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const navigate = useNavigate();
  const { authUser } = useAuthStore();

  const handleAccept = () => {
    if (!acceptedTerms) {
      toast.error("Please accept the terms and conditions to proceed");
      return;
    }
    // Store terms acceptance in localStorage
    localStorage.setItem("termsAccepted", "true");
    localStorage.setItem("termsAcceptedAt", new Date().toISOString());
    // Remove new user flag since they've accepted terms
    localStorage.removeItem("isNewUser");
    // Use window.location to force navigation and re-render
    window.location.href = "/chat";
  };

  const useCases = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Social Relating",
      description:
        "Connect with others in meaningful conversations. Build relationships where both parties are committed to quality engagement.",
    },
    {
      icon: <Briefcase className="w-8 h-8" />,
      title: "Casual Interviews",
      description:
        "Conduct informal interviews or casual professional discussions. Both parties stake tokens to ensure serious participation.",
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: "Interrogation",
      description:
        "Ask questions and get honest answers. The staking mechanism ensures both parties are invested in the conversation quality.",
    },
  ];

  const rules = [
    {
      title: "Staking Requirement",
      description:
        "Both users must stake 3 tokens ($3) to start a conversation.",
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      title: "Response Time",
      description:
        "You have 1 minute to respond when someone starts a conversation timer.",
      icon: <Clock className="w-5 h-5" />,
    },
    {
      title: "Life-Line System",
      description:
        "Each user starts with 5 life-line points. Low-quality messages deduct 1 point, toxic messages deduct 2 points.",
      icon: <Heart className="w-5 h-5" />,
    },
    {
      title: "AI Moderation",
      description:
        "All messages are analyzed by AI for quality and toxicity. Violations result in automatic point deductions.",
      icon: <Shield className="w-5 h-5" />,
    },
  ];

  const risks = [
    {
      title: "Loss of Stake",
      description:
        "If you fail to respond within 1 minute or run out of life-line points, you lose your 3 token stake.",
      severity: "high",
    },
    {
      title: "Compensation Payment",
      description:
        "If you don't respond in time or violate rules, the other party may claim compensation (5 tokens) from your stake.",
      severity: "high",
    },
    {
      title: "No Refund on Violations",
      description:
        "Once you violate rules and lose points, there's no way to recover them. Points are permanently deducted.",
      severity: "medium",
    },
    {
      title: "AI Analysis Errors",
      description:
        "While rare, AI moderation may occasionally misclassify messages. Appeals are not guaranteed.",
      severity: "low",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-full mb-6">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to DoTrust
          </h1>
          <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
            A staking-based chat platform where quality conversations are
            enforced through financial commitment and AI moderation.
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            How It Works
          </h2>
          <div className="space-y-4">
            <p className="text-base-content/80">
              DoTrust is a revolutionary chat platform that uses cryptocurrency
              staking and AI moderation to ensure meaningful, respectful
              conversations. Both parties must stake tokens before chatting, and
              violations of conversation quality result in automatic penalties.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              {rules.map((rule, index) => (
                <div
                  key={index}
                  className="bg-base-200 rounded-lg p-4 flex gap-3"
                >
                  <div className="text-primary flex-shrink-0">{rule.icon}</div>
                  <div>
                    <h3 className="font-semibold mb-1">{rule.title}</h3>
                    <p className="text-sm text-base-content/70">
                      {rule.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Use Cases</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="bg-base-200 rounded-lg p-6 text-center hover:shadow-md transition-shadow"
              >
                <div className="text-primary mb-4 flex justify-center">
                  {useCase.icon}
                </div>
                <h3 className="font-semibold mb-2">{useCase.title}</h3>
                <p className="text-sm text-base-content/70">
                  {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Risks & Losses */}
        <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-warning" />
            Risks & Potential Losses
          </h2>
          <div className="space-y-4">
            {risks.map((risk, index) => (
              <div
                key={index}
                className={`border-l-4 rounded p-4 ${
                  risk.severity === "high"
                    ? "border-error bg-error/10"
                    : risk.severity === "medium"
                    ? "border-warning bg-warning/10"
                    : "border-info bg-info/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  {risk.severity === "high" ? (
                    <XCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-semibold mb-1">{risk.title}</h3>
                    <p className="text-sm text-base-content/70">
                      {risk.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Terms and Conditions</h2>
          <div className="bg-base-200 rounded-lg p-4 max-h-64 overflow-y-auto mb-4">
            <div className="space-y-3 text-sm text-base-content/80">
              <p>
                <strong>1. Staking Agreement:</strong> By participating in
                DoTrust, you agree to stake 3 tokens ($3) before initiating or
                accepting a conversation. This stake is at risk if you violate
                the platform rules.
              </p>
              <p>
                <strong>2. Response Time:</strong> You must respond to messages
                within 1 minute when a conversation timer is active. Failure to
                respond results in forfeiture of your stake.
              </p>
              <p>
                <strong>3. Life-Line System:</strong> You start with 5 life-line
                points per conversation. Low-quality messages (e.g., "ok",
                "lol", "idk") deduct 1 point. Toxic messages (harassment,
                insults, threats) deduct 2 points. Reaching 0 points results in
                automatic forfeit.
              </p>
              <p>
                <strong>4. AI Moderation:</strong> All messages are analyzed by
                AI for quality and toxicity. The AI's decisions are final and
                automated. While we strive for accuracy, false positives may
                occur.
              </p>
              <p>
                <strong>5. Compensation:</strong> If your conversation partner
                violates rules or fails to respond, you may claim compensation
                (5 tokens) through the smart contract. If you violate rules, you
                forfeit your stake to the other party.
              </p>
              <p>
                <strong>6. Refund Policy:</strong> Refunds are only available if
                your conversation partner fails to stake back within 1 minute of
                your initial message. No refunds are given for rule violations.
              </p>
              <p>
                <strong>7. No Guarantees:</strong> DoTrust does not guarantee
                conversation quality, response times, or AI accuracy. You
                participate at your own risk.
              </p>
              <p>
                <strong>8. Prohibited Activities:</strong> Harassment, spam,
                threats, illegal activities, and any form of abuse are strictly
                prohibited and will result in immediate forfeiture.
              </p>
              <p>
                <strong>9. Platform Discretion:</strong> DoTrust reserves the
                right to modify rules, penalties, and AI moderation criteria at
                any time without prior notice.
              </p>
              <p>
                <strong>10. Acceptance:</strong> By clicking "I Agree", you
                acknowledge that you have read, understood, and agree to be
                bound by these terms and conditions.
              </p>
            </div>
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="checkbox checkbox-primary mt-1"
            />
            <span className="text-sm text-base-content/80">
              I have read and agree to the Terms and Conditions. I understand
              that I may lose my stake if I violate the rules or fail to respond
              in time.
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleAccept}
            disabled={!acceptedTerms}
            className={`btn btn-primary btn-lg ${
              !acceptedTerms ? "btn-disabled" : ""
            }`}
          >
            <CheckCircle className="w-5 h-5 mr-2" />I Agree - Proceed to Chat
          </button>
        </div>

        {/* Warning */}
        <div className="mt-8 bg-warning/20 border border-warning rounded-lg p-4 text-center">
          <p className="text-sm font-semibold text-warning">
            ⚠️ Important: Once you accept, you will be able to start staking and
            chatting. Make sure you understand all risks before proceeding.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
