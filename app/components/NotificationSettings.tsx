import React from 'react';
import { X, Bell, BookOpen, Clock, Calendar } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const { settings, updateSettings, requestPermission, permission } = useNotification();

  if (!isOpen) return null;

  const toggles = [
    { key: 'prayers', label: 'Prayer Times', icon: Clock, description: 'Get notified for Adhan times' },
    { key: 'quran', label: 'Daily Quran', icon: BookOpen, description: 'Daily verse and reading reminders' },
    { key: 'dhikr', label: 'Dhikr Goals', icon: Bell, description: 'Reminders for daily dhikr goals' },
    { key: 'events', label: 'Islamic Events', icon: Calendar, description: 'Alerts for important dates' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-dark w-full max-w-sm rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold font-quicksand text-white mb-6">
          Notifications
        </h3>
        
        {permission !== 'granted' && (
          <div className="bg-gold/20 border border-gold/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-white/90 mb-2">
              Enable push notifications to receive alerts.
            </p>
            <button
              onClick={requestPermission}
              className="text-xs bg-gold hover:bg-gold-light text-white px-3 py-1 rounded-full transition-colors font-bold"
            >
              Enable Permission
            </button>
          </div>
        )}

        <div className="space-y-3">
          {toggles.map((toggle) => {
            const Icon = toggle.icon;
            // @ts-ignore
            const isEnabled = settings[toggle.key];
            
            return (
              <div key={toggle.key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/10 rounded-lg text-gold-light">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{toggle.label}</h4>
                    <p className="text-xs text-white/50">{toggle.description}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => updateSettings({ [toggle.key]: !isEnabled })}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
                    isEnabled ? 'bg-gold' : 'bg-white/20'
                  }`}
                >
                  <div 
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${
                      isEnabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
