import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface NotificationSettings {
  prayers: boolean;
  quran: boolean;
  dhikr: boolean;
  events: boolean;
}

interface NotificationContextType {
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  requestPermission: () => Promise<void>;
  permission: NotificationPermission;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    prayers: true,
    quran: true,
    dhikr: true,
    events: true,
  });
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('notificationSettings', JSON.stringify(updated));
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  return (
    <NotificationContext.Provider value={{ settings, updateSettings, requestPermission, permission }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
