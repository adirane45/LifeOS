'use client';

import { useEffect, useState } from 'react';

export default function LastUpdatedTimestamp() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    // Set initial time
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    
    updateTime();
    
    // Update every 60 seconds
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  return (
    <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
      Last updated: {time}
    </div>
  );
}
