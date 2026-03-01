import { useState, useEffect } from "react";

export function useDateInfo() {
  const [dateInfo, setDateInfo] = useState({
    todayFormatted: "",
    month: 0,
    year: 0,
    isLastDay: false,
  });

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();

      const formatted = now.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);

      setDateInfo({
        todayFormatted: formatted,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        isLastDay: tomorrow.getDate() === 1,
      });
    };

    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  return dateInfo;
}
