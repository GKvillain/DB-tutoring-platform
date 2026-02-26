import { useState, useEffect } from "react";

export function DailyTracker() {
  const [today, setToday] = useState("");
  const [isLastDay, setIsLastDay] = useState(false);

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();

      const formatted = now.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      setToday(formatted);

      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      setIsLastDay(tomorrow.getDate() === 1);
    };

    updateDate();

    const interval = setInterval(updateDate, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>{today}</h2>
      {isLastDay && <p>วันนี้เป็นวันสุดท้ายของเดือน!</p>}
    </div>
  );
}
