import { useEffect, useState } from 'react';
import { supabase } from '@/contexts/SupabaseContext';

interface SalonSettings {
  salon_name: string;
  logo_url?: string;
}

let cachedSettings: SalonSettings | null = null;

export function useSalonSettings() {
  const [settings, setSettings] = useState<SalonSettings | null>(cachedSettings);
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    if (cachedSettings) return;

    let isMounted = true;

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('salon_name, logo_url')
          .single();

        if (error) throw error;

        if (data && isMounted) {
          cachedSettings = data;
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching salon settings:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  return { settings, loading };
}
