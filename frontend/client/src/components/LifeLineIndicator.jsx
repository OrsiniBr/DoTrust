import { Heart } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const LifeLineIndicator = ({ chatId }) => {
  const { lifeLinePoints, hasDeposited } = useChatStore();
  const { authUser } = useAuthStore();

  if (!chatId || !authUser || !hasDeposited(chatId)) return null;

  const myPoints = lifeLinePoints[chatId]?.myPoints ?? 5;
  const opponentPoints = lifeLinePoints[chatId]?.opponentPoints ?? 5;

  const renderHearts = (points) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Heart
        key={i}
        className={`w-4 h-4 ${
          i < points
            ? "text-red-500 fill-red-500"
            : "text-gray-300 fill-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="flex items-center gap-4 p-2 bg-base-200 rounded-lg">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-base-content/70">Your Life-Lines</span>
        <div className="flex items-center gap-1">
          {renderHearts(myPoints)}
          <span className="ml-1 text-xs font-semibold">{myPoints}/5</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-base-content/70">Opponent</span>
        <div className="flex items-center gap-1">
          {renderHearts(opponentPoints)}
          <span className="ml-1 text-xs font-semibold">{opponentPoints}/5</span>
        </div>
      </div>
    </div>
  );
};

export default LifeLineIndicator;
