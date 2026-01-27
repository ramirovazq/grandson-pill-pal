const FloatingPills = () => {
  const pills = [
    { emoji: "💊", size: "text-3xl", position: "top-20 left-[10%]", delay: "0s", duration: "4s" },
    { emoji: "💉", size: "text-2xl", position: "top-32 right-[15%]", delay: "0.5s", duration: "5s" },
    { emoji: "🩺", size: "text-4xl", position: "top-[40%] left-[5%]", delay: "1s", duration: "4.5s" },
    { emoji: "❤️", size: "text-2xl", position: "top-[60%] right-[8%]", delay: "1.5s", duration: "3.5s" },
    { emoji: "⏰", size: "text-3xl", position: "bottom-32 left-[12%]", delay: "2s", duration: "5s" },
    { emoji: "🌟", size: "text-2xl", position: "bottom-40 right-[20%]", delay: "0.8s", duration: "4s" },
    { emoji: "💪", size: "text-3xl", position: "top-[25%] right-[5%]", delay: "1.2s", duration: "4.5s" },
    { emoji: "🏥", size: "text-2xl", position: "bottom-20 right-[35%]", delay: "0.3s", duration: "5s" },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {pills.map((pill, index) => (
        <div
          key={index}
          className={`absolute ${pill.position} ${pill.size} animate-float opacity-30`}
          style={{
            animationDelay: pill.delay,
            animationDuration: pill.duration,
          }}
        >
          {pill.emoji}
        </div>
      ))}
    </div>
  );
};

export default FloatingPills;
